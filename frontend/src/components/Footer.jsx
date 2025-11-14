import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-pink-100 to-purple-100 border-t border-pink-200 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
                F
              </div>
              <h3 className="text-xl font-extrabold gradient-text">Finceptor</h3>
            </div>
            <p className="text-gray-600 text-sm">
              AI-powered financial intelligence platform democratizing access to institutional-grade analysis.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-pink-600 text-sm transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/persona" className="text-gray-600 hover:text-pink-600 text-sm transition-colors">
                  Personas
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-600 hover:text-pink-600 text-sm transition-colors">
                  Search Filings
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://www.sec.gov" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600 text-sm transition-colors">
                  SEC.gov
                </a>
              </li>
              <li>
                <a href="https://github.com/yourusername/finceptor" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600 text-sm transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <span className="text-gray-600 text-sm">
                  API Documentation
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-pink-200 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © 2024 Finceptor. Made with ❤️ for the next generation of investors.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <span className="text-gray-500 text-xs">Powered by AI</span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-gray-500 text-xs">SEC Data</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
