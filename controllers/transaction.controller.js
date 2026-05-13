const { blockchain, Transaction } = require('../models');
const { sendSuccess, sendCreated, sendError } = require('../utils/response');
const {
  isValidAddress,
  isValidAmount,
  sanitizeAddress,
  sanitizeAmount,
} = require('../utils/validator');
const { save } = require('../services/persistence.service');

/**
 * Adds a new transaction to the pending transaction pool.
 */
const addTransaction = (req, res, next) => {
  try {
    const { fromAddress, toAddress, amount } = req.body;

    if (!isValidAddress(fromAddress) || !isValidAddress(toAddress)) {
      return sendError(res, 'Invalid wallet address format', 400);
    }

    if (!isValidAmount(amount)) {
      return sendError(res, 'Amount must be a positive number', 400);
    }

    const transaction = new Transaction(
      sanitizeAddress(fromAddress),
      sanitizeAddress(toAddress),
      sanitizeAmount(amount)
    );

    blockchain.addTransaction(transaction);
    save(blockchain);

    sendCreated(res, {
      message: 'Transaction added to pending pool',
      transaction,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns all pending transactions.
 */
const getPendingTransactions = (req, res) => {
  sendSuccess(res, {
    pendingTransactions: blockchain.pendingTransactions,
    count: blockchain.pendingTransactions.length,
  });
};

/**
 * Returns all confirmed transactions from the blockchain.
 */
const getAllTransactions = (req, res) => {
  const transactions = blockchain.getAllTransactions();
  sendSuccess(res, { transactions, count: transactions.length });
};

/**
 * Searches confirmed transactions across the entire chain using optional filters.
 */
const searchTransactions = (req, res, next) => {
  try {
    const {
      fromAddress,
      toAddress,
      minAmount,
      maxAmount,
      startDate,
      endDate,
    } = req.query;

    const numericFields = {
      minAmount,
      maxAmount,
      startDate,
      endDate,
    };

    for (const [field, value] of Object.entries(numericFields)) {
      if (value !== undefined && value !== '') {
        const numberValue = Number(value);

        if (!Number.isFinite(numberValue)) {
          return sendError(res, `${field} must be a valid number`, 400);
        }

        if ((field === 'minAmount' || field === 'maxAmount') && numberValue < 0) {
          return sendError(res, `${field} cannot be negative`, 400);
        }
      }
    }

    const min = minAmount !== undefined && minAmount !== '' ? Number(minAmount) : null;
    const max = maxAmount !== undefined && maxAmount !== '' ? Number(maxAmount) : null;
    const start = startDate !== undefined && startDate !== '' ? Number(startDate) : null;
    const end = endDate !== undefined && endDate !== '' ? Number(endDate) : null;

    if (min !== null && max !== null && min > max) {
      return sendError(res, 'minAmount cannot be greater than maxAmount', 400);
    }

    if (start !== null && end !== null && start > end) {
      return sendError(res, 'startDate cannot be greater than endDate', 400);
    }

    const fromFilter = fromAddress ? String(fromAddress).toLowerCase() : null;
    const toFilter = toAddress ? String(toAddress).toLowerCase() : null;

    const results = blockchain.getAllTransactions().filter((tx) => {
      const txFrom = tx.fromAddress === null ? 'mining-reward' : String(tx.fromAddress).toLowerCase();
      const txTo = String(tx.toAddress || '').toLowerCase();
      const txAmount = Number(tx.amount);
      const txTimestamp = Number(tx.timestamp);

      if (fromFilter && !txFrom.includes(fromFilter)) return false;
      if (toFilter && !txTo.includes(toFilter)) return false;
      if (min !== null && txAmount < min) return false;
      if (max !== null && txAmount > max) return false;
      if (start !== null && txTimestamp < start) return false;
      if (end !== null && txTimestamp > end) return false;

      return true;
    });

    sendSuccess(res, {
      results,
      count: results.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  addTransaction,
  getPendingTransactions,
  getAllTransactions,
  searchTransactions,
};