import { FindOptionsSelect } from "typeorm";
import { DatabaseModule } from "../database/database.module";
import { AccountConfiguration } from "../database/entities/account-configuration.entity";
import { OperationConfigurationRepository } from "./operation-configuration.repository";

const getRepo = () => {
  return DatabaseModule.getDatabase().getRepository(AccountConfiguration);
};

const create = async (config: Partial<AccountConfiguration>) => {
  return await getRepo().save(config);
};

const update = async () => {};

const get = (username: string) => {
  return getRepo().findOne({
    where: { username: username },
    select: {
      id: true,
      createdAt: true,
      operationConfigurations: true,
      updatedAt: true,
      username: true,
    } as FindOptionsSelect<AccountConfiguration>,
    loadEagerRelations: true,
    relations: ["operationConfigurations"],
  });
};

const getFull = (username: string) => {
  return getRepo().findOne({
    where: { username: username },
  });
};

const deleteConfiguration = async (username: string) => {
  const accountConfig = await getRepo().findOne({
    where: { username: username },
  });
  await OperationConfigurationRepository.deleteAll(accountConfig);
  return getRepo().delete({ username: username });
};

export const AccountConfigurationRepository = {
  create,
  update,
  get,
  getFull,
  deleteConfiguration,
};
