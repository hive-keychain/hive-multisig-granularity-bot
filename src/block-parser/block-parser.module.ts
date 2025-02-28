import { CustomJsonOperation, SignedBlock, Transaction } from "@hiveio/dhive";
import Logger from "hive-keychain-commons/lib/logger/logger";

import { BotConfigurationLogic } from "../bot-configuration/bot-configuration.logic";
import { Config } from "../config";
import { BlockchainUtils } from "../utils/blockchain.utils";
import { DataUtils, LayerOneBlockInfo } from "../utils/data.utils";
import { ConfigurationOperations } from "./block-parser.interface";

let averageDownloadTime = 0;
let averageProcessTime = 0;
let nbBlocksDownloaded = 0;
let nbBlocksProcessed = 0;

let currentBlock;
let currentBlockTime = Date.now();

let blockInfo: LayerOneBlockInfo;

let lastBlock: number;

let forceStop: boolean = false;

const initializeValues = async () => {
  averageDownloadTime = 0;
  averageProcessTime = 0;
  nbBlocksDownloaded = 0;
  nbBlocksProcessed = 0;

  currentBlockTime = Date.now();

  blockInfo = await DataUtils.getLayer1BlockInfo();
  currentBlock = blockInfo?.lastBlock ?? Config.parser.defaultBlock;

  lastBlock = undefined;

  forceStop = false;
  return;
};

const stop = () => {
  Logger.technical(`Stopping parser...`);
  forceStop = true;
  BlockParserModule.initializeValues();
};

const start = async () => {
  Logger.technical(`Starting block parser...`);
  await BlockParserModule.getNextBlock();

  setInterval(calculateDelay, 10000);
};

const getNextBlock = async () => {
  if (forceStop) {
    return;
  }

  try {
    nbBlocksDownloaded++;

    const start = Date.now();

    const startDL = Date.now();
    const promiseResults = await Promise.all([
      BlockchainUtils.getCurrentBlockNumber(),
      BlockchainUtils.getBlock(currentBlock),
    ]);
    const durationDL = Date.now() - startDL;
    averageDownloadTime =
      (averageDownloadTime * (nbBlocksDownloaded - 1) + durationDL) /
      nbBlocksDownloaded;

    lastBlock = promiseResults[0];

    if (currentBlock >= lastBlock - 3) {
      setTimeout(BlockParserModule.getNextBlock, 300);
      return;
    }

    const block: SignedBlock = promiseResults[1];

    if (!block) {
      // if new block doesnt exist yet, try again in 300ms
      setTimeout(BlockParserModule.getNextBlock, 300);
      return;
    }

    // const customJson: CustomJsonOperation = [
    //   "custom_json",
    //   {
    //     id: "multisig-gbot-config",
    //     required_auths: ["hrdcr-hive"],
    //     required_posting_auths: [],
    //     json: '{"configurations":[{"authority":"choibounge","operations":[{"operationName":"transfer"},{"operationName":"custom_json","id":["test_id","b"]},{"operationName":"delegate_vesting_shares"}]},{"operations":[{"operationName":"vote"},{"operationName":"comment"},{"operationName":"custom_json","id":["test_id","c","multisig-gbot-config"]}]}]}',
    //   },
    // ];

    // await processBlock({
    //   ...block,
    //   transactions: [{ ...block.transactions[0], operations: [customJson] }],
    // });

    await processBlock(block);

    await DataUtils.saveLayer1BlockInfo({ lastBlock: currentBlock });
    nbBlocksProcessed++;
    const duration = Date.now() - start;

    averageProcessTime =
      (averageProcessTime * (nbBlocksProcessed - 1) + duration) /
      nbBlocksProcessed;

    // update the last block and the time from last success (used in relaunchiffailed)
    currentBlockTime = Date.now();
    currentBlock++;

    // Attempt to load the nxt block after a 3 second delay, or faster if we're behind and need to catch up
    setTimeout(BlockParserModule.getNextBlock, 100); // TODO reactivate
  } catch (e) {
    Logger.error(`Error while getting block #${currentBlock}`, e);
    BlockParserModule.getNextBlock();
  }
};

const processBlock = async (block: SignedBlock) => {
  Logger.debug(`processing block #${currentBlock}`);

  const lastTransactionAttempted = 0;
  for (
    let i = lastTransactionAttempted ? lastTransactionAttempted : 0;
    i < block.transactions.length;
    i++
  ) {
    const tx = block.transactions[i];
    try {
      await BlockParserModule.processTransaction(tx, block, currentBlock);
    } catch (e) {
      Logger.error(`Error while parsing block #${currentBlock}`, e);
      continue;
    }
  }
};

const processTransaction = async (
  transaction: Transaction,
  block: SignedBlock,
  blockNumber: number
) => {
  for (const op of transaction.operations) {
    if (op[0] === "custom_json") {
      const customJson = op[1] as CustomJsonOperation[1];
      switch (customJson.id) {
        case ConfigurationOperations.SET_GLOBAL_CONFIG: {
          BotConfigurationLogic.setConfig(
            customJson.required_auths[0] ??
              customJson.required_posting_auths[1],
            JSON.parse(customJson.json)
          );
          break;
        }
        default:
          return;
      }
    }
  }
};

const calculateDelay = async () => {
  const lastBlockNumber = await BlockchainUtils.getCurrentBlockNumber();
  const nbBlocks = lastBlockNumber - currentBlock;
  if (nbBlocks === 3) {
    const res = `Up to date!\r\nAverage download time: ${averageDownloadTime.toFixed(
      0
    )}ms\r\nAverage process time: ${averageProcessTime.toFixed(0)}ms`;
    Logger.debug(res);
    return res;
  }
  const timeToCatchUp = new Date(nbBlocks * averageProcessTime)
    .toUTCString()
    .match(/(\d\d:\d\d:\d\d)/)[0];
  const res = `Time to catch up : ${timeToCatchUp} secs (approximately) (last block: ${lastBlockNumber})\r\nAverage download time: ${averageDownloadTime.toFixed(
    0
  )}ms\r\nAverage process time: ${averageProcessTime.toFixed(0)}ms`;
  Logger.info(res);
  return res;
};

export const BlockParserModule = {
  start,
  getNextBlock,
  calculateDelay,
  processTransaction,
  processBlock,
  stop,
  initializeValues,
};
