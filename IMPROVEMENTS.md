# Finceptor - Pinecone Context Retrieval Improvements

## Overview
Enhanced the Finceptor chatbot to retrieve relevant context from Pinecone vector database based on user input, making responses more accurate and data-driven using actual SEC filing information.

## Key Improvements

### 1. Enhanced Chat API (`/api/chat`)
**Location**: `backend/pages/api/chat.js`

**New Features**:
- **Automatic Ticker Detection**: Extracts ticker symbols from user messages (e.g., "Tell me about AAPL")
- **Context Retrieval**: Queries Pinecone for relevant SEC filing chunks based on user query
- **Semantic Search**: Uses Gemini embeddings to find contextually relevant information
- **Smart Filtering**: Filters results by relevance score (>50% confidence)
- **Enhanced Prompts**: Injects retrieved context into AI system prompts with source citations

**How It Works**:
```javascript
// User asks: "What are Apple's main risk factors?"
// 1. Extract ticker: AAPL
// 2. Generate embedding for query
// 3. Search Pinecone for relevant chunks
// 4. Inject top 3 results into AI prompt
// 5. AI responds with data-driven answer citing sources
```

**Response Format**:
```json
{
  "success": true,
  "reply": "Based on Apple's 2023 10-K filing...",
  "contextUsed": 3,
  "sources": [
    { "ticker": "AAPL", "year": "2023", "section": "item_1a" }
  ]
}
```

### 2. Improved Search Filings API (`/api/search-filings`)
**Location**: `backend/pages/api/search-filings.js`

**Enhancements**:
- Added CORS headers for cross-origin requests
- Support for multiple filter options (ticker, year, section, namespace)
- Better error handling and logging
- Formatted results with relevance percentages
- Consistent data structure for frontend consumption

**New Parameters**:
- `query` (required): Natural language search query
- `ticker` (optional): Filter by company ticker
- `year` (optional): Filter by filing year
- `section` (optional): Filter by specific section (e.g., "item_1a")
- `topK` (optional): Number of results to return (default: 5)
- `namespace` (optional): Pinecone namespace (default: "var")

### 3. Enhanced Embeddings Utility
**Location**: `backend/utils/embeddings.js`

**New Function**: `get_gemini_embedding(text)`
- Generates single embeddings for search queries
- Optimized for real-time query processing
- Proper error handling and validation
- Used by both chat and search APIs

### 4. New Search Filings Page
**Location**: `frontend/src/pages/SearchFilings.jsx`

**Features**:
- Dedicated UI for searching SEC filings
- Natural language query input
- Optional filters for ticker and year
- Results display with:
  - Relevance scores (percentage)
  - Company ticker badges
  - Filing year and section tags
  - Full text excerpts
  - Token counts and IDs
- Real-time search with loading states
- Error handling with user-friendly messages

**Usage Example**:
```
Query: "What are the main revenue sources?"
Ticker: AAPL (optional)
Year: 2023 (optional)
→ Returns relevant chunks from Apple's filings
```

### 5. Enhanced Persona Chat UI
**Location**: `frontend/src/pages/Persona.jsx`

**New Features**:
- **Source Citations**: Shows which SEC filings were used for responses
- **Context Indicators**: Visual badges showing ticker, year, and section
- **Transparency**: Users can see exactly where information came from
- **Better Trust**: Data-backed responses with clear attribution

**Visual Improvements**:
- Source badges appear below bot messages
- Color-coded tags (purple for sources)
- Icon indicators for SEC filing references
- Compact, readable format

### 6. Updated Navigation
**Location**: `frontend/src/components/Header.jsx`

**Changes**:
- Added "Search" link to navigation bar
- Easy access to new search functionality
- Consistent styling with existing nav items

## Technical Architecture

### Context Retrieval Flow
```
User Input → Ticker Detection → Embedding Generation → Pinecone Query
    ↓
Filter by Relevance (>50%) → Format Context → Inject into AI Prompt
    ↓
AI Response with Citations → Display with Source Badges
```

### Data Flow Diagram
```
Frontend (React)
    ↓ POST /api/chat
Backend (Next.js)
    ↓ Extract tickers
    ↓ Generate embedding (Gemini)
    ↓ Query vectors
Pinecone (Vector DB)
    ↓ Return matches
Backend
    ↓ Format context
    ↓ Call OpenRouter AI
    ↓ Return response + sources
Frontend
    ↓ Display with citations
```

