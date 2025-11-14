import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="w-full py-4 bg-pink-100/90 backdrop-blur-sm fixed top-0 left-0 right-0 shadow-sm border-b border-pink-200 z-50">
      <nav className="max-w-5xl mx-auto px-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
            F
          </div>
          <h1 className="text-2xl font-extrabold gradient-text">Finceptor</h1>
        </Link>
        <div className="flex gap-6 items-center">
          <Link to="/persona">
            <button className="text-pink-600 hover:text-pink-800 font-medium transition-colors flex items-center gap-1">
              <span className="text-lg">🎭</span>
              <span>Personas</span>
            </button>
          </Link>
          <Link to="/search">
            <button className="text-pink-600 hover:text-pink-800 font-medium transition-colors flex items-center gap-1">
              <span className="text-lg">🔍</span>
              <span>Search</span>
            </button>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export default Header;