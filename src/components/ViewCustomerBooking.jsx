import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    BadgeCheck,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    Mail,
    MapPin,
    MessageCircle,
    Navigation,
    Phone,
    Truck,
    Wrench,
    XCircle,
} from 'lucide-react';
import api from '../utils/api';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const STEPS = [
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'accepted', label: 'Accepted', icon: Truck },
    { key: 'completed', label: 'Completed', icon: CheckCircle2 },
];

// Index of the last timeline step that has been reached for each booking status
const PROGRESS = { pending: 0, accepted: 1, completed: 2, declined: -1 };

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

const focusRing =
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                       */
/* -------------------------------------------------------------------------- */

const Card = ({ children }) => (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">{children}</section>
);

const CardTitle = ({ icon: Icon, children }) => (
    <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
        <Icon size={20} className="text-blue-600" aria-hidden="true" />
        {children}
    </h2>
);

const IconCircle = ({ icon: Icon }) => (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <Icon size={18} aria-hidden="true" />
    </span>
);

const Label = ({ children }) => (
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{children}</p>
);

const PageHeader = ({ onBack }) => (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto grid h-14 w-full max-w-3xl grid-cols-[1fr_auto_1fr] items-center px-4 md:px-6">
            <button
                type="button"
                onClick={onBack}
                aria-label="Go back"
                className={`-ml-2 flex w-fit items-center gap-1.5 rounded-lg p-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100 ${focusRing}`}
            >
                <ArrowLeft size={20} aria-hidden="true" />
                <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-base font-semibold text-slate-900 md:text-lg">Booking Details</h1>
            <span aria-hidden="true" />
        </div>
    </header>
);

