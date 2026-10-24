import { useEffect, useRef, useState } from 'react';
import { BellAlertIcon } from '@heroicons/react/24/solid';
import {
    CheckCircleIcon,
    XCircleIcon,
    InformationCircleIcon,
} from '@heroicons/react/24/outline';

const STORAGE_KEY = 'readNotificationIds';

const TYPE_STYLES = {
    success: { Icon: CheckCircleIcon, color: 'text-green-600' },
    error: { Icon: XCircleIcon, color: 'text-red-600' },
    info: { Icon: InformationCircleIcon, color: 'text-blue-600' },
};

const loadReadIds = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(stored) ? stored : [];
    } catch (err) {
        return [];
    }
};

const saveReadIds = (ids) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (err) {
        // Storage unavailable: read state just won't be remembered
    }
};

const timeAgo = (value) => {
    if (!value) return '';
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '';

    const seconds = Math.floor((Date.now() - then) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    return new Date(value).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Props:
 * - notifications: array of
 *     { id: string, message: string, type?: 'success' | 'error' | 'info',
 *       time?: ISO date string, read?: boolean, ...anything else you need }
 * - onNotificationClick: (notification) => void   (optional, e.g. navigate somewhere)
 *
 * BACKEND HOOK: when a notifications endpoint exists, fetch the list in the
 * dashboard and pass it in here. Marking as read is only remembered in this
 * browser for now.
 */
const NotificationBell = ({ notifications = [], onNotificationClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [readIds, setReadIds] = useState(loadReadIds);
    const containerRef = useRef(null);

    // Close when clicking outside or pressing Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const isRead = (n) => !!n.read || readIds.includes(n.id);
    const unreadCount = notifications.filter((n) => !isRead(n)).length;

    const markAsRead = (ids) => {
        const next = [...new Set([...readIds, ...ids])];
        setReadIds(next);
        saveReadIds(next);
    };

    const markAllAsRead = () => {
        markAsRead(notifications.map((n) => n.id));
    };

    const handleItemClick = (notification) => {
        markAsRead([notification.id]);
        setIsOpen(false);
        if (onNotificationClick) onNotificationClick(notification);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-haspopup="true"
                aria-expanded={isOpen}
                className="relative p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                <BellAlertIcon className="size-8" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed inset-x-4 top-24 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <h2 className="font-bold text-sm">Notifications</h2>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                            <p className="text-sm font-medium text-gray-700">
                                You&apos;re all caught up
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                No notifications right now.
                            </p>
                        </div>
                    ) : (
                        <ul className="max-h-80 overflow-y-auto">
                            {notifications.map((notification) => {
                                const read = isRead(notification);
                                const { Icon, color } =
                                    TYPE_STYLES[notification.type] || TYPE_STYLES.info;
                                const time = timeAgo(notification.time);

                                return (
                                    <li key={notification.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleItemClick(notification)}
                                            className={`w-full flex gap-3 text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 ${
                                                read ? '' : 'bg-purple-50'
                                            }`}
                                        >
                                            <Icon className={`size-6 shrink-0 ${color}`} />
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={`text-sm break-words ${
                                                        read
                                                            ? 'text-gray-600'
                                                            : 'text-gray-900 font-medium'
                                                    }`}
                                                >
                                                    {notification.message}
                                                </p>
                                                {time && (
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {time}
                                                    </p>
                                                )}
                                            </div>
                                            {!read && (
                                                <span
                                                    className="mt-1.5 size-2 rounded-full bg-purple-500 shrink-0"
                                                    aria-label="Unread"
                                                />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;