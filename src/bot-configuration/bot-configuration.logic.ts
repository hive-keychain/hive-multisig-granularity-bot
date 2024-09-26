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

const getConfiguration = async (username: string) => {
  return await AccountConfigurationRepository.get(username);
};
const getFullConfiguration = async (username: string) => {
  return await AccountConfigurationRepository.getFull(username);
};

export const BotConfigurationLogic = {
  createConfig,
  getConfiguration,
  getFullConfiguration,
};
