import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { History, LayoutDashboard, Menu, MessageSquare, Settings, Users, X } from 'lucide-react';

// Same links and routes as your original header
const NAV_ITEMS = [
    { label: 'Dashboard', to: '/dashboard/customer', icon: LayoutDashboard },
    { label: 'View Providers', to: '/service-providers', icon: Users },
    { label: 'Messages', to: '/messages', icon: MessageSquare },
    { label: 'History', to: '/history', icon: History },
    { label: 'Settings', to: '/settings', icon: Settings },
];

const DESKTOP_QUERY = '(min-width: 768px)'; // Tailwind `md`

const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

const desktopLinkClass = ({ isActive }) =>
    `relative flex h-full items-center px-3 py-2 text-sm font-semibold transition-colors duration-200 ${focusRing} ${
        isActive
            ? 'text-blue-700 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-blue-600'
            : 'text-slate-600 hover:text-slate-900'
    }`;

const drawerLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold transition-colors duration-200 ${focusRing} ${
        isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
    }`;

const CustomerHeader = () => {
    const [open, setOpen] = useState(false);
    const menuButtonRef = useRef(null);
    const closeButtonRef = useRef(null);

    const close = useCallback(() => setOpen(false), []);

    // ESC closes the drawer and returns focus to the hamburger button
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                menuButtonRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    // Lock page scroll and move focus into the drawer while it is open
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);

    // Close the drawer if the window grows to tablet/desktop width
    useEffect(() => {
        const mql = window.matchMedia(DESKTOP_QUERY);
        const onChange = (e) => {
            if (e.matches) setOpen(false);
        };
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
                    <Link
                        to="/dashboard/customer"
                        className={`rounded-lg font-sans text-xl font-extrabold tracking-tight text-slate-900 md:text-2xl ${focusRing}`}
                    >
                        HandyConnect
                    </Link>

                    {/* Desktop / tablet navigation */}
                    <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
                        {NAV_ITEMS.map(({ label, to }) => (
                            <NavLink key={to} to={to} className={desktopLinkClass}>
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Hamburger (mobile) */}
                    <button
                        ref={menuButtonRef}
                        type="button"
                        onClick={() => setOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={open}
                        aria-controls="customer-drawer"
                        className={`-mr-2 rounded-lg p-2 text-slate-800 transition-colors duration-200 hover:bg-slate-100 md:hidden ${focusRing}`}
                    >
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>
            </header>

            {/* Overlay and drawer sit outside <header>: backdrop-blur would make the header the
                containing block for fixed children and squash them to the header's height. */}
            <div
                aria-hidden="true"
                onClick={close}
                className={`fixed inset-0 z-40 bg-slate-900/50 transition-opacity duration-300 motion-reduce:transition-none md:hidden ${
                    open ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
            />

            <aside
                id="customer-drawer"
                aria-label="Menu"
                aria-hidden={!open}
                className={`fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-white shadow-xl transition-[transform,visibility] duration-300 ease-out motion-reduce:transition-none md:hidden ${
                    open ? 'visible translate-x-0' : 'invisible translate-x-full'
                }`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
                    <Link
                        to="/dashboard/customer"
                        onClick={close}
                        className={`rounded-lg font-sans text-xl font-extrabold tracking-tight text-slate-900 ${focusRing}`}
                    >
                        HandyConnect
                    </Link>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={close}
                        aria-label="Close menu"
                        className={`-mr-2 rounded-lg p-2 text-slate-600 transition-colors duration-200 hover:bg-slate-100 ${focusRing}`}
                    >
                        <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>

                <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
                            <li key={to}>
                                <NavLink to={to} onClick={close} className={drawerLinkClass}>
                                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                    {label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
            </aside>
        </>
    );
};

export default CustomerHeader;