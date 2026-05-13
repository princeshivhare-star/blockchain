const config = require('../config');
const logger = require('../utils/logger');
const { Blockchain, Block, Transaction } = require('./blockchain');
const { load } = require('../services/persistence.service');

const blockchain = new Blockchain(
  config.blockchain.difficulty,
  config.blockchain.miningReward
);

/**
 * Restores a transaction instance from plain JSON data.
 */
const restoreTransaction = (transactionData) => {
  const transaction = new Transaction(
    transactionData.fromAddress,
    transactionData.toAddress,
    transactionData.amount
  );

  transaction.timestamp = transactionData.timestamp;
  transaction.signature = transactionData.signature || '';

  return transaction;
};

/**
 * Restores a block instance from plain JSON data.
 */
const restoreBlock = (blockData) => {
  const transactions = Array.isArray(blockData.transactions)
    ? blockData.transactions.map(restoreTransaction)
    : [];

  const block = new Block(
    blockData.timestamp,
    transactions,
    blockData.previousHash
  );

  block.nonce = blockData.nonce;
  block.hash = blockData.hash;

  return block;
};

/**
 * Loads blockchain state from persistence if available.
 */
const restoreSavedState = async () => {
  const savedState = await load();

  if (!savedState) {
    return false;
  }

  try {
    blockchain.chain = savedState.chain.map(restoreBlock);
    blockchain.pendingTransactions = savedState.pendingTransactions.map(restoreTransaction);
    blockchain.difficulty = savedState.difficulty;
    blockchain.miningReward = savedState.miningReward;

    if (!blockchain.isChainValid()) {
      logger.warn('Loaded blockchain failed validation, using fresh chain');
      blockchain.chain = [blockchain.createGenesisBlock()];
      blockchain.pendingTransactions = [];
      return false;
    }

    logger.info('Restored blockchain from saved state');
    return true;
  } catch (err) {
    logger.warn(`Failed to restore saved blockchain state: ${err.message}`);
    blockchain.chain = [blockchain.createGenesisBlock()];
    blockchain.pendingTransactions = [];
    return false;
  }
};

/**
 * Seeds demo blockchain data when enabled.
 */
const seedDemoData = () => {
  if (!config.demoData.enabled) {
    return;
  }

  for (const { from, to, amount } of config.demoData.transactions) {
    blockchain.addTransaction(new Transaction(from, to, amount));
  }

  if (blockchain.pendingTransactions.length > 0) {
    blockchain.minePendingTransactions(config.blockchain.initialMinerAddress);
    logger.info('Seeded demo blockchain data');
  }
};

restoreSavedState().then((wasRestored) => {
  if (!wasRestored) {
    seedDemoData();
  }
});

module.exports = {
  blockchain,
  Blockchain,
  Block,
  Transaction,
};
