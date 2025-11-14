import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// List of large-cap stocks that typically have complex filings
const LARGE_CAP_TICKERS = [
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'BRK.A', 'BRK.B', 
  'JPM', 'V', 'PG', 'UNH', 'HD', 'MA', 'BAC', 'XOM', 'DIS', 'NVDA', 'PYPL',
  'ADBE', 'INTC', 'CMCSA', 'PFE', 'WMT', 'CRM', 'NFLX', 'VZ', 'ABT', 'KO'
];

const FilingParserPopup = ({ isOpen, onClose }) => {
  const [ticker, setTicker] = useState('');
  const [formType, setFormType] = useState('10-K');
  const [year, setYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [chunkedData, setChunkedData] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [contentHeight, setContentHeight] = useState(300); // Default height for content areas
  const popupRef = useRef(null);

  // Form types available for selection
  const formTypes = ['10-K', '10-Q', '8-K', 'DEF 14A'];

  // Check if the ticker is a large cap stock
  const isLargeCap = (ticker) => LARGE_CAP_TICKERS.includes(ticker.toUpperCase());

  // Close the popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!ticker || !formType || !year) {
      setError({type: 'error', message: 'Please fill in all fields'});
      return;
    }

    setIsLoading(true);
    setError(null);
    setStructuredData(null);
    setChunkedData(null);
    setActiveSection(null);

    const isLargeCapStock = isLargeCap(ticker);
    const isTesla = ticker.toUpperCase() === 'TSLA';
    
    // If it's a large cap company, show an info message
    if (isTesla && formType === '10-K') {
      setError({
        type: 'info',
        message: `Using special Tesla 10-K parser. This may take longer to process the complex filing structure.`
      });
    } else if (isLargeCapStock) {
      setError({
        type: 'info',
        message: `${ticker.toUpperCase()} is a large company with complex filings. Processing might take longer.`
      });
    }

    try {
      // Use the backend API endpoint for SEC filing parsing
      const response = await axios.post('http://localhost:3001/api/parse-filing', {
        ticker: ticker.toUpperCase(),
        formType,
        year
      });

      // Handle the response
      setStructuredData(response.data.structured);
      setChunkedData(response.data.chunked);
      
      // Check for artificial sections (sections that were created based on content)
      const hasArtificialSections = response.data.structured._artificial_sections === true;
      
      // Check if data was truncated
      const hasTruncatedData = Object.values(response.data.structured).some(
        item => typeof item === 'object' && item.text && item.text.includes('[TRUNCATED]')
      );
      
      if (hasArtificialSections) {
        setError({
          type: 'warning',
          message: `Note: This filing has a complex structure. We've created approximate sections based on the content. The section divisions may not be exact.`
        });
      } else if (hasTruncatedData) {
        setError({
          type: 'info', 
          message: `Note: Some sections were truncated due to size. ${isLargeCapStock ? 'This is common for large companies like ' + ticker.toUpperCase() + '.' : ''}`
        });
      } else if (response.data.chunked._note) {
        setError({type: 'info', message: `Note: ${response.data.chunked._note}`});
      } else if (isTesla) {
        setError({
          type: 'success',
          message: `Successfully parsed Tesla filing with ${response.data.structured.table_of_contents?.length || 0} sections.`
        });
      }
      
      // Set active section to the first table of contents item
      if (response.data.structured.table_of_contents && 
          response.data.structured.table_of_contents.length > 0) {
        setActiveSection(response.data.structured.table_of_contents[0].item);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      
      // Handle specific errors more gracefully
      if (isTesla && errorMessage.includes('TSLA special parser')) {
        setError({
          type: 'error', 
          message: `Error with Tesla special parser. Try using a different year or form type.`
        });
      } else if (isLargeCapStock && errorMessage.includes('complex')) {
        setError({
          type: 'warning', 
          message: `${ticker.toUpperCase()} filings are very complex. ${errorMessage}`
        });
      } else {
        setError({type: 'error', message: `Error parsing filing: ${errorMessage}`});
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Download JSON function
  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // Get section text
  const getSectionText = (sectionKey) => {
    if (!structuredData || !sectionKey) return '';
    return structuredData[sectionKey]?.text || '';
  };

  // Get chunks for a section
  const getSectionChunks = (sectionKey) => {
    if (!chunkedData || !sectionKey) return [];
    return chunkedData.chunks.filter(chunk => chunk.section === sectionKey);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={popupRef}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">SEC Filing Parser</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="mb-4">
              <label htmlFor="ticker" className="block text-gray-700 font-medium mb-2">Ticker Symbol</label>
              <input
                type="text"
                id="ticker"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. TSLA"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="formType" className="block text-gray-700 font-medium mb-2">Form Type</label>
              <select
                id="formType"
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {formTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="year" className="block text-gray-700 font-medium mb-2">Year</label>
              <input
                type="text"
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g. 2023"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-6 rounded-full font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Parsing...' : 'Parse Filing'}
          </button>
        </form>
        
        {error && (
          <div 
            className={`
              ${error.type === 'error' ? 'bg-red-100 border-red-500 text-red-700' : 
                error.type === 'warning' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 
                'bg-blue-100 border-blue-500 text-blue-700'} 
              border-l-4 p-4 mb-6
            `} 
            role="alert"
          >
            <p>{error.message}</p>
          </div>
        )}

        {structuredData && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {structuredData.company} ({structuredData.ticker}) - {structuredData.form} {year}
              </h3>
              <button
                onClick={() => downloadJSON(structuredData, `${ticker}_${formType}_${year}_structured.json`)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download JSON
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Table of Contents */}
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-3">Table of Contents</h4>
                <ul 
                  className="space-y-2 overflow-y-auto pr-2"
                  style={{ maxHeight: `${contentHeight}px` }}
                >
                  {structuredData.table_of_contents?.map((item) => (
                    <li key={item.item}>
                      <button
                        onClick={() => setActiveSection(item.item)}
                        className={`text-left w-full px-2 py-1 rounded ${activeSection === item.item ? 'bg-purple-100 text-purple-700 font-medium' : 'hover:bg-gray-100'}`}
                      >
                        {item.item.replace('item_', 'Item ').replace('_', '.')} - {item.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section Content */}
              <div className="border rounded-lg p-4 md:col-span-3">
                {activeSection ? (
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3">
                      {activeSection.replace('item_', 'Item ').replace('_', '.')} 
                      {structuredData.table_of_contents?.find(item => item.item === activeSection)?.title 
                        ? ` - ${structuredData.table_of_contents.find(item => item.item === activeSection).title}` 
                        : ''}
                    </h4>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <label htmlFor="heightControl" className="text-sm text-gray-600 mr-2">Height:</label>
                        <input 
                          id="heightControl"
                          type="range" 
                          min="200" 
                          max="800" 
                          value={contentHeight} 
                          onChange={(e) => setContentHeight(Number(e.target.value))}
                          className="w-32"
                        />
                        <span className="text-xs text-gray-500 ml-2">{contentHeight}px</span>
                      </div>
                    </div>
                    <div 
                      className="bg-gray-100 p-4 rounded overflow-y-auto cursor-pointer relative"
                      style={{ maxHeight: `${contentHeight}px` }}
                    >
                      <p className="whitespace-pre-wrap">
                        {getSectionText(activeSection)}
                      </p>
                      {getSectionText(activeSection).includes('[TRUNCATED]') && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 mt-4">
                          <p className="text-sm">
                            This section has been truncated due to its large size. 
                            {activeSection === 'item_8' && 
                              ' Financial statements sections are typically very large. Important tables have been preserved.'}
                            {LARGE_CAP_TICKERS.includes(structuredData.ticker) && 
                              ` ${structuredData.ticker} is a large company with extensive disclosures.`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    Select a section from the table of contents
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {chunkedData && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Chunked Data</h3>
              <button
                onClick={() => downloadJSON(chunkedData, `${ticker}_${formType}_${year}_chunked.json`)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download JSON
              </button>
            </div>

            {activeSection && (
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-gray-800 mb-3">
                  Chunks for {activeSection.replace('item_', 'Item ').replace('_', '.')}
                </h4>
                <div 
                  className="space-y-4 overflow-y-auto cursor-pointer pr-2"
                  style={{ maxHeight: `${contentHeight}px` }}
                >
                  {getSectionChunks(activeSection).map((chunk) => (
                    <div key={chunk.chunk_id} className="bg-gray-100 p-4 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm text-gray-700">Chunk ID: {chunk.chunk_id}</span>
                        <span className="text-xs text-gray-500">{chunk.tokens} tokens</span>
                      </div>
                      <p className="text-sm">{chunk.text}</p>
                    </div>
                  ))}
                  {getSectionChunks(activeSection).length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      No chunks available for this section
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilingParserPopup;