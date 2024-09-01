import * as hive from "@hiveio/hive-js";
import { AccountConfiguration } from "../database/entities/account-configuration.entity";
import { AccountConfigurationRepository } from "./account-configuration.repository";

const createConfig = async (
  username: string,
  defaultConfig: Partial<AccountConfiguration>
) => {
  console.log("create config", username, defaultConfig);
  await AccountConfigurationRepository.create({
    username: defaultConfig.username,
  });
};

const setConfig = (
  username: string,
  config: Partial<AccountConfiguration>
) => {};

const set2FAId = async (username: string, json: any) => {
  console.log(process.env.BOT_ACTIVE_KEY, json.twoFaId.toString());
  const decodedMessage = hive.memo.decode(
    process.env.BOT_MEMO_KEY,
    json.twoFaId.toString()
  );

  const twoFaId = decodedMessage.replace("#", "");

  await AccountConfigurationRepository.set2FAId(username, twoFaId);
};

const getConfiguration = async (username: string) => {
  return await AccountConfigurationRepository.get(username);
};
const getFullConfiguration = async (username: string) => {
  return await AccountConfigurationRepository.getFull(username);
};

export const BotConfigurationLogic = {
  createConfig,
  set2FAId,
  getConfiguration,
  getFullConfiguration,
};
