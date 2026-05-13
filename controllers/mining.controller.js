const { blockchain } = require('../models');
const { sendSuccess } = require('../utils/response');
const logger = require('../utils/logger');
const { save } = require('../services/persistence.service');

/**
 * Mines all pending transactions into a new block.
 */
const mineBlock = async (req, res, next) => {
  try {
    const miningRewardAddress = req.body.miningRewardAddress || 'miner1';

    logger.info(`Mining block for reward address: ${miningRewardAddress}`);

    blockchain.minePendingTransactions(miningRewardAddress);
    await save(blockchain);

    logger.info(`Block mined successfully: ${blockchain.getLatestBlock().hash}`);

    sendSuccess(res, {
      message: 'Block mined successfully',
      latestBlock: blockchain.getLatestBlock(),
      chainLength: blockchain.chain.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { mineBlock };