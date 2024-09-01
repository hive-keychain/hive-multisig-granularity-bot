import bodyParser from "body-parser";
import express from "express";
import { Express } from "express-serve-static-core";
import Logger from "hive-keychain-commons/lib/logger/logger";
import { createServer } from "http";
import https from "https";
import { BlockParserModule } from "./block-parser/block-parser.module";
import { AccountConfigurationApi } from "./bot-configuration/account-configuration.api";
import { Config } from "./config";
import { MultisigBotDataSource } from "./database/data-source";
import { DatabaseModule } from "./database/database.module";
import { SocketIoLogic } from "./socket-io.logic";
import { BotConfigurationUtils } from "./utils/bot-configuration.utils";
import { DataUtils } from "./utils/data.utils";
require("dotenv").config();

var cors = require("cors");

const initServerRoutine = async () => {
  const app = express();
  Logger.initLogger(Config.logger, process.env.NODE_ENV);
  setupRoutes(app);
  await BotConfigurationUtils.initConfigIfNecessary();
  await setupRoutines();
  startServer(app);
};

const setupRoutes = (app: Express) => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cors());
  setupApis(app);
};

const setupRoutines = async () => {
  Logger.technical("Setting up routines");
  await DatabaseModule.initDatabaseConnection(MultisigBotDataSource);
  await DataUtils.initStorage();
  await BlockParserModule.initializeValues();
  if (await SocketIoLogic.init()) {
    BlockParserModule.start();
  } else console.log("could not connect");
};

const setupApis = async (app: Express) => {
  AccountConfigurationApi.setupApis(app);
};

const startServer = (app: Express) => {
  if (!process.env.DEV) {
    https.createServer({}, app).listen(Config.port, () => {
      Logger.technical(`Https Server running on port ${Config.port}`);
    });
  } else {
    const httpServer = createServer(app);

    httpServer.listen(Config.port, () => {
      Logger.technical(`Running on port ${Config.port}`);
    });
  }
};

initServerRoutine();
