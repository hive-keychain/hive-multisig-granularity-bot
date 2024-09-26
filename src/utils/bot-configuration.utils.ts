import { AccountUpdate2Operation, Operation, PrivateKey } from "@hiveio/dhive";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { HiveUtils } from "./hive.utils";

const initConfigIfNecessary = async () => {
  const extendedAccount = (
    await HiveUtils.getClient().database.getAccounts([
      process.env.BOT_ACCOUNT_NAME!,
    ])
  )[0];

  const jsonMetadata = JSON.parse(extendedAccount.json_metadata);
  if (
    !jsonMetadata.isGranularityBot ||
    !jsonMetadata.configPath ||
    jsonMetadata.configPath !== process.env.CONFIG_PATH
  ) {
    Logger.info("Setting up configuration");
    try {
      await HiveUtils.getClient().broadcast.sendOperations(
        [
          [
            "account_update2",
            {
              account: process.env.BOT_ACCOUNT_NAME,
              json_metadata: JSON.stringify({
                isGranularityBot: true,
                configPath: process.env.CONFIG_PATH,
              }),
              posting_json_metadata: "",
              extensions: [],
            } as AccountUpdate2Operation[1],
          ] as Operation,
        ] as Operation[],
        PrivateKey.fromString(process.env.BOT_ACTIVE_KEY!.toString())
      );
    } catch (err) {
      console.log(err);
    }
  }

  console.log(extendedAccount.json_metadata);
};

export const BotConfigurationUtils = { initConfigIfNecessary };
