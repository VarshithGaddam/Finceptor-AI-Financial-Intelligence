import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Persona from './pages/Persona.jsx';
import Chatbot from './pages/Chatbot.jsx';
import SearchFilings from './pages/SearchFilings.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/persona" element={<Persona />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/search" element={<SearchFilings />} />
      </Routes>
    </Router>
  );
}

export default App;