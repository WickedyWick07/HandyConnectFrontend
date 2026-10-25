import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import CustomerHeader from '../components/CustomerHeader';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowRight,
    BadgeCheck,
    Calendar,
    CalendarX,
    CheckCircle2,
    Clock,
    FileText,
    Hourglass,
    MapPin,
    Wrench,
    XCircle,
} from 'lucide-react';

// Your page only listed accepted bookings, so that is kept.
// To show every booking instead, change this to null.
const SHOW_STATUS = 'accepted';

const STATUS_CONFIG = {
    pending: { label: 'Pending', icon: Hourglass, badge: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
    accepted: { label: 'Accepted', icon: BadgeCheck, badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
    completed: { label: 'Completed', icon: CheckCircle2, badge: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
    declined: { label: 'Declined', icon: XCircle, badge: 'bg-red-50 text-red-700 ring-red-600/20' },
};

const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

const formatDate = (value) => {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(value)); // avoid a timezone day-shift
    return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(dateOnly ? { timeZone: 'UTC' } : {}),
    });
};

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] ?? {
        label: status || 'Unknown',
        icon: Clock,
        badge: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    };
    const Icon = config.icon;
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${config.badge}`}
        >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {config.label}
        </span>
    );
};

const DetailRow = ({ icon: Icon, label, clamp = false, children }) => (
    <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <dt className="sr-only">{label}</dt>
        <dd className={`min-w-0 flex-1 break-words text-sm text-slate-600 ${clamp ? 'line-clamp-2' : 'truncate'}`}>
            {children}
        </dd>
    </div>
);

const BookingCard = ({ booking, onView }) => {
    const title = booking.service || 'Service booking';
    const date = formatDate(booking.date);
    const time = booking.time || 'Not set';
    const location = booking.location || 'No location provided';
    const problem = booking.problem_description || 'No description provided';

    return (
        <li className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Wrench className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="line-clamp-2 break-words text-base font-semibold capitalize text-slate-900" title={title}>
                        {title}
                    </h2>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            <dl className="mt-5 space-y-3">
                <DetailRow icon={Calendar} label="Date">
                    <span title={date}>{date}</span>
                </DetailRow>
                <DetailRow icon={Clock} label="Time">
                    <span title={time}>{time}</span>
                </DetailRow>
                <DetailRow icon={MapPin} label="Location">
                    <span title={location}>{location}</span>
                </DetailRow>
                <DetailRow icon={FileText} label="Problem" clamp>
                    <span title={problem}>{problem}</span>
                </DetailRow>
            </dl>

            <div className="mt-auto pt-5">
                <button
                    type="button"
                    onClick={() => onView(booking)}
                    aria-label={`View details for ${title}`}
                    className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 active:bg-blue-800 ${focusRing}`}
                >
                    View Details
                    <ArrowRight
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden="true"
                    />
                </button>
            </div>
        </li>
    );
};

const SkeletonCard = () => (
    <li className="flex h-72 animate-pulse flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-slate-100" />
                <div className="h-4 w-28 rounded bg-slate-100" />
            </div>
            <div className="h-6 w-20 rounded-full bg-slate-100" />
        </div>
        <div className="mt-6 space-y-4">
            <div className="h-3 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
            <div className="h-3 w-full rounded bg-slate-100" />
        </div>
        <div className="mt-auto h-11 w-full rounded-xl bg-slate-100" />
    </li>
);

const AllCustomerBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { fetchCurrentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetchCurrentUser();
                setUser(response);
            } catch (err) {
                console.error('Error fetching the user', err.stack);
                setError('Error fetching user details.');
                setLoading(false);
            }
        };
        fetchUser();
    }, [fetchCurrentUser]);

    // Fetch bookings once user is set
    useEffect(() => {
        if (!user) return;

        const getBookings = async () => {
            setLoading(true);
            try {
                const res = await api.post('/fetch-customer-bookings', { user });
                setBookings(res.data.data || []);
            } catch (err) {
                // Your backend answers 400 when a customer has no bookings yet: show the empty state
                if (err?.response?.status === 400) {
                    setBookings([]);
                } else {
                    console.error('There was an error fetching bookings', err);
                    setError('Error fetching bookings.');
                }
            } finally {
                setLoading(false);
            }
        };

        getBookings();
    }, [user]);

    const viewBooking = (booking) => {
        navigate('/view-customer-booking', { state: { booking } });
    };

    const shownBookings = SHOW_STATUS ? bookings.filter((booking) => booking.status === SHOW_STATUS) : bookings;
    const title = SHOW_STATUS ? `${STATUS_CONFIG[SHOW_STATUS]?.label ?? SHOW_STATUS} Bookings` : 'All Bookings';

    return (
        <div className="min-h-screen bg-[#f5f7fb] font-[family-name:Inter,ui-sans-serif,system-ui,sans-serif] text-slate-900">
            <CustomerHeader />

            <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
                    <p className="mt-1 text-sm text-slate-500" aria-live="polite">
                        {loading || error
                            ? ' '
                            : `${shownBookings.length} ${shownBookings.length === 1 ? 'booking' : 'bookings'}`}
                    </p>
                </div>

                <div className="mt-6">
                    {loading ? (
                        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3" aria-busy="true">
                            {Array.from({ length: 6 }, (_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </ul>
                    ) : error ? (
                        <div
                            role="alert"
                            className="flex flex-col items-center rounded-2xl border border-red-100 bg-white px-6 py-14 text-center shadow-sm"
                        >
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                                <AlertCircle className="h-7 w-7" aria-hidden="true" />
                            </span>
                            <h2 className="mt-4 text-lg font-semibold text-slate-900">Something went wrong</h2>
                            <p className="mt-1 max-w-sm text-sm text-slate-500">{error}</p>
                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className={`mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 ${focusRing}`}
                            >
                                Try again
                            </button>
                        </div>
                    ) : shownBookings.length === 0 ? (
                        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <CalendarX className="h-7 w-7" aria-hidden="true" />
                            </span>
                            <h2 className="mt-4 text-lg font-semibold text-slate-900">No bookings found</h2>
                            <p className="mt-1 max-w-sm text-sm text-slate-500">
                                When you have {SHOW_STATUS ? SHOW_STATUS : ''} bookings, they will show up here.
                            </p>
                        </div>
                    ) : (
                        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
                            {shownBookings.map((booking, i) => (
                                <BookingCard key={booking._id || booking.id || i} booking={booking} onView={viewBooking} />
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AllCustomerBookings;