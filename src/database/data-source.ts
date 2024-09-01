/* istanbul ignore file */

import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { AccountConfiguration } from "./entities/account-configuration.entity";
import { OperationConfiguration } from "./entities/operation-configuration.entity";
import { OperationCriteria } from "./entities/operation-criteria.entity";

export const MultisigBotDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [AccountConfiguration, OperationConfiguration, OperationCriteria],
  migrations: ["src/database/migrations/*.ts"],
  subscribers: [],
});
