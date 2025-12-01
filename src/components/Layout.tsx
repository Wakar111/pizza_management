import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export default function Layout() {
    const { user, isAdmin, signOut } = useAuth();
    const { totalItems, clearCart } = useCart();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
            clearCart();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center space-x-3 group">
                            <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                <img src="/pizza-logo.png" alt="Pizza Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                    Hot Pizza
                                </div>
                                <div className="text-xs text-gray-500 -mt-1">Authentische Küche</div>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-8">
                            {isAdmin ? (
                                <>
                                    <Link
                                        to="/admin"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Dashboard
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/menu"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Menü
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/orders"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Bestellungen
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/settings"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Einstellungen
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/stammkunden"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        👥
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/admin/abrechnungen"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        📊
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Home
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/menu"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Menü
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/user/info"
                                        className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200 relative group"
                                    >
                                        Info
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                                    </Link>
                                    <Link
                                        to="/cart"
                                        className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors duration-200 rounded-full hover:bg-gray-100"
                                    >
                                        <div className="relative">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h15M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                                            </svg>
                                            {totalItems > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                                                    {totalItems}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Auth Section */}
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <div className="flex items-center space-x-3">
                                    {isAdmin && (
                                        <Link
                                            to="/admin"
                                            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-4 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                                        >
                                            <span className="flex items-center space-x-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>Admin</span>
                                            </span>
                                        </Link>
                                    )}
                                    <div className="flex items-center space-x-2 text-gray-700">
                                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-bold">{user.email?.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <span className="hidden sm:block text-sm">{user.email}</span>
                                    </div>
                                    <button
                                        onClick={handleSignOut}
                                        className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all duration-200"
                                        title="Abmelden"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    Anmelden
                                </Link>
                            )}

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-gray-100">
                            <div className="flex flex-col space-y-2">
                                {isAdmin ? (
                                    <>
                                        <Link
                                            to="/admin"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Dashboard
                                        </Link>
                                        <Link
                                            to="/admin/menu"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Menü
                                        </Link>
                                        <Link
                                            to="/admin/orders"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Bestellungen
                                        </Link>
                                        <Link
                                            to="/admin/settings"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Einstellungen
                                        </Link>
                                        <Link
                                            to="/admin/stammkunden"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Stammkunden 👥
                                        </Link>
                                        <Link
                                            to="/admin/abrechnungen"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Abrechnungen 📊
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link
                                            to="/"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Home
                                        </Link>
                                        <Link
                                            to="/menu"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Menü
                                        </Link>
                                        <Link
                                            to="/user/info"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors"
                                        >
                                            Info
                                        </Link>
                                        <Link
                                            to="/cart"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-between"
                                        >
                                            <span>Warenkorb</span>
                                            {totalItems > 0 && (
                                                <span className="bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                                    {totalItems}
                                                </span>
                                            )}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="min-h-screen pt-20">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-gray-300">© 2024 Restaurant Pizza. Alle Rechte vorbehalten.</p>

                        {/* Developer Credit */}
                        <div className="text-gray-400 text-sm">
                            Developed by{' '}
                            <a
                                href="https://innovativ-tech.de/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
                            >
                                Innovative-Tech
                            </a>
                        </div>

                        <div className="flex space-x-6">
                            <Link to="/user/agb" className="text-gray-300 hover:text-white transition-colors">
                                AGB
                            </Link>
                            <Link to="/user/datenschutz" className="text-gray-300 hover:text-white transition-colors">
                                Datenschutz
                            </Link>
                            <Link to="/user/impressum" className="text-gray-300 hover:text-white transition-colors">
                                Impressum
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
