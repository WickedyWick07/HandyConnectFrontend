import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    Briefcase,
    CalendarDays,
    CalendarX,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Clock,
    DollarSign,
    Eye,
    MapPin,
} from 'lucide-react';
import ProviderSidemenu from './ProviderSidemenu';
import ProviderHeader from './ProviderHeader';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';

const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

const STATUS_BADGE = {
    accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    declined: 'bg-red-50 text-red-700 ring-red-600/20',
    completed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
};

const formatDate = (value) => {
    if (!value) return '–';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const utc = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? { timeZone: 'UTC' } : {};
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...utc }).format(d);
};

/* -------------------------------------------------------------------------- */
/* Small components                                                            */
/* -------------------------------------------------------------------------- */

const StatusBadge = ({ status }) => (
    <span
        className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${
            STATUS_BADGE[status] || STATUS_BADGE.pending
        }`}
    >
        {status || 'pending'}
    </span>
);

const StatCard = ({ icon: Icon, label, value, tone }) => (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
    </div>
);

const Panel = ({ title, action, children, className = '' }) => (
    <section className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6 ${className}`}>
        <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {action}
        </div>
        <div className="mt-4">{children}</div>
    </section>
);

const EmptyState = ({ icon: Icon, text }) => (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center">
        <Icon className="h-8 w-8 text-slate-300" aria-hidden="true" />
        <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
);

