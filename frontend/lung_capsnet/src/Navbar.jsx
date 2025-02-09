import { Link } from 'react-router-dom';
import Working from './components/Working';
import About from './components/About';
const Navbar = () => {
    return (
        <nav className="fixed w-full top-0 z-50 bg-gradient-to-br from-blue-900 to-gray-900 border-b border-white/20 backdrop-blur-lg">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex-shrink-0">
                        <Link to="/" className="text-2xl font-bold text-white">🫁 LungAI</Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="flex space-x-8">
                            <Link
                                to="/"
                                className="text-blue-200 hover:text-white cursor-pointer px-3 py-2 rounded-md text-md font-medium transition-all"
                            >
                                Home
                            </Link>
                            <Link
                                to="/working"
                                className="text-blue-200 hover:text-white cursor-pointer px-3 py-2 rounded-md text-md font-medium transition-all"
                            >
                                How It Works
                            </Link>
                            <Link
                                to="/about"
                                className="text-blue-200 hover:text-white cursor-pointer px-3 py-2 rounded-md text-md font-medium transition-all"
                            >
                                About Us
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;