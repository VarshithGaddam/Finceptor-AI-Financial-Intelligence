# 🚀 Finceptor - AI-Powered Financial Intelligence Platform

<div align="center">

![Finceptor](https://img.shields.io/badge/Finceptor-v1.0.0-purple?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green?style=for-the-badge)
![React](https://img.shields.io/badge/react-18.3.1-61DAFB?style=for-the-badge&logo=react)

**A Gen Z-focused fintech platform combining AI-powered financial advice with real-time SEC filing analysis**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [Architecture](#-architecture) • [API Documentation](#-api-documentation)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Usage Guide](#-usage-guide)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

Finceptor is a cutting-edge financial intelligence platform that democratizes access to complex financial data. By combining persona-based AI advisors with semantic search capabilities over SEC filings, we make institutional-grade financial analysis accessible to everyone.

### What Makes Us Different

- **Persona-Driven Experience**: Choose from 5 unique financial personas tailored to different investment styles
- **AI-Powered Insights**: Get contextual financial advice backed by real SEC filing data
- **Semantic Search**: Query company filings using natural language
- **Real-Time Analysis**: Parse and analyze 10-K/10-Q filings on demand
- **Source Transparency**: Every AI response cites its sources from actual filings

---

## ✨ Features

### 🎭 Persona Selection System
Choose your financial personality and get tailored advice:
- **🚀 Innovator** - Tech-savvy, loves crypto & startups
- **📈 Traditionalist** - Plays it safe with stocks & bonds
- **🌍 Adventurer** - Risk-taker, dives into volatile markets
- **🏅 Athlete** - Invests with discipline, like training
- **🎨 Artist** - Creative, seeks passion-driven investments

### 💬 Context-Aware AI Chat
- Real-time financial advice from persona-specific AI advisors
- Automatic retrieval of relevant SEC filing context
- Source citations with ticker, year, and section references
- Fallback responses when API unavailable

### 🔍 SEC Filing Search
- Natural language search across parsed SEC filings
- Filter by ticker symbol, year, and section
- Relevance scoring with percentage confidence
- Full-text display with metadata

### 📊 SEC Filing Parser
- Download and parse 10-K and 10-Q filings
- Extract structured sections (Items 1, 1A, 7, 8, etc.)
- Automatic text chunking for embeddings
- Special handling for large-cap stocks (AAPL, MSFT, TSLA, etc.)
- Table of contents extraction

### 🔮 Vector Search Engine
- Semantic search using Google Gemini embeddings
- Pinecone vector database for fast retrieval
- Context-aware query understanding
- Multi-filter support (ticker, year, section)

---

## 🛠 Tech Stack

### Frontend
- **React 18.3** - Modern UI library
- **Vite 5.4** - Lightning-fast build tool
- **React Router 6.26** - Client-side routing
- **TailwindCSS 3.4** - Utility-first CSS
- **Axios** - HTTP client

### Backend
- **Next.js 14** - React framework with API routes
- **Node.js 18+** - JavaScript runtime
- **Python 3.x** - SEC filing parser

### AI & ML
- **Google Gemini** - Text embeddings (text-embedding-004)
- **OpenRouter** - LLM API (DeepSeek Chat)
- **Pinecone** - Vector database for semantic search

### Database & Storage
- **Supabase** - PostgreSQL with real-time capabilities
- **Row Level Security** - Secure data access

### Python Libraries
- **sec-edgar-downloader** - SEC filing retrieval
- **BeautifulSoup4** - HTML parsing
- **NLTK** - Natural language processing

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (comes with Node.js)
- **Python** >= 3.8 ([Download](https://www.python.org/))
- **pip** (Python package manager)

### Required API Keys

You'll need accounts and API keys for:

1. **Supabase** - [Sign up](https://supabase.com/)
2. **Google AI Studio** - [Get API key](https://makersuite.google.com/app/apikey)
3. **Pinecone** - [Sign up](https://www.pinecone.io/)
4. **OpenRouter** - [Get API key](https://openrouter.ai/)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/finceptor.git
cd finceptor
```

### 2. Install Python Dependencies

```bash
pip install sec-edgar-downloader beautifulsoup4 nltk lxml
```

### 3. Configure Environment Variables

Create `.env.local` files in both backend and frontend directories:

**Backend** (`backend/.env.local`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_key
GEMINI_API_KEY=your_gemini_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=us-east-1
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 4. Install Backend Dependencies

```bash
cd backend
npm install
```

### 5. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 6. Start the Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:3001`

### 7. Start the Frontend Server

Open a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5174`

### 8. Access the Application

Open your browser and navigate to:
```
http://localhost:5174
```

---

## 📁 Project Structure

```
finceptor/
├── backend/                    # Next.js backend
│   ├── pages/
│   │   └── api/               # API routes
│   │       ├── chat.js        # AI chat with context retrieval
│   │       ├── personas.js    # Persona management
│   │       ├── parse-filing.js # SEC filing parser
│   │       ├── search-filings.js # Semantic search
│   │       ├── store-embeddings.js # Vector storage
│   │       └── query-embeddings.js # Vector queries
│   ├── utils/
│   │   ├── embeddings.js      # Gemini embedding generation
│   │   ├── pinecone_store.js  # Pinecone operations
│   │   └── batch_utils.js     # Batch processing
│   ├── sec_parser.py          # Python SEC parser
│   ├── package.json
│   └── .env.local
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx     # Navigation header
│   │   │   ├── PersonaCard.jsx # Persona selection cards
│   │   │   ├── FilingParserButton.jsx
│   │   │   └── FilingParserPopup.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx       # Landing page
│   │   │   ├── Persona.jsx    # Persona chat interface
│   │   │   ├── SearchFilings.jsx # SEC search page
│   │   │   └── supabase.js    # Supabase client
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── public/
│   │   └── styles/
│   │       └── globals.css    # Global styles
│   ├── package.json
│   └── .env.local
│
├── database/
│   └── schema.sql             # Database schema
│
├── README.md                  # This file
└── IMPROVEMENTS.md            # Technical improvements doc
```

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Home   │  │ Personas │  │  Search  │  │  Parser  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────┐
│                    Backend (Next.js)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Routes                               │  │
│  │  /chat  /personas  /parse-filing  /search-filings   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────┬──────────┬──────────┬──────────┬──────────┬──────────┘
      │          │          │          │          │
      ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
│ Supabase │ │ Gemini │ │Pinecone│ │OpenRouter│ │ Python  │
│   (DB)   │ │(Embed) │ │(Vector)│ │  (LLM)  │ │ Parser  │
└──────────┘ └────────┘ └────────┘ └────────┘ └──────────┘
```

### Data Flow

1. **User Query** → Frontend captures input
2. **API Request** → Sent to Next.js backend
3. **Ticker Detection** → Extract company symbols
4. **Embedding Generation** → Convert query to vector (Gemini)
5. **Vector Search** → Query Pinecone for relevant chunks
6. **Context Injection** → Add SEC filing context to prompt
7. **AI Response** → Generate answer (OpenRouter)
8. **Source Attribution** → Return response with citations
9. **UI Display** → Show answer with source badges

---

## 📚 API Documentation

### Chat API

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "message": "What are Apple's main risk factors?",
  "persona": "Innovator",
  "ticker": "AAPL"
}
```

**Response**:
```json
{
  "success": true,
  "reply": "Based on Apple's 2023 10-K filing...",
  "contextUsed": 3,
  "sources": [
    {
      "ticker": "AAPL",
      "year": "2023",
      "section": "item_1a"
    }
  ]
}
```

### Search Filings API

**Endpoint**: `POST /api/search-filings`

**Request Body**:
```json
{
  "query": "revenue recognition policies",
  "ticker": "MSFT",
  "year": "2023",
  "topK": 5
}
```

**Response**:
```json
{
  "success": true,
  "query": "revenue recognition policies",
  "resultsCount": 5,
  "results": [
    {
      "id": "MSFT_2023_10-K_item_8_chunk42_v1",
      "score": 0.87,
      "relevance": "87.0%",
      "ticker": "MSFT",
      "year": "2023",
      "section": "item_8",
      "text": "Revenue is recognized when...",
      "tokens": 150
    }
  ]
}
```

### Parse Filing API

**Endpoint**: `POST /api/parse-filing`

**Request Body**:
```json
{
  "ticker": "TSLA",
  "formType": "10-K",
  "year": "2023"
}
```

**Response**:
```json
{
  "structured": {
    "company": "Tesla, Inc.",
    "ticker": "TSLA",
    "form": "10-K",
    "table_of_contents": [...],
    "item_1": { "text": "..." },
    "item_1a": { "text": "..." }
  },
  "chunked": {
    "metadata": {...},
    "chunks": [...]
  },
  "embedData": {
    "upsertedCount": 245,
    "skippedCount": 0
  }
}
```

---

## 🔐 Environment Variables

### Backend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `PINECONE_API_KEY` | Pinecone API key | ✅ |
| `PINECONE_ENVIRONMENT` | Pinecone environment | ✅ |
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL | ✅ |

### Frontend Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | ✅ |

---

## 📖 Usage Guide

### Selecting a Persona

1. Navigate to the home page
2. Click "Enter" to access persona selection
3. Choose your financial personality
4. Start chatting with your AI advisor

### Asking Questions

**General Questions**:
```
"What's a good investment strategy for beginners?"
```

**Company-Specific Questions**:
```
"What are TSLA's main revenue sources?"
"Tell me about Microsoft's risk factors"
"How does Apple recognize revenue?"
```

### Searching SEC Filings

1. Click "Search" in the navigation
2. Enter your natural language query
3. Optionally filter by ticker and year
4. View results with relevance scores

### Parsing New Filings

1. Click "SEC Filing Parser" on home page
2. Enter ticker symbol (e.g., AAPL)
3. Select form type (10-K or 10-Q)
4. Enter year
5. Click "Parse Filing"
6. View structured data and download JSON

---

## 🎨 UI Features

- **Glassmorphism Design** - Modern, translucent card effects
- **Gradient Animations** - Smooth color transitions
- **Floating Bubbles** - Animated background elements
- **Responsive Layout** - Mobile-first design
- **Dark Mode Ready** - Prepared for theme switching
- **Accessibility** - WCAG compliant components

---

## 🧪 Testing

### Manual Testing

**Test Chat Context Retrieval**:
```bash
# Start both servers
# Navigate to /persona
# Select a persona
# Ask: "What are AAPL's risk factors?"
# Verify: Response includes SEC filing context
```

**Test Search Functionality**:
```bash
# Navigate to /search
# Query: "revenue growth"
# Ticker: AAPL
# Year: 2023
# Verify: Results show relevant chunks
```

---

## 🚧 Troubleshooting

### Common Issues

**Backend won't start**:
- Check Node.js version (>= 18)
- Verify all environment variables are set
- Run `npm install` again

**Frontend shows errors**:
- Ensure backend is running on port 3001
- Check CORS settings
- Clear browser cache

**No search results**:
- Verify Pinecone has data
- Check if filing was parsed and stored
- Ensure API keys are valid

**Python parser fails**:
- Install required packages: `pip install sec-edgar-downloader beautifulsoup4 nltk`
- Download NLTK data: `python -c "import nltk; nltk.download('punkt')"`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **SEC Edgar** - For providing public company filings
- **Google Gemini** - For powerful embedding models
- **Pinecone** - For vector database infrastructure
- **OpenRouter** - For LLM API access
- **Supabase** - For database and authentication

---

## 📞 Support

For questions or issues:

- 📧 Email: support@finceptor.com
- 💬 Discord: [Join our community](https://discord.gg/finceptor)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/finceptor/issues)

---

<div align="center">

**Made with ❤️ for the next generation of investors**

[⬆ Back to Top](#-finceptor---ai-powered-financial-intelligence-platform)

</div>