## Benefits

### For Users
1. **More Accurate Responses**: AI answers based on actual SEC filing data
2. **Source Transparency**: See exactly where information comes from
3. **Company-Specific Insights**: Get data about specific companies
4. **Searchable Knowledge Base**: Directly search through parsed filings

### For Developers
1. **Modular Design**: Separate context retrieval from chat logic
2. **Reusable Functions**: `get_gemini_embedding` used across APIs
3. **Better Error Handling**: Graceful fallbacks when context unavailable
4. **Extensible**: Easy to add more filters or data sources

## Configuration

### Environment Variables Required
```bash
# Backend (.env.local)
GEMINI_API_KEY=your_gemini_key
PINECONE_API_KEY=your_pinecone_key
OPENROUTER_API_KEY=your_openrouter_key
```

### Pinecone Setup
- Index name: `sec-filings`
- Namespace: `var`
- Dimension: 768 (Gemini text-embedding-004)
- Metric: Cosine similarity

## Usage Examples

### Example 1: General Financial Question
```
User: "What should I know about investing in tech stocks?"
→ No ticker detected
→ Generic financial advice (no SEC context)
```

### Example 2: Company-Specific Question
```
User: "What are TSLA's main risk factors?"
→ Ticker detected: TSLA
→ Retrieves Item 1A (Risk Factors) from Tesla filings
→ Response: "Based on Tesla's 2023 10-K filing, the main risk factors include..."
→ Shows source: TSLA 2023 - Item 1A
```

### Example 3: Direct Search
```
Navigate to /search
Query: "revenue recognition policies"
Ticker: MSFT
Year: 2023
→ Returns relevant accounting policy sections
→ Shows relevance scores and exact text
```

## Performance Optimizations

1. **Batch Processing**: Embeddings generated in batches of 5
2. **Relevance Filtering**: Only uses matches >50% confidence
3. **Top-K Limiting**: Returns only 3 most relevant contexts for chat
4. **Caching**: Pinecone handles vector caching automatically
5. **Async Operations**: Non-blocking context retrieval

## Future Enhancements

### Potential Improvements
1. **Caching Layer**: Cache frequent queries (Redis)
2. **Multi-Company Comparison**: Compare metrics across companies
3. **Time-Series Analysis**: Track changes across filing years
4. **Advanced Filters**: Filter by document type, section, date range
5. **Conversation Memory**: Remember context across chat sessions
6. **Hybrid Search**: Combine semantic + keyword search
7. **Query Suggestions**: Auto-suggest related questions
8. **Export Results**: Download search results as CSV/JSON

## Testing

### Test the Chat Enhancement
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Navigate to `/persona`
4. Select a persona
5. Ask: "What are AAPL's risk factors?"
6. Verify: Response includes SEC filing context and source badges

### Test the Search Page
1. Navigate to `/search`
2. Enter query: "revenue growth"
3. Add ticker: AAPL
4. Add year: 2023
5. Click Search
6. Verify: Results show relevant chunks with scores

## Troubleshooting

### No Context Retrieved
- **Check**: Pinecone has data for the ticker
- **Check**: Embeddings were stored correctly
- **Check**: API keys are valid
- **Solution**: Parse and store filings first using SEC Parser

### Low Relevance Scores
- **Issue**: Query too generic or no matching data
- **Solution**: Be more specific or check if filing exists
- **Example**: Instead of "tell me about Apple", ask "What are Apple's revenue sources?"

### API Errors
- **Check**: All environment variables set
- **Check**: Pinecone index exists and is active
- **Check**: Network connectivity
- **Check**: API rate limits not exceeded

## Code Quality

### Best Practices Implemented
- ✅ Proper error handling with try-catch
- ✅ Input validation and sanitization
- ✅ Logging for debugging
- ✅ CORS headers for security
- ✅ Modular, reusable functions
- ✅ Clear variable naming
- ✅ Comprehensive comments
- ✅ Graceful fallbacks

## Conclusion

These improvements transform the chatbot from a generic financial advisor into an intelligent assistant that provides data-driven insights backed by actual SEC filings. Users can now trust the responses are based on real company data, with full transparency about sources.
