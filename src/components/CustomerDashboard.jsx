import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    Carpentry,
    Plumbing,
    Painting,
    HomeInstallation,
    Flooring,
    HomeCare,
    HomeAutomation,
    ExteriorMaintenance,
} from '../constants/Services';
import AuthContext from '../context/AuthContext';
import SideMenu from './SideMenu';
import api from '../utils/api';

/* -------------------------------------------------------------------------- */
/* Static data                                                                 */
/* -------------------------------------------------------------------------- */

// Category label is attached per group so cards can show it.
// The original service objects are passed through untouched to /service-providers.
const SERVICE_GROUPS = [
    { category: 'Carpentry', items: Carpentry },
    { category: 'Plumbing', items: Plumbing },
    { category: 'Home Installation', items: HomeInstallation },
    { category: 'Painting', items: Painting },
    { category: 'Flooring', items: Flooring },
    { category: 'Home Care', items: HomeCare },
    { category: 'Home Automation', items: HomeAutomation },
    { category: 'Exterior Maintenance', items: ExteriorMaintenance },
];

const SERVICES = SERVICE_GROUPS.flatMap(({ category, items }) =>
    items.map((item) => ({ category, item }))
);

// Matches the Tailwind grid breakpoints used by the services grid (1 / 2 / 3 / 4 columns)
const COLUMN_QUERIES = [
    ['(min-width: 1280px)', 4],
    ['(min-width: 1024px)', 3],
    ['(min-width: 768px)', 2],
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const getColumns = () => {
    if (typeof window === 'undefined') return 1;
    for (const [query, columns] of COLUMN_QUERIES) {
        if (window.matchMedia(query).matches) return columns;
    }
    return 1;
};

const useColumns = () => {
    const [columns, setColumns] = useState(getColumns);
    useEffect(() => {
        const lists = COLUMN_QUERIES.map(([query]) => window.matchMedia(query));
        const update = () => setColumns(getColumns());
        lists.forEach((l) => l.addEventListener('change', update));
        return () => lists.forEach((l) => l.removeEventListener('change', update));
    }, []);
    return columns;
};

const byDate = (a, b) => new Date(a.date) - new Date(b.date);

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
};

/* -------------------------------------------------------------------------- */
/* Cards                                                                       */
/* -------------------------------------------------------------------------- */

const ServiceCard = ({ category, service, onSelect }) => (
    <button
        type="button"
        onClick={() => onSelect(service)}
        className="flex h-full min-h-[160px] w-full min-w-0 flex-col gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50">
            <img src={service.Icon} alt="" className="h-5 w-5 object-contain" />
        </span>
        <span className="truncate text-xs font-medium text-purple-600">{category}</span>
        <span className="line-clamp-2 break-words text-sm font-semibold text-gray-900">{service.Title}</span>
        <span className="line-clamp-3 break-words text-xs text-gray-500">{service.Description}</span>
    </button>
);

const BookingCard = ({ booking, onView }) => (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 rounded-lg border border-gray-200 p-4 transition-shadow hover:shadow-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-x-4">
        <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{booking.service}</p>
            <p className="mt-0.5 break-words text-xs text-gray-500">
                Booked for: {booking.date} at {booking.time}
            </p>
        </div>
        <span
            className={`justify-self-end rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-800'
            }`}
        >
            {booking.status}
        </span>
        <button
            type="button"
            onClick={() => onView(booking)}
            className="col-span-2 w-full rounded-lg border border-purple-700 px-4 py-2 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 sm:col-span-1 sm:w-auto"
        >
            View Details
        </button>
    </li>
);

const BookingsSection = ({ id, title, bookings, emptyText, onView }) => (
    <section aria-labelledby={id} className="rounded-xl bg-white p-4 shadow-sm md:p-6">
        <h2 id={id} className="mb-4 text-base font-bold text-gray-900">
            {title}
        </h2>
        {bookings.length > 0 ? (
            <ul className="space-y-3">
                {bookings.map((booking, i) => (
                    <BookingCard key={booking._id || booking.id || i} booking={booking} onView={onView} />
                ))}
            </ul>
        ) : (
            <p className="py-8 text-center text-lg font-semibold text-gray-300 sm:text-2xl">{emptyText}</p>
        )}
    </section>
);

const ProviderAvatar = ({ provider }) => {
    const pic = provider.profilePicture;
    const name = provider.companyName || 'Provider';
    const sources = !pic
        ? []
        : pic.startsWith('http')
          ? [pic]
          : [`${import.meta.env.VITE_IMAGES_API_URL}${pic}`, `https://localhost:5000${pic}`];
    const [attempt, setAttempt] = useState(0);

    if (attempt >= sources.length) {
        return (
            <span
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-purple-100 text-sm font-bold text-purple-700"
            >
                {name.charAt(0).toUpperCase()}
            </span>
        );
    }

    return (
        <img
            src={sources[attempt]}
            alt={provider.companyName || 'Provider profile'}
            onError={() => setAttempt((a) => a + 1)}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
    );
};

