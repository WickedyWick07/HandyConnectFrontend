import settings from '../assets/Icons/house-gear-fill.svg';
import review from '../assets/Icons/envelope-paper-fill.svg';
import messages from '../assets/Icons/chat-dots-fill.svg';
import calendar from '../assets/Icons/calendar-date-fill.svg';
import house from '../assets/Icons/house-door-fill.svg';
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ProviderSidemenu = ({ isOpen = false, onClose = () => {} }) => {
    const { logout } = useContext(AuthContext);

    const menuContent = (
        <ul className="space-y-4 font-medium p-4 flex flex-col text-black">
            <div className="flex items-center justify-between px-2">
                <Link to="/">
                    <h1 className="font-sans font-extrabold text-xl p-2">HandyConnect</h1>
                </Link>
                <button onClick={onClose} className="lg:hidden" aria-label="Close menu">
                    <XMarkIcon className="size-6 text-gray-700" />
                </button>
            </div>
            <li><a href="/dashboard/service-provider" className="py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                <img src={house} className='w-4 h-4 mr-2' />
                Dashboard
            </a></li>
            <li><a href="/provider-bookings" className="py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                <img src={calendar} className='w-4 h-4 mr-2' />
                Requests
            </a></li>
            <li><a href="/messages" className="py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                <img src={messages} className='w-4 h-4 mr-2' />
                Messages
            </a></li>
            <li><a href="/service-provider/history" className="py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                <img src={review} className='w-4 h-4 mr-2' />
                History
            </a></li>
            <li><a href="/settings" className="py-2 px-4 rounded hover:bg-purple-500 hover:text-white flex items-center text-sm">
                <img src={settings} className='w-4 h-4 mr-2' />
                Settings
            </a></li>
            <li><button onClick={() => logout()} className="py-2 px-4 rounded hover:bg-red-500 hover:text-white flex items-center text-sm">
                <img src={settings} className='w-4 h-4 mr-2' />
                Logout
            </button></li>
        </ul>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <div className="hidden lg:block lg:w-44 min-h-screen bg-white text-black">
                {menuContent}
            </div>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Mobile drawer */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {menuContent}
            </div>
        </>
    );
};

export default ProviderSidemenu;