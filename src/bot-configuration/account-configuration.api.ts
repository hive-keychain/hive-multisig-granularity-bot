import { Express } from "express";
import { BotConfigurationLogic } from "./bot-configuration.logic";

const setupGetByAccountName = (app: Express) => {
  app.get(`/account-configuration/:username`, async (req, res) => {
    try {
      // console.log("here");
      res
        .status(200)
        .send(
          await BotConfigurationLogic.getConfiguration(req.params.username)
        );
    } catch (e) {
      console.log(e);
      res.status(404).send("Error");
    }
  });
};

const setupApis = (app: Express) => {
  setupGetByAccountName(app);
};

export const AccountConfigurationApi = { setupApis };
