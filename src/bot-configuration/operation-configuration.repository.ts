import { DatabaseModule } from "../database/database.module";
import { AccountConfiguration } from "../database/entities/account-configuration.entity";
import { OperationConfiguration } from "../database/entities/operation-configuration.entity";

const getRepo = () => {
  return DatabaseModule.getDatabase().getRepository(OperationConfiguration);
};

const create = async (config: Partial<OperationConfiguration>) => {
  await getRepo().save(config);
};

const update = async () => {};

const add = async (
  config: Partial<OperationConfiguration>,
  accountConfiguration: AccountConfiguration
) => {
  await getRepo().save({
    accountConfiguration: accountConfiguration,
    ...config,
  });
};

const deleteAll = async (accountConfiguration: AccountConfiguration) => {
  await getRepo().delete({ accountConfiguration: accountConfiguration });
};

export const OperationConfigurationRepository = { create, add, deleteAll };