const ViewButton = ({ onClick, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-blue-700 ${focusRing} ${className}`}
    >
        <Eye className="h-4 w-4" aria-hidden="true" />
        View booking
    </button>
);

/* -------------------------------------------------------------------------- */
/* Calendar                                                                    */
/* -------------------------------------------------------------------------- */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const pad = (n) => String(n).padStart(2, '0');
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// Turns "2026-10-24" or a full ISO string into a local "YYYY-MM-DD" key
const toKey = (value) => {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(String(value))) return String(value).slice(0, 10);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : keyOf(d.getFullYear(), d.getMonth(), d.getDate());
};

const DOT = {
    accepted: 'bg-emerald-500',
    completed: 'bg-blue-500',
    pending: 'bg-amber-500',
    declined: 'bg-red-400',
};

const Schedule = ({ bookings = [] }) => {
    const today = new Date();
    const todayKey = keyOf(today.getFullYear(), today.getMonth(), today.getDate());
    const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
    const [selected, setSelected] = useState(todayKey);

    const byDay = useMemo(() => {
        const map = {};
        bookings.forEach((b) => {
            const k = toKey(b.date);
            if (k) (map[k] ||= []).push(b);
        });
        return map;
    }, [bookings]);

    const { year, month } = cursor;
    const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
        new Date(year, month, 1)
    );
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
    const cells = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    const shift = (delta) => {
        const d = new Date(year, month + delta, 1);
        setCursor({ year: d.getFullYear(), month: d.getMonth() });
    };
    const goToday = () => {
        setCursor({ year: today.getFullYear(), month: today.getMonth() });
        setSelected(todayKey);
    };

    const dayBookings = byDay[selected] || [];
    const selectedLabel = selected
        ? new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(
              new Date(`${selected}T00:00:00`)
          )
        : '';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900 sm:text-base">{monthLabel}</h3>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={goToday}
                        className={`h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 ${focusRing}`}
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={() => shift(-1)}
                        aria-label="Previous month"
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 ${focusRing}`}
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => shift(1)}
                        aria-label="Next month"
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 ${focusRing}`}
                    >
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
            </div>

            <div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAYS.map((d) => (
                        <span key={d} className="pb-1 text-[11px] font-medium text-slate-500">
                            <span className="sm:hidden">{d[0]}</span>
                            <span className="hidden sm:inline">{d}</span>
                        </span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                        if (!day) return <span key={`e${i}`} />;
                        const k = keyOf(year, month, day);
                        const items = byDay[k] || [];
                        const isSelected = k === selected;
                        const isToday = k === todayKey;
                        return (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setSelected(k)}
                                aria-pressed={isSelected}
                                aria-label={`${day} ${monthLabel}${items.length ? `, ${items.length} booking${items.length > 1 ? 's' : ''}` : ''}`}
                                className={`relative flex aspect-square min-h-10 flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors ${focusRing} ${
                                    isSelected
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : isToday
                                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                          : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                {day}
                                {items.length > 0 && (
                                    <span className="absolute bottom-1.5 flex gap-0.5">
                                        {items.slice(0, 3).map((b, j) => (
                                            <span
                                                key={j}
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    isSelected ? 'bg-white' : DOT[b.status] || DOT.pending
                                                }`}
                                            />
                                        ))}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-900">{selectedLabel}</p>
                {dayBookings.length === 0 ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        Nothing booked this day.
                    </p>
                ) : (
                    <ul className="mt-3 space-y-2">
                        {dayBookings.map((b, i) => (
                            <li key={b._id || i} className="rounded-xl bg-slate-50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="min-w-0 truncate text-sm font-semibold capitalize text-slate-900">
                                        {b.service || 'Service booking'}
                                    </p>
                                    <span className="flex shrink-0 items-center gap-1.5 text-xs capitalize text-slate-500">
                                        <span className={`h-2 w-2 rounded-full ${DOT[b.status] || DOT.pending}`} />
                                        {b.status}
                                    </span>
                                </div>
                                {b.time && (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                        {b.time}
                                    </p>
                                )}
                                {b.location && (
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                        <span className="truncate">{b.location}</span>
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const ServiceProviderDashboard = () => {
    const { fetchCurrentUser } = useContext(AuthContext);
    const [user, setUser] = useState();
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setUser(await fetchCurrentUser());
            } catch (error) {
                console.error('Error fetching user', error.stack);
            }
        };
        fetchUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        if (!user) return;
        const getBookings = async () => {
            try {
                const res = await api.post('/fetch-provider-bookings', { user });
                setBookings(res.data.bookings || []);
                setCustomers(res.data.customers || []);
            } catch (error) {
                console.error('There was an error fetching bookings', error);
            }
        };
        getBookings();
    }, [user]);

    const { activeJobs, completedJobs, newRequests, recentRequests } = useMemo(() => {
        const pending = bookings
            .filter((b) => b.status === 'pending')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        return {
            activeJobs: bookings.filter((b) => b.status === 'accepted'),
            completedJobs: bookings.filter((b) => b.status === 'completed'),
            newRequests: pending,
            recentRequests: pending.slice(0, 3),
        };
    }, [bookings]);

    const customerName = (booking) => {
        const c = customers.find((customer) => customer.id === booking.customerId);
        return c ? `${c.firstName} ${c.lastName}` : 'Unknown client';
    };

    const viewBooking = (booking) => booking && navigate('/view-booking', { state: { booking } });

    return (
        <div className="flex min-h-screen bg-[#f5f7fb] font-[family-name:Inter,ui-sans-serif,system-ui,sans-serif] text-slate-900">
            <div className="hidden lg:block">
                <ProviderSidemenu className="min-h-screen w-64 bg-gray-800 text-white" />
            </div>

            <div className="min-w-0 flex-1">
                {/* Below lg the sidemenu is hidden, so the header carries navigation */}
                <div className="lg:hidden">
                    <ProviderHeader />
                </div>

                <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
                    <header className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">
                                Welcome back, {user ? user.firstName : 'Guest'}
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">See who needs your services today.</p>
                        </div>
                        <button
                            type="button"
                            aria-label={`Notifications, ${newRequests.length} new requests`}
                            onClick={() => newRequests[0] && viewBooking(newRequests[0])}
                            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 ${focusRing}`}
                        >
                            <Bell className="h-5 w-5" aria-hidden="true" />
                            {newRequests.length > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                                    {newRequests.length}
                                </span>
                            )}
                        </button>
                    </header>

                    {/* Stats */}
                    <section aria-label="Overview" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <StatCard icon={Briefcase} label="Active jobs" value={activeJobs.length} tone="bg-violet-50 text-violet-600" />
                        <StatCard icon={ClipboardList} label="New requests" value={newRequests.length} tone="bg-amber-50 text-amber-600" />
                        <StatCard icon={CheckCircle2} label="Completed" value={completedJobs.length} tone="bg-emerald-50 text-emerald-600" />
                        <StatCard icon={DollarSign} label="Earnings" value="$2,854" tone="bg-blue-50 text-blue-600" />
                    </section>

                    {/* Recent requests */}
                    <Panel title="Recent requests" className="mt-6">
                        {recentRequests.length === 0 ? (
                            <EmptyState icon={CalendarX} text="No new bookings yet. New requests will appear here." />
                        ) : (
                            <>
                                {/* Table from md up */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full min-w-[640px] text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 text-xs font-medium text-slate-500">
                                                <th className="pb-3 pr-4 font-medium">Client</th>
                                                <th className="pb-3 pr-4 font-medium">Service</th>
                                                <th className="pb-3 pr-4 font-medium">Location</th>
                                                <th className="pb-3 pr-4 font-medium">Date</th>
                                                <th className="pb-3 pr-4 font-medium">Status</th>
                                                <th className="pb-3 text-right font-medium">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {recentRequests.map((b, i) => (
                                                <tr key={b._id || i}>
                                                    <td className="py-3 pr-4 font-medium text-slate-900">{customerName(b)}</td>
                                                    <td className="max-w-[160px] truncate py-3 pr-4 capitalize text-slate-700" title={b.service}>
                                                        {b.service}
                                                    </td>
                                                    <td className="max-w-[200px] truncate py-3 pr-4 text-slate-700" title={b.location}>
                                                        {b.location}
                                                    </td>
                                                    <td className="whitespace-nowrap py-3 pr-4 text-slate-700">{formatDate(b.date)}</td>
                                                    <td className="py-3 pr-4">
                                                        <StatusBadge status={b.status} />
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <ViewButton onClick={() => viewBooking(b)} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Cards on mobile */}
                                <ul className="space-y-3 md:hidden">
                                    {recentRequests.map((b, i) => (
                                        <li key={b._id || i} className="rounded-xl border border-slate-100 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-slate-900">{customerName(b)}</p>
                                                    <p className="truncate text-sm capitalize text-slate-600">{b.service}</p>
                                                </div>
                                                <StatusBadge status={b.status} />
                                            </div>
                                            <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
                                                <Clock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                                                {formatDate(b.date)}
                                            </p>
                                            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                                <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                                                <span className="truncate">{b.location}</span>
                                            </p>
                                            <ViewButton onClick={() => viewBooking(b)} className="mt-4 w-full" />
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </Panel>

                    {/* Active jobs + schedule */}
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <Panel title="Active jobs">
                            {activeJobs.length === 0 ? (
                                <EmptyState icon={Briefcase} text="No active jobs right now." />
                            ) : (
                                <ul className="space-y-3">
                                    {activeJobs.map((job, i) => (
                                        <li
                                            key={job._id || i}
                                            className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 sm:p-4"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold capitalize text-slate-900">{job.service}</p>
                                                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                                    <span className="truncate">{job.location}</span>
                                                </p>
                                            </div>
                                            <StatusBadge status={job.status} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>

                        <Panel title="Schedule">
                            <Schedule bookings={bookings.filter((b) => b.status !== 'declined')} />
                        </Panel>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ServiceProviderDashboard;