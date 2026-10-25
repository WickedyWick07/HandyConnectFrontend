import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { UserCircleIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

// Order matters: this is the order shown in the mobile menu.
// Sign In is rendered separately (outlined button on desktop, last item on mobile).
const NAV_LINKS = [
    { label: 'Home', to: '/' },
    { label: 'Services', to: '/services' },
    { label: 'Handyman Listings', to: '/handyman-listings' },
];
const HELP_LINK = { label: 'Help', to: '/help' }; // change to your real help route
const SIGN_IN_LINK = { label: 'Sign In', to: '/sign-in' };

const DESKTOP_QUERY = '(min-width: 1024px)'; // Tailwind `lg`

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleRef = useRef(null);

    const closeMenu = useCallback(() => setIsMenuOpen(false), []);
    const toggleMenu = () => setIsMenuOpen((open) => !open);

    // ESC closes the menu and returns focus to the toggle button
    useEffect(() => {
        if (!isMenuOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsMenuOpen(false);
                toggleRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isMenuOpen]);

    // Prevent body scroll while the menu is open
    useEffect(() => {
        if (!isMenuOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isMenuOpen]);

    // If the viewport grows to desktop (rotate iPad, resize window), reset the menu
    useEffect(() => {
        const mql = window.matchMedia(DESKTOP_QUERY);
        const onChange = (e) => {
            if (e.matches) setIsMenuOpen(false);
        };
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    const desktopLinkClass =
        'text-sm font-semibold text-gray-700 transition-colors hover:text-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded';

    const mobileLinkClass =
        'block px-6 py-4 text-base font-semibold text-gray-800 transition-colors hover:bg-purple-50 hover:text-purple-600 focus-visible:outline-none focus-visible:bg-purple-50 focus-visible:text-purple-600';

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-gray-100/80 backdrop-blur-md">
            <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link
                    to="/"
                    onClick={closeMenu}
                    className="font-sans text-2xl font-extrabold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 rounded"
                >
                    HandyConnect
                </Link>

                {/* Desktop nav (>= 1024px) */}
                <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
                    <ul className="flex items-center gap-6">
                        {NAV_LINKS.map(({ label, to }) => (
                            <li key={to}>
                                <Link to={to} className={desktopLinkClass}>
                                    {label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-2">
                        <Link
                            to={SIGN_IN_LINK.to}
                            className="flex items-center gap-2 rounded border border-purple-500 px-4 py-2 text-sm font-semibold text-purple-500 transition-colors hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                        >
                            <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
                            {SIGN_IN_LINK.label}
                        </Link>
                        <Link
                            to={HELP_LINK.to}
                            className="flex items-center gap-2 rounded border border-purple-500 bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                        >
                            <QuestionMarkCircleIcon className="h-5 w-5" aria-hidden="true" />
                            {HELP_LINK.label}
                        </Link>
                    </div>
                </nav>

                {/* Hamburger (< 1024px) */}
                <button
                    ref={toggleRef}
                    type="button"
                    onClick={toggleMenu}
                    aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-menu"
                    className="rounded p-2 text-gray-800 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 lg:hidden"
                >
                    {isMenuOpen ? (
                        <X className="h-6 w-6" aria-hidden="true" />
                    ) : (
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    )}
                </button>
            </div>

            {/* Click-outside overlay (absolute, not fixed: backdrop-blur makes the header
                the containing block for fixed children) */}
            <div
                aria-hidden="true"
                onClick={closeMenu}
                className={`absolute left-0 top-full h-screen w-full bg-black/20 transition-opacity duration-300 motion-reduce:transition-none lg:hidden ${
                    isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            {/* Mobile / tablet menu */}
            <nav
                id="mobile-menu"
                aria-label="Mobile"
                aria-hidden={!isMenuOpen}
                className={`absolute left-0 top-full w-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-gray-200 bg-white shadow-lg transition-all duration-300 ease-out motion-reduce:transition-none lg:hidden ${
                    isMenuOpen
                        ? 'visible translate-y-0 opacity-100'
                        : 'invisible pointer-events-none -translate-y-2 opacity-0'
                }`}
            >
                <ul className="flex flex-col py-2">
                    {NAV_LINKS.map(({ label, to }) => (
                        <li key={to}>
                            <Link to={to} onClick={closeMenu} className={mobileLinkClass}>
                                {label}
                            </Link>
                        </li>
                    ))}
                    <li>
                        <Link to={HELP_LINK.to} onClick={closeMenu} className={mobileLinkClass}>
                            {HELP_LINK.label}
                        </Link>
                    </li>
                    <li className="px-6 pb-4 pt-2">
                        <Link
                            to={SIGN_IN_LINK.to}
                            onClick={closeMenu}
                            className="flex w-full items-center justify-center gap-2 rounded border border-purple-500 px-4 py-3 text-base font-semibold text-purple-500 transition-colors hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                        >
                            <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
                            {SIGN_IN_LINK.label}
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default Header;