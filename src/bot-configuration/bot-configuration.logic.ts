import { AccountConfiguration } from "../database/entities/account-configuration.entity";
import { OperationConfiguration } from "../database/entities/operation-configuration.entity";
import { JsonConfiguration } from "../json-configuration.interface";
import { AccountConfigurationRepository } from "./account-configuration.repository";
import { OperationConfigurationRepository } from "./operation-configuration.repository";

const createConfig = async (
  username: string,
  defaultConfig: Partial<AccountConfiguration>
) => {
  console.log("create config", username, defaultConfig);
  await AccountConfigurationRepository.create({
    username: defaultConfig.username,
  });
};

const setConfig = async (username: string, config: JsonConfiguration) => {
  console.log(username, config);
  await AccountConfigurationRepository.deleteConfiguration(username);
  const configuration = await AccountConfigurationRepository.create({
    username: username,
  });

  for (const conf of config.configurations) {
    for (const op of conf.operations) {
      await OperationConfigurationRepository.add(
        {
          username: conf.authority,
          operation: op.operationName as OperationConfiguration["operation"],
          extraData: op.id,
        },
        configuration
      );
    }
  }
};

const getConfiguration = async (username: string) => {
  const accountConfiguration = await AccountConfigurationRepository.get(
    username
  );
  const operationConfigurations = [];
  for (const conf of accountConfiguration.operationConfigurations) {
    operationConfigurations.push({ ...conf, ids: conf.extraData });
  }
  return {
    ...accountConfiguration,
    operationConfigurations: operationConfigurations,
  };
};
const getFullConfiguration = async (username: string) => {
  return await AccountConfigurationRepository.getFull(username);
};

export const BotConfigurationLogic = {
  createConfig,
  getConfiguration,
  getFullConfiguration,
  setConfig,
};
