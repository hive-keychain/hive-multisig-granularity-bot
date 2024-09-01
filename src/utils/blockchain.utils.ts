import { BlockchainMode } from '@hiveio/dhive';
import { HiveUtils } from './hive.utils';

const getCurrentBlockNumber = () => {
  return HiveUtils.getClient().blockchain.getCurrentBlockNum(
    BlockchainMode.Latest,
  );
};

const getBlock = (blockNumber: number) => {
  return HiveUtils.getClient().database.getBlock(blockNumber);
};

export const BlockchainUtils = {
  getCurrentBlockNumber,
  getBlock,
};
