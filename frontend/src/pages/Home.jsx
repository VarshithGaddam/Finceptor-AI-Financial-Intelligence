import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import FilingParserButton from '../components/FilingParserButton.jsx';

function Home() {
  return (
    <div className="bg-gradient-to-br from-pink-100 to-pink-200 text-gray-800 flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl gradient-text font-extrabold mb-6">
            Finceptor
          </h1>
          <p className="text-2xl md:text-3xl mb-4 font-semibold text-gray-800">
            AI-Powered Financial Intelligence
          </p>
          <p className="text-lg md:text-xl mb-10 text-gray-600 max-w-2xl mx-auto">
            Democratizing institutional-grade financial analysis with persona-driven AI advisors and real-time SEC filing insights.
          </p>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center mb-12">
            <Link to="/persona" className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-xl text-xl md:text-2xl px-10 py-4 font-bold hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
              <span>Get Started</span>
              <span>→</span>
            </Link>
            <FilingParserButton />
          </div>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-3">🎭</div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">5 Unique Personas</h3>
              <p className="text-gray-600 text-sm">Choose an AI advisor that matches your investment style</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">SEC Filing Analysis</h3>
              <p className="text-gray-600 text-sm">Real-time parsing and semantic search of company filings</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-3">🤖</div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">Context-Aware AI</h3>
              <p className="text-gray-600 text-sm">Get advice backed by actual company data with source citations</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Home;