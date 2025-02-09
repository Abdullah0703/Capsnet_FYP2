import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './components/Home';
import Working from './components/Working';
import About from './components/About';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 text-white">
        <Navbar />
        <main className="pt-20 pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/working" element={<Working />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <footer className="mt-12 text-center text-sm opacity-75 pb-8">
          <p>Medical AI System - For research use only. Not for clinical diagnosis.</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;