const ProviderCard = ({ provider }) => (
    <li className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-gray-200 p-4">
        <div className="flex min-w-0 items-center gap-3">
            <ProviderAvatar provider={provider} />
            <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900">{provider.companyName}</h3>
        </div>
        <p className="line-clamp-3 break-words text-xs text-gray-500">{provider.description}</p>
    </li>
);

const NotificationButton = ({ className = '' }) => (
    <button
        type="button"
        aria-label="Notifications"
        className={`rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${className}`}
    >
        <Bell className="h-6 w-6" aria-hidden="true" />
    </button>
);

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const CustomerDashboard = () => {
    const navigate = useNavigate();
    const { fetchCurrentUser } = useContext(AuthContext);

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const menuButtonRef = useRef(null);

    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [serviceProviders, setServiceProviders] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);

    const columns = useColumns();
    const pageSize = columns === 1 ? 4 : columns * 2;
    const totalPages = Math.max(1, Math.ceil(SERVICES.length / pageSize));
    const page = Math.min(currentPage, totalPages - 1);
    const visibleServices = SERVICES.slice(page * pageSize, page * pageSize + pageSize);

    const closeSidebar = useCallback(() => {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
    }, []);

    /* ---- Data ---------------------------------------------------------- */
    useEffect(() => {
        const fetchUser = async () => {
            try {
                setUser(await fetchCurrentUser());
            } catch (err) {
                console.error('Error fetching the user', err.stack);
            }
        };

        const fetchAllProviders = async () => {
            try {
                const response = await api.get('/fetch-service-providers');
                setServiceProviders(response.data.data);
            } catch (error) {
                console.error('Error fetching all providers:', error);
            }
        };

        fetchUser();
        fetchAllProviders();
    }, []);

    useEffect(() => {
        if (!user) return; // wait until the user is loaded
        const getBookings = async () => {
            try {
                const res = await api.post('/fetch-customer-bookings', { user });
                setBookings(res.data.data);
            } catch (error) {
                console.error('There was an error fetching bookings', error);
            }
        };
        getBookings();
    }, [user]);

    const pendingBookings = useMemo(
        () => bookings.filter((b) => b.status === 'pending').sort(byDate).slice(0, 3),
        [bookings]
    );
    const acceptedBookings = useMemo(
        () => bookings.filter((b) => b.status === 'accepted').sort(byDate).slice(0, 3),
        [bookings]
    );

    /* ---- Actions ------------------------------------------------------- */
    const viewBooking = (booking) => navigate('/view-customer-booking', { state: { booking } });
    const goToService = (service) => navigate('/service-providers', { state: { service } });

    return (
        <div className="flex min-h-screen w-full overflow-x-clip bg-slate-100">
            <SideMenu open={sidebarOpen} onClose={closeSidebar} />

            <div className="min-w-0 flex-1">
                {/* Top bar: mobile only */}
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur md:hidden">
                    <button
                        ref={menuButtonRef}
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={sidebarOpen}
                        aria-controls="side-menu"
                        className="-ml-2 rounded-md p-2 text-gray-800 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    >
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <span className="text-lg font-extrabold text-black">HandyConnect</span>
                    <NotificationButton className="-mr-2" />
                </header>

                <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
                    {/* Welcome */}
                    <section className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-bold text-gray-900 md:text-2xl">
                                Welcome back, {user ? user.firstName : 'Guest'}!
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Find the perfect service provider for your needs
                            </p>
                        </div>
                        <NotificationButton className="hidden md:inline-flex" />
                    </section>

                    {/* Services */}
                    <section aria-labelledby="services-heading">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 id="services-heading" className="text-base font-bold text-gray-900">
                                Recommended Services
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500" aria-live="polite">
                                    {page + 1} / {totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(Math.max(0, page - 1))}
                                    disabled={page === 0}
                                    aria-label="Previous services"
                                    className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage(Math.min(totalPages - 1, page + 1))}
                                    disabled={page >= totalPages - 1}
                                    aria-label="Next services"
                                    className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {visibleServices.map(({ category, item }, i) => (
                                <ServiceCard
                                    key={`${category}-${item.Title}-${i}`}
                                    category={category}
                                    service={item}
                                    onSelect={goToService}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Bookings */}
                    <BookingsSection
                        id="pending-heading"
                        title="Pending Bookings"
                        bookings={pendingBookings}
                        emptyText="No pending bookings"
                        onView={viewBooking}
                    />
                    <BookingsSection
                        id="accepted-heading"
                        title="Accepted Bookings"
                        bookings={acceptedBookings}
                        emptyText="No accepted bookings"
                        onView={viewBooking}
                    />

                    {/* Providers */}
                    <section aria-labelledby="providers-heading" className="rounded-xl bg-white p-4 shadow-sm md:p-6">
                        <h2 id="providers-heading" className="mb-4 text-base font-bold text-gray-900">
                            Recommended Providers
                        </h2>
                        {serviceProviders.length > 0 ? (
                            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {serviceProviders.slice(0, 3).map((provider, i) => (
                                    <ProviderCard key={provider._id || provider.id || i} provider={provider} />
                                ))}
                            </ul>
                        ) : (
                            <p className="py-6 text-center text-sm text-gray-400">No providers available yet</p>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default CustomerDashboard;