const StatusTimeline = ({ status }) => {
    const progress = PROGRESS[status] ?? 0;
    return (
        <>
            <ol className="flex items-start">
                {STEPS.map((step, i) => {
                    const reached = i <= progress;
                    const isLast = i === STEPS.length - 1;
                    const Icon = step.icon;
                    return (
                        <li key={step.key} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
                            <div className="flex w-16 shrink-0 flex-col items-center gap-2 text-center sm:w-20">
                                <span
                                    className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                                        reached ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}
                                >
                                    <Icon size={20} aria-hidden="true" />
                                </span>
                                <span
                                    className={`text-xs font-medium ${reached ? 'text-slate-900' : 'text-slate-500'}`}
                                    aria-current={i === progress ? 'step' : undefined}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {!isLast && (
                                <span
                                    aria-hidden="true"
                                    className={`mt-5 h-0.5 flex-1 rounded-full transition-colors ${
                                        progress >= i + 1 ? 'bg-blue-600' : 'bg-slate-200'
                                    }`}
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
            {status === 'declined' && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    <XCircle size={18} aria-hidden="true" />
                    This booking was declined.
                </p>
            )}
        </>
    );
};

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const ViewCustomerBooking = ({ booking: bookingProp }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const booking = bookingProp ?? location.state?.booking;

    const [customer, setCustomer] = useState(null);
    const [customerLoading, setCustomerLoading] = useState(true);
    const [status, setStatus] = useState(booking?.status);
    const [completing, setCompleting] = useState(false);
    const [actionError, setActionError] = useState('');

    // Same request as before: fetch the customer who made this booking
    useEffect(() => {
        if (!booking) return;
        let cancelled = false;

        const fetchCustomer = async () => {
            try {
                const res = await api.post('/fetch-customer', { booking });
                if (!cancelled) setCustomer(res.data.data);
            } catch (error) {
                console.error('Error fetching customer information:', error.response || error);
            } finally {
                if (!cancelled) setCustomerLoading(false);
            }
        };

        fetchCustomer();
        return () => {
            cancelled = true;
        };
    }, [booking]);

    const goBack = () => navigate(-1);

    if (!booking) {
        return (
            <div className="min-h-screen bg-[#f5f7fb] font-[family-name:Inter,ui-sans-serif,system-ui,sans-serif]">
                <PageHeader onBack={goBack} />
                <main className="mx-auto w-full max-w-3xl p-4 md:p-6">
                    <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white px-6 py-14 text-center shadow-sm">
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <AlertCircle size={28} aria-hidden="true" />
                        </span>
                        <h2 className="mt-4 text-lg font-semibold text-slate-900">Booking not found</h2>
                        <p className="mt-1 max-w-sm text-sm text-slate-500">
                            Open a booking from your bookings list to see its details.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/all-bookings')}
                            className={`mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700 ${focusRing}`}
                        >
                            Go to my bookings
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const customerName = customer ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() : '';
    const initial = (customer?.firstName || customerName || '?').charAt(0).toUpperCase();
    const phone = customer?.phoneNumber || customer?.phone || '';
    const bookingLocation = booking.location || '';
    const mapsUrl = bookingLocation
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(bookingLocation)}`
        : '';

    const canComplete = status === 'accepted';

    const handleComplete = async () => {
        if (!window.confirm('Mark this job as completed?')) return;
        setCompleting(true);
        setActionError('');
        try {
            await api.patch('/fetch-provider-bookings', { status: 'completed', bookingId: booking._id });
            setStatus('completed');
        } catch (error) {
            console.error('Error completing the booking:', error.response || error);
            setActionError('We could not mark this job as completed. Please try again.');
        } finally {
            setCompleting(false);
        }
    };

    const actionClass = `flex items-center justify-center gap-1.5 rounded-xl border border-blue-600 bg-white px-2 py-3 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-50 ${focusRing}`;
    const disabledAction = 'cursor-not-allowed opacity-50 hover:bg-white';

    return (
        <div className="min-h-screen bg-[#f5f7fb] font-[family-name:Inter,ui-sans-serif,system-ui,sans-serif] text-slate-900">
            <PageHeader onBack={goBack} />

            <main className="mx-auto w-full max-w-3xl space-y-5 p-4 md:p-6">
                {/* A. Booking status */}
                <Card>
                    <CardTitle icon={Clock}>Booking Status</CardTitle>
                    <StatusTimeline status={status} />
                </Card>

                {/* B. Customer */}
                <Card>
                    <div className="flex items-start gap-4">
                        <span
                            aria-hidden="true"
                            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white"
                        >
                            {initial}
                        </span>
                        <div className="min-w-0 flex-1">
                            {customerLoading ? (
                                <div className="animate-pulse space-y-2" aria-busy="true">
                                    <div className="h-5 w-40 rounded bg-slate-100" />
                                    <div className="h-5 w-24 rounded-full bg-slate-100" />
                                </div>
                            ) : (
                                <>
                                    <h2 className="truncate text-lg font-bold text-slate-900" title={customerName}>
                                        {customerName || 'Customer details unavailable'}
                                    </h2>
                                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        <BadgeCheck size={14} aria-hidden="true" />
                                        Customer
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <ul className="mt-5 space-y-3">
                        <li className="flex items-center gap-3">
                            <IconCircle icon={Mail} />
                            <span className="sr-only">Email:</span>
                            <span className="min-w-0 truncate text-sm text-slate-600" title={customer?.email}>
                                {customerLoading ? 'Loading...' : customer?.email || 'Not provided'}
                            </span>
                        </li>
                        <li className="flex items-center gap-3">
                            <IconCircle icon={Phone} />
                            <span className="sr-only">Phone:</span>
                            <span className="min-w-0 truncate text-sm text-slate-600">
                                {customerLoading ? 'Loading...' : phone || 'Not provided'}
                            </span>
                        </li>
                    </ul>
                </Card>

                {/* C. Service details */}
                <Card>
                    <CardTitle icon={Wrench}>Service Details</CardTitle>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <Label>Date</Label>
                            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                                <Calendar size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
                                <span className="min-w-0 truncate">{formatDate(booking.date)}</span>
                            </p>
                        </div>
                        <div className="min-w-0">
                            <Label>Time</Label>
                            <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-900">
                                <Clock size={18} className="shrink-0 text-slate-400" aria-hidden="true" />
                                <span className="min-w-0 truncate">{booking.time || 'Not set'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-5">
                        <Label>Service</Label>
                        <p className="mt-1 flex items-start gap-2 text-sm font-medium capitalize text-slate-900">
                            <Wrench size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                            <span className="min-w-0 break-words">{booking.service || 'Not set'}</span>
                        </p>
                        <p className="mt-2 break-words pl-[26px] text-sm text-slate-600">
                            {booking.problem_description || 'No description provided'}
                        </p>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-5">
                        <Label>Location</Label>
                        <p className="mt-1 flex items-start gap-2 text-sm text-slate-600">
                            <MapPin size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
                            <span className="line-clamp-2 min-w-0 break-words" title={bookingLocation}>
                                {bookingLocation || 'No location provided'}
                            </span>
                        </p>
                    </div>
                </Card>

                {/* D. Location */}
                <Card>
                    <CardTitle icon={MapPin}>Location</CardTitle>
                    <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                        <span className="mx-4 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow">
                            <MapPin size={18} className="shrink-0 text-blue-600" aria-hidden="true" />
                            <span className="truncate">{bookingLocation || 'No location provided'}</span>
                        </span>
                    </div>
                </Card>

                {/* E. Quick actions */}
                <div className="grid grid-cols-3 gap-3">
                    {phone ? (
                        <a href={`tel:${phone}`} className={actionClass}>
                            <Phone size={18} aria-hidden="true" />
                            Call
                        </a>
                    ) : (
                        <button type="button" disabled title="No phone number available" className={`${actionClass} ${disabledAction}`}>
                            <Phone size={18} aria-hidden="true" />
                            Call
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => navigate('/messages', { state: { customer, bookingId: booking._id } })}
                        className={actionClass}
                    >
                        <MessageCircle size={18} aria-hidden="true" />
                        Message
                    </button>

                    {mapsUrl ? (
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>
                            <Navigation size={18} aria-hidden="true" />
                            Navigate
                        </a>
                    ) : (
                        <button type="button" disabled title="No location available" className={`${actionClass} ${disabledAction}`}>
                            <Navigation size={18} aria-hidden="true" />
                            Navigate
                        </button>
                    )}
                </div>

                {/* F. Primary action */}
                <div>
                    <button
                        type="button"
                        onClick={handleComplete}
                        disabled={!canComplete || completing}
                        aria-busy={completing}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-base font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-blue-600 ${focusRing}`}
                    >
                        {completing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                                Completing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={20} aria-hidden="true" />
                                {status === 'completed' ? 'Job Completed' : 'Complete Job'}
                            </>
                        )}
                    </button>
                    {actionError && (
                        <p role="alert" className="mt-3 flex items-center justify-center gap-2 text-sm text-red-600">
                            <AlertCircle size={16} aria-hidden="true" />
                            {actionError}
                        </p>
                    )}
                    {!canComplete && status !== 'completed' && (
                        <p className="mt-3 text-center text-xs text-slate-500">Only accepted bookings can be completed.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ViewCustomerBooking;