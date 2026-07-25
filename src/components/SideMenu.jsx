import { Link } from 'react-router-dom';
import settings from '../assets/Icons/house-gear-fill.svg';
import review from '../assets/Icons/envelope-paper-fill.svg';
import messages from '../assets/Icons/chat-dots-fill.svg';
import calendar from '../assets/Icons/calendar-date-fill.svg';
import house from '../assets/Icons/house-door-fill.svg';

import { useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const SideMenu = ({ isOpen = false, onClose = () => {} }) => {
    const { logout } = useContext(AuthContext);

    const menuItems = [
        {
            name: 'Dashboard',
            path: '/dashboard/customer',
            icon: house,
        },
        {
            name: 'My Bookings',
            path: '/all-bookings',
            icon: calendar,
        },
        {
            name: 'Service Providers',
            path: '/service-providers',
            icon: settings,
        },
        {
            name: 'Messages',
            path: '/messages',
            icon: messages,
        },
        {
            name: 'History',
            path: '/history',
            icon: review,
        },
        {
            name: 'Settings',
            path: '/settings',
            icon: settings,
        },
    ];

    const menuContent = (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
                <Link to="/">
                   <h1 className="text-xl font-bold text-black">
                    HandyConnect
                   </h1>
                </Link>

                <button
                    onClick={onClose}
                    className="lg:hidden"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 p-3 space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-600 hover:text-white transition"
                    >
                        <img
                            src={item.icon}
                            alt={item.name}
                            className="w-5 h-5"
                        />

                        <span>{item.name}</span>
                    </Link>
                ))}

                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500 hover:text-white transition text-left"
                >
                    <img
                        src={settings}
                        className="w-5 h-5"
                        alt="Logout"
                    />
                    <span>Logout</span>
                </button>
            </nav>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:w-60 bg-white shadow-md min-h-screen">
                {menuContent}
            </aside>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Mobile Drawer */}
            <aside
                className={`fixed top-0 left-0 w-64 h-screen bg-white shadow-lg z-50 transform transition-transform duration-300 lg:hidden ${
                    isOpen
                        ? 'translate-x-0'
                        : '-translate-x-full'
                }`}
            >
                {menuContent}
            </aside>
        </>
    );
};

export default SideMenu;