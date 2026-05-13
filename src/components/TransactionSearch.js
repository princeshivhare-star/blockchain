import React, { useState } from 'react';
import { searchTransactions } from '../api/blockchain.api';

/**
 * Form for searching confirmed blockchain transactions.
 */
function TransactionSearch() {
  const initialFilters = {
    fromAddress: '',
    toAddress: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
  };

  const [filters, setFilters] = useState(initialFilters);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Updates form filter values.
   */
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  /**
   * Converts datetime-local values to Unix timestamps.
   */
  const buildSearchParams = () => {
    const params = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') {
        if (key === 'startDate' || key === 'endDate') {
          params[key] = new Date(value).getTime();
        } else {
          params[key] = value;
        }
      }
    });

    return params;
  };

  /**
   * Submits transaction search request.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      const data = await searchTransactions(buildSearchParams());

      setResults(data.results || []);
      setHasSearched(true);
    } catch (err) {
      setError(err.message || 'Failed to search transactions');
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears form and search results.
   */
  const handleClear = () => {
    setFilters(initialFilters);
    setResults([]);
    setError('');
    setHasSearched(false);
  };

  return (
    <div className="transaction-search">
      <h2>Search Transactions</h2>

      <form onSubmit={handleSubmit} className="transaction-search-form">
        <div className="form-group">
          <label htmlFor="fromAddress">From Address</label>
          <input
            id="fromAddress"
            name="fromAddress"
            type="text"
            value={filters.fromAddress}
            onChange={handleChange}
            placeholder="Sender address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="toAddress">To Address</label>
          <input
            id="toAddress"
            name="toAddress"
            type="text"
            value={filters.toAddress}
            onChange={handleChange}
            placeholder="Recipient address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="minAmount">Min Amount</label>
          <input
            id="minAmount"
            name="minAmount"
            type="number"
            min="0"
            step="any"
            value={filters.minAmount}
            onChange={handleChange}
            placeholder="Minimum amount"
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxAmount">Max Amount</label>
          <input
            id="maxAmount"
            name="maxAmount"
            type="number"
            min="0"
            step="any"
            value={filters.maxAmount}
            onChange={handleChange}
            placeholder="Maximum amount"
          />
        </div>

        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input
            id="startDate"
            name="startDate"
            type="datetime-local"
            value={filters.startDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            id="endDate"
            name="endDate"
            type="datetime-local"
            value={filters.endDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>

          <button type="button" onClick={handleClear} disabled={loading}>
            Clear
          </button>
        </div>
      </form>

      {error && <p className="error-message">{error}</p>}

      {loading && <p>Loading transactions...</p>}

      {!loading && hasSearched && results.length === 0 && !error && (
        <p>No transactions found.</p>
      )}

      {!loading && results.length > 0 && (
        <div className="transaction-results">
          <h3>Results ({results.length})</h3>

          <ul>
            {results.map((transaction, index) => (
              <li key={`${transaction.timestamp}-${index}`} className="transaction-result-item">
                <p>
                  <strong>Amount:</strong> {transaction.amount}
                </p>
                <p>
                  <strong>From:</strong>{' '}
                  {transaction.fromAddress === null ? 'Mining Reward' : transaction.fromAddress}
                </p>
                <p>
                  <strong>To:</strong> {transaction.toAddress}
                </p>
                <p>
                  <strong>Timestamp:</strong>{' '}
                  {new Date(transaction.timestamp).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default TransactionSearch;