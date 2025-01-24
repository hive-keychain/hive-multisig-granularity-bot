import path from "path";

require("dotenv").config();

export const Config = {
  port: process.env.PORT || 5001,
  multisigServer:
    process.env.MULTISIG_BACKEND_URL ||
    "https://api-multisig.hive-keychain.com",
  logger: {
    folder: path.join(__dirname, "..", "logs"),
    file: "multisig-bot-%DATE%.log",
    levels: {
      TECHNICAL: 1,
      INFO: 1,
      ERROR: 0,
      OPERATION: 1,
      DEBUG: 1,
      WARN: 1,
    },
  },
  parser: {
    infoFilePath: process.env.INFO_FILE_PATH,
    defaultBlock: process.env.DEFAULT_BLOCK ?? 92713029,
  },
  bot: {
    account: process.env.BOT_ACCOUNT_NAME,
    activeKey: process.env.BOT_ACTIVE_KEY,
    activePubKey: process.env.BOT_ACTIVE_PUB_KEY,
    postingKey: process.env.BOT_POSTING_KEY,
    postingPubKey: process.env.BOT_POSTING_PUB_KEY,
  },
};
