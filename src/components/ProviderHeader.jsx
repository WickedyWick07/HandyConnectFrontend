import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const ProviderHeader = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { to: '/dashboard/service-provider', label: 'Dashboard' },
        { to: '/provider-bookings', label: 'View Requests' },
        { to: '/messages', label: 'Messages' },
        { to: '/history', label: 'History' },
        { to: '/settings', label: 'Settings' },
    ];

    return (
        <div>
            <header className="flex items-center justify-between w-full p-4 bg-white relative">
                <div className="flex items-center gap-3">
                    <h1 className="font-sans font-extrabold text-2xl">HandyConnect</h1>

                    {/* Desktop nav */}
                    <nav className="hidden lg:block">
                        <ul className="flex flex-end text-gray-700 gap-4">
                            {navLinks.map((link) => (
                                <li key={link.to} className="text-sm text-gray-700 font-semibold cursor-pointer hover:text-purple-500">
                                    <Link to={link.to}>{link.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>

                {/* Hamburger button */}
                <button
                    className="lg:hidden"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? (
                        <XMarkIcon className="size-7 text-gray-700" />
                    ) : (
                        <Bars3Icon className="size-7 text-gray-700" />
                    )}
                </button>
            </header>

            {/* Mobile menu overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Mobile menu drawer */}
            <nav
                className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
                    isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex justify-end p-4">
                    <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                        <XMarkIcon className="size-7 text-gray-700" />
                    </button>
                </div>
                <ul className="flex flex-col gap-2 px-6">
                    {navLinks.map((link) => (
                        <li
                            key={link.to}
                            className="text-base text-gray-700 font-semibold cursor-pointer hover:text-purple-500 py-3 border-b border-gray-100"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <Link to={link.to}>{link.label}</Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export default ProviderHeader;