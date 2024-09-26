import { KeychainKeyTypes } from "hive-keychain-commons";

export enum SocketMessageCommand {
  SIGNER_CONNECT = "signer_connect",
  REQUEST_SIGNATURE = "request_signature",
  REQUEST_SIGN_TRANSACTION = "request_sign_transaction",
  SIGN_TRANSACTION = "sign_transaction",
  REQUEST_LOCK = "request_lock",
  NOTIFY_TRANSACTION_BROADCASTED = "notify_transaction_broadcasted",
  TRANSACTION_BROADCASTED_NOTIFICATION = "transaction_broadcasted_notification",
  TRANSACTION_ERROR_NOTIFICATION = "transaction_error_notification",
  SEND_BACK_ERROR = "send_back_error",
}

export interface SocketMessage {
  command: string;
  payload: SocketMessagePayload;
}

export interface SocketMessagePayload {}

export interface MultisigErrorMessage extends SocketMessagePayload {
  signatureRequestId: number;
  error: {
    fullMessage: string;
    message: string;
  };
}

export interface NotifyTxBroadcastedMessage extends SocketMessagePayload {
  signatureRequestId: number;
}

export interface SignerConnectMessage extends SocketMessagePayload {
  publicKey: string;
  message: string;
  username: string;
}

export interface SignerConnectError {
  [username: string]: string;
}

export interface ISignatureRequest {
  id: number;
  expirationDate: Date;
  threshold: number;
  keyType: KeychainKeyTypes;
  signers: RequestSignatureSigner[];
  targetedPublicKey: string;
  initiator: string;
}

export interface SignatureRequestInitialSigner {
  username: string;
  publicKey: string;
  signature: string;
  weight: number;
}

export interface RequestSignatureMessage extends SocketMessagePayload {
  signatureRequest: ISignatureRequest;
  initialSigner: SignatureRequestInitialSigner;
}

export interface RequestSignatureSigner {
  id: number;
  encryptedTransaction: string; // Encrypted transaction with signer key
  publicKey: string;
  weight: string;
  metaData?: RequestSignatureSignerMetadata;
}

export interface RequestSignatureSignerMetadata {
  twoFACodes?: any;
}

export interface SignTransactionMessage extends SocketMessagePayload {
  signature: string;
  signerId: number;
  signatureRequestId: number;
}

export interface RefuseTransactionMessage extends SocketMessagePayload {
  signerId: number;
}
