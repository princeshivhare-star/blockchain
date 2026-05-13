const fs = require('fs/promises');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Storage file shape:
 *
 * {
 *   "chain": [
 *     {
 *       "timestamp": 1710000000000,
 *       "transactions": [
 *         {
 *           "fromAddress": "address1",
 *           "toAddress": "address2",
 *           "amount": 100,
 *           "timestamp": 1710000000000,
 *           "signature": ""
 *         }
 *       ],
 *       "previousHash": "abc",
 *       "nonce": 10,
 *       "hash": "xyz"
 *     }
 *   ],
 *   "pendingTransactions": [],
 *   "difficulty": 2,
 *   "miningReward": 100
 * }
 */

const DATA_FILE = path.join(process.cwd(), 'blockchain.json');

/**
 * Performs basic validation on loaded blockchain state.
 */
const isValidSavedState = (data) => {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.chain)) return false;
  if (!Array.isArray(data.pendingTransactions)) return false;
  if (typeof data.difficulty !== 'number') return false;
  if (typeof data.miningReward !== 'number') return false;
  if (data.chain.length === 0) return false;

  return true;
};

/**
 * Saves blockchain state to disk.
 */
const save = async (blockchain) => {
  try {
    const data = {
      chain: blockchain.chain,
      pendingTransactions: blockchain.pendingTransactions,
      difficulty: blockchain.difficulty,
      miningReward: blockchain.miningReward,
    };

    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    logger.info('Blockchain state saved successfully');
  } catch (err) {
    logger.error(`Failed to save blockchain state: ${err.message}`);
  }
};

/**
 * Loads blockchain state from disk.
 */
const load = async () => {
  try {
    const rawData = await fs.readFile(DATA_FILE, 'utf8');
    const parsedData = JSON.parse(rawData);

    if (!isValidSavedState(parsedData)) {
      logger.warn('Saved blockchain state failed integrity checks');
      return null;
    }

    logger.info('Blockchain state loaded successfully');
    return parsedData;
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.info('No saved blockchain state found, starting fresh');
      return null;
    }

    if (err instanceof SyntaxError) {
      logger.warn('Saved blockchain state is corrupted JSON, starting fresh');
      return null;
    }

    logger.error(`Failed to load blockchain state: ${err.message}`);
    return null;
  }
};

/**
 * Deletes saved blockchain state from disk.
 */
const clear = async () => {
  try {
    await fs.unlink(DATA_FILE);
    logger.info('Blockchain saved state cleared');
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.info('No saved blockchain file to clear');
      return;
    }

    logger.error(`Failed to clear blockchain saved state: ${err.message}`);
  }
};

module.exports = {
  save,
  load,
  clear,
};