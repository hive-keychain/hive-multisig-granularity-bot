import { FindOptionsSelect } from "typeorm";
import { DatabaseModule } from "../database/database.module";
import { AccountConfiguration } from "../database/entities/account-configuration.entity";

const getRepo = () => {
  return DatabaseModule.getDatabase().getRepository(AccountConfiguration);
};

const create = async (config: Partial<AccountConfiguration>) => {
  await getRepo().save(config);
};

const set2FAId = async (username: string, twoFaId: string) => {
  let accountConfig: Partial<AccountConfiguration> = await getRepo().findOne({
    where: { username: username },
  });
  if (!accountConfig) {
    accountConfig = {
      username: username,
      twoFAId: twoFaId,
      use2FAByDefault: true,
    };
  } else if (accountConfig) {
    accountConfig.twoFAId = twoFaId;
  }
  await getRepo().save(accountConfig);
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
      use2FAByDefault: true,
      username: true,
    } as FindOptionsSelect<AccountConfiguration>,
  });
};

const getFull = (username: string) => {
  return getRepo().findOne({
    where: { username: username },
  });
};

export const AccountConfigurationRepository = {
  create,
  update,
  set2FAId,
  get,
  getFull,
};
