import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

function Chatbot() {
  return (
    <div className="bg-gradient-to-b from-pink-100 to-pink-200 text-gray-800 min-h-screen px-4 flex flex-col">
      <Header />
      <div className="max-w-5xl mx-auto text-center pt-24">
        <h2 className="text-4xl md:text-5xl gradient-text font-extrabold mb-6">
          Advanced AI Features
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Coming Soon: Enhanced conversational AI with multi-turn context and portfolio analysis
        </p>
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl mx-auto">
          <div className="space-y-4 text-left">
            <div className="flex items-start">
              <span className="text-2xl mr-3">🤖</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Multi-Turn Conversations</h3>
                <p className="text-gray-600">Maintain context across multiple questions</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">📊</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Portfolio Analysis</h3>
                <p className="text-gray-600">Get insights on your investment portfolio</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">📈</span>
              <div>
                <h3 className="font-bold text-lg mb-1">Market Trends</h3>
                <p className="text-gray-600">Real-time analysis of market movements</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Chatbot;