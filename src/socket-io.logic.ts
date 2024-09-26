import { Operation } from "@hiveio/dhive";
import { KeychainKeyTypes } from "hive-keychain-commons";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { authenticator } from "otplib";
import { Socket, io } from "socket.io-client";
import { BotConfigurationLogic } from "./bot-configuration/bot-configuration.logic";
import { Config } from "./config";
import {
  ISignatureRequest,
  MultisigErrorMessage,
  RequestSignatureSigner,
  SignerConnectMessage,
  SocketMessageCommand,
} from "./socket-message.interface";
import { HiveUtils } from "./utils/hive.utils";
import { MultisigUtils } from "./utils/multisig.utils";
authenticator.options = {
  window: 1,
};
let socket: Socket;

const rateLimitingArray: { [id: string]: number } = {};

const checkRateLimiting = (id: string) => {
  if (!rateLimitingArray[id]) {
    rateLimitingArray[id] = 0;
  }

  if (rateLimitingArray[id] === 2) {
    console.log("rate limiting reached");
    return false;
  } else {
    rateLimitingArray[id] = rateLimitingArray[id] + 1;
    setTimeout(() => {
      removeFromRateLimiting(id);
    }, 30000);
    console.log("return true", rateLimitingArray);
    return true;
  }
};

const removeFromRateLimiting = (id: string) => {
  if (rateLimitingArray[id] > 1) {
    rateLimitingArray[id] = rateLimitingArray[id] - 1;
  } else if (rateLimitingArray[id] === 1) {
    delete rateLimitingArray[id];
  }
  console.log("removing", rateLimitingArray);
};

const init = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    Logger.technical(`Initializing socket.io on ${Config.multisigServer}`);

    socket = io(Config.multisigServer, {});

    socket.on("connect", () => {
      console.log("connected");
      resolve(connectMultisigAccount());
    });
    socket.on("error", (err) => {
      Logger.error("Error in socket", err);
    });
    socket.on("disconnect", (ev) => {
      Logger.info("Disconnected from socket");
    });

    socket.on(
      SocketMessageCommand.REQUEST_SIGN_TRANSACTION,
      handleRequestSignTransaction
    );
  });
};

const handleRequestSignTransaction = async (
  signatureRequest: ISignatureRequest
) => {
  // console.log(signatureRequest);
  const signer = signatureRequest.signers.find(
    (signer: RequestSignatureSigner) => {
      return signer.publicKey === signatureRequest.targetedPublicKey;
    }
  );

  if (!signer) {
    return;
  } else {
    let key: string;
    if (signatureRequest.keyType === KeychainKeyTypes.active) {
      key = process.env.BOT_ACTIVE_KEY.toString();
    } else if (signatureRequest.keyType === KeychainKeyTypes.posting) {
      key = process.env.BOT_POSTING_KEY.toString();
    }

    const decodedTransaction = await MultisigUtils.decodeTransaction(
      signer.encryptedTransaction,
      key
    );

    const transactionUsername =
      MultisigUtils.getUsernameFromTransaction(decodedTransaction);

    const userConfig = await BotConfigurationLogic.getFullConfiguration(
      transactionUsername
    );

    // if (!checkRateLimiting(userConfig.twoFAId)) {
    //   socket.emit(SocketMessageCommand.SEND_BACK_ERROR, {
    //     signatureRequestId: signatureRequest.id,
    //     error: {
    //       fullMessage: "Rate limiting reached. Try again later",
    //       message: "error_rate_limiting_reached",
    //     },
    //   } as MultisigErrorMessage);
    //   return;
    // }

    let shouldSignTransaction = true;

    const operationNames = decodedTransaction.operations.map(
      (operation: Operation) => operation[0]
    );

    // Check if operations in transaction match all criterias
    // If one of them doesn't match, bot won't sign the transaction
    for (const operationName of operationNames) {
      const allUsersOperations = userConfig.operationConfigurations.filter(
        (opConfig) => !opConfig.username && opConfig.operation === operationName
      );
      const specificUserOperations = userConfig.operationConfigurations.filter(
        (opConfig) =>
          opConfig.username === signatureRequest.initiator &&
          opConfig.operation === operationName
      );

      if (!allUsersOperations && !specificUserOperations) {
        shouldSignTransaction = false;
        break;
      }
    }

    if (shouldSignTransaction) {
      const signedTransaction = await HiveUtils.signTransaction(
        decodedTransaction,
        key
      );

      if (signedTransaction) {
        socket.emit(
          SocketMessageCommand.SIGN_TRANSACTION,
          {
            signature:
              signedTransaction.signatures[
                signedTransaction.signatures.length - 1
              ],
            signerId: signer.id,
            signatureRequestId: signatureRequest.id,
          },
          async (signatures) => {
            // Broadcast
            console.log("should broadcast", signatures);
            signedTransaction.signatures = signatures;
            try {
              await HiveUtils.getClient().broadcast.send(signedTransaction);
              socket.emit(
                SocketMessageCommand.NOTIFY_TRANSACTION_BROADCASTED,
                { signatureRequestId: signatureRequest.id },
                () => {
                  console.log("backend notified of broadcast");
                }
              );
            } catch (err) {
              Logger.error(`Error while broadcasting`, err);
            }
          }
        );
      }

      // wait for eventual broadcast request

      // HiveUtils;
    } else {
      console.log(`OTP couldn't be verified`);
      socket.emit(SocketMessageCommand.SEND_BACK_ERROR, {
        signatureRequestId: signatureRequest.id,
        error: {
          fullMessage: "OPT couldn't be verified",
          message: "error_otp_not_verified",
        },
      } as MultisigErrorMessage);
    }
  }
};

const connectMultisigAccount = async (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    Logger.info(
      `Trying to connect @${Config.bot.account} to the multisig backend server`
    );

    const signerConnectMessages: SignerConnectMessage[] = [];
    if (Config.bot.activeKey && Config.bot.activePubKey) {
      const message = HiveUtils.signMessage(
        Config.bot.account,
        Config.bot.activeKey
      );
      signerConnectMessages.push({
        username: Config.bot.account,
        publicKey: Config.bot.activePubKey,
        message: message,
      });
    }
    if (Config.bot.postingKey && Config.bot.postingPubKey) {
      const message = HiveUtils.signMessage(
        Config.bot.account,
        Config.bot.postingKey
      );
      signerConnectMessages.push({
        username: Config.bot.account,
        publicKey: Config.bot.postingPubKey,
        message: message,
      });
    }
    socket.emit(
      SocketMessageCommand.SIGNER_CONNECT,
      signerConnectMessages,
      (signerConnectResponse: any) => {
        console.log(signerConnectResponse);
        for (const signer of signerConnectMessages) {
          if (
            !(
              signerConnectResponse.errors &&
              Object.keys(signerConnectResponse.errors).includes(
                signer.publicKey
              )
            )
          ) {
            //TODO process pending transactions
            resolve(true);
          } else {
            reject(false);
          }
        }
      }
    );
  });
};

export const SocketIoLogic = { init };
