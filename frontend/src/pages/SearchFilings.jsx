import { useState } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import axios from 'axios';

function SearchFilings() {
  const [query, setQuery] = useState('');
  const [ticker, setTicker] = useState('');
  const [year, setYear] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await axios.post('http://localhost:3001/api/search-filings', {
        query: query.trim(),
        ticker: ticker.trim() || undefined,
        year: year.trim() || undefined,
        topK: 5,
      });

      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to search filings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-pink-100 to-pink-200 text-gray-800 min-h-screen px-4 pb-6">
      <Header />
      <div className="max-w-5xl mx-auto pt-20 md:pt-28">
        <div className="text-center mb-8">
          <h2 className="text-4xl md:text-5xl gradient-text font-extrabold mb-3">
            Search SEC Filings
          </h2>
          <p className="text-gray-600 text-lg">
            Query company filings using natural language powered by AI
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-gray-700 font-medium mb-2">
                Search Query *
              </label>
              <input
                type="text"
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., What are the main risk factors?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ticker" className="block text-gray-700 font-medium mb-2">
                  Ticker (Optional)
                </label>
                <input
                  type="text"
                  id="ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g., AAPL"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label htmlFor="year" className="block text-gray-700 font-medium mb-2">
                  Year (Optional)
                </label>
                <input
                  type="text"
                  id="year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="e.g., 2023"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-full font-bold hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-xl shadow-xl p-6">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Search Results
              </h3>
              <p className="text-gray-600">
                Found {results.resultsCount} relevant {results.resultsCount === 1 ? 'result' : 'results'} for "{results.query}"
              </p>
              {Object.keys(results.filters).length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Filters: {JSON.stringify(results.filters)}
                </p>
              )}
            </div>

            {results.results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No results found. Try adjusting your search query or filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.results.map((result, index) => (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                          {result.ticker}
                        </span>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded mr-2">
                          {result.year}
                        </span>
                        <span className="inline-block bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded">
                          {result.section.replace('item_', 'Item ').replace('_', '.')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        {result.relevance}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {result.text}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      {result.tokens} tokens • ID: {result.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default SearchFilings;
