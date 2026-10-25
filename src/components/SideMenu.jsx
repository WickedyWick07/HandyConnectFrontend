import { useCallback, useContext, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Users,
    MessageSquare,
    History,
    Settings,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import AuthContext from '../context/AuthContext';

// Same links as before
const NAV_ITEMS = [
    { label: 'Dashboard', to: '/customer/dashboard', icon: LayoutDashboard },
    { label: 'My Bookings', to: '/all-bookings', icon: Calendar },
    { label: 'Service Providers', to: '/service-providers', icon: Users },
    { label: 'Messages', to: '/messages', icon: MessageSquare },
    { label: 'History', to: '/history', icon: History },
    { label: 'Settings', to: '/settings', icon: Settings },
];

const MD_QUERY = '(min-width: 768px)'; // Tailwind `md`

const itemBase =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:justify-center lg:justify-start focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500';

const navLinkClass = ({ isActive }) =>
    `${itemBase} ${isActive ? 'bg-purple-500 text-white' : 'text-gray-700 hover:bg-purple-500 hover:text-white'}`;

// Label stays in the DOM for screen readers but is hidden in the 72px icon rail
const labelClass = 'md:sr-only lg:not-sr-only';

/**
 * Responsive sidebar.
 *  - lg and up (>=1024px): 240px, icons + text
 *  - md (768-1023px):      72px icon rail
 *  - below md:             slide-in drawer with overlay
 *
 * Controlled:   <SideMenu open={open} onClose={() => setOpen(false)} />  (page renders its own hamburger)
 * Uncontrolled: <SideMenu />  (renders its own floating hamburger on mobile, so other pages keep working)
 */
const SideMenu = ({ open, onClose }) => {
    const { logout } = useContext(AuthContext);

    const controlled = open !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = controlled ? open : internalOpen;

    const close = useCallback(() => {
        if (controlled) onClose?.();
        else setInternalOpen(false);
    }, [controlled, onClose]);

    // ESC closes the drawer
    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') close();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, close]);

    // Lock body scroll while the drawer is open
    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    // Reset the drawer if the viewport grows to tablet/desktop
    useEffect(() => {
        const mql = window.matchMedia(MD_QUERY);
        const onChange = (e) => {
            if (e.matches) close();
        };
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [close]);

    return (
        <>
            {/* Floating hamburger, only when the page doesn't provide its own */}
            {!controlled && (
                <button
                    type="button"
                    onClick={() => setInternalOpen(true)}
                    aria-label="Open menu"
                    aria-expanded={isOpen}
                    aria-controls="side-menu"
                    className="fixed left-3 top-3 z-30 rounded-lg bg-white p-2 text-gray-800 shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 md:hidden"
                >
                    <Menu className="h-6 w-6" aria-hidden="true" />
                </button>
            )}

            {/* Overlay (mobile drawer only) */}
            <div
                aria-hidden="true"
                onClick={close}
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 motion-reduce:transition-none md:hidden ${
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            <aside
                id="side-menu"
                aria-label="Sidebar"
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white text-black shadow-xl transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none md:visible md:sticky md:bottom-auto md:top-0 md:h-screen md:w-[72px] md:shrink-0 md:translate-x-0 md:shadow-none lg:w-60 ${
                    isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
                }`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4 md:justify-center lg:justify-between lg:px-5">
                    <span className="font-sans text-xl font-extrabold md:hidden lg:inline">HandyConnect</span>
                    <span
                        aria-hidden="true"
                        className="hidden h-9 w-9 place-items-center rounded-lg bg-purple-500 font-extrabold text-white md:grid lg:hidden"
                    >
                        H
                    </span>
                    <button
                        type="button"
                        onClick={close}
                        aria-label="Close menu"
                        className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 md:hidden"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>

                <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
                            <li key={to}>
                                <NavLink to={to} title={label} onClick={close} className={navLinkClass}>
                                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                    <span className={labelClass}>{label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="shrink-0 border-t border-gray-200 p-3">
                    <button
                        type="button"
                        onClick={() => logout()}
                        title="Logout"
                        className={`${itemBase} text-gray-700 hover:bg-red-500 hover:text-white`}
                    >
                        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <span className={labelClass}>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default SideMenu;