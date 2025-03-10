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
    resolve(true);
  });
};

const handleRequestSignTransaction = async (
  signatureRequest: ISignatureRequest
) => {
  console.log("receiving tx", signatureRequest);
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
    if (!userConfig) {
      console.log(`No configuration found`);
      socket.emit(SocketMessageCommand.SEND_BACK_ERROR, {
        signatureRequestId: signatureRequest.id,
        error: {
          fullMessage: "No configuration found. Transaction can't be signed",
          message: "error_multisig_no_config_found",
        },
      } as MultisigErrorMessage);
      return;
    }

    let shouldSignTransaction = true;

    const ops = decodedTransaction.operations.map((operation: Operation) => {
      const id = operation[0] === "custom_json" ? operation[1].id : null;
      return { operationName: operation[0], id: id };
    });

    console.log("there");

    // Check if operations in transaction match all criterias
    // If one of them doesn't match, bot won't sign the transaction
    for (const op of ops) {
      const allUsersOperations = userConfig.operationConfigurations.filter(
        (opConfig) =>
          !opConfig.username && opConfig.operation === op.operationName
      );
      const specificUserOperations = userConfig.operationConfigurations.filter(
        (opConfig) =>
          opConfig.username === signatureRequest.initiator &&
          ((op.operationName === "custom_json" &&
            opConfig.extraData?.includes(op.id)) ||
            (op.operationName !== "custom_json" &&
              opConfig.operation === op.operationName))
      );

      console.log(allUsersOperations, specificUserOperations, op);

      if (!allUsersOperations.length && !specificUserOperations.length) {
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
              const result = await HiveUtils.getClient().broadcast.send(
                signedTransaction
              );
              socket.emit(
                SocketMessageCommand.NOTIFY_TRANSACTION_BROADCASTED,
                { signatureRequestId: signatureRequest.id, txId: result.id },
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
      console.log(`This operation isn't allowed under granularity rules`);
      socket.emit(SocketMessageCommand.SEND_BACK_ERROR, {
        signatureRequestId: signatureRequest.id,
        error: {
          fullMessage: "This operation isn't allowed under granularity rules",
          message: "error_granularity",
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
