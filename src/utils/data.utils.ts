import path from "path";
import { Config } from "../config";

const JSONFileStorage = require("node-json-file-storage");
let storageLayer1;

export interface LayerOneBlockInfo {
  lastBlock: number;
}

const getStorageLayer1 = () => {
  if (!storageLayer1) {
    const layer1 = path.join(
      Config.parser.infoFilePath,
      "/storage-layer-1.json"
    );
    storageLayer1 = new JSONFileStorage(layer1);
  }
  return storageLayer1;
};

const saveLayer1BlockInfo = async (layerOneBlockInfo: LayerOneBlockInfo) => {
  getStorageLayer1().put({ id: "layerOneBlockInfo", layerOneBlockInfo });
};

const getLayer1BlockInfo = async (): Promise<LayerOneBlockInfo> => {
  return getStorageLayer1().get("layerOneBlockInfo")?.layerOneBlockInfo;
};
const setLayerOneTransactionProcessed = async (transactionId: string) => {
  const info = await getLayer1BlockInfo();
  saveLayer1BlockInfo({ ...info });
};

const initStorage = async () => {
  await getStorageLayer1();
};

export const DataUtils = {
  saveLayer1BlockInfo,
  getLayer1BlockInfo,
  initStorage,
  setLayerOneTransactionProcessed,
};
