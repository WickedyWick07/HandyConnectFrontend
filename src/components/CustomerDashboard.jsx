import NotificationBell from './NotificationBell';
import RatingReview from './RatingReview';
import Avatar from './Avatar';
import { Bars3Icon } from '@heroicons/react/24/outline';
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
import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import SideMenu from './SideMenu';
import api from '../utils/api';

const STATUS_STYLES = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    declined: 'bg-red-100 text-red-800',
    incomplete: 'bg-orange-100 text-orange-800',
};

const parseServices = (services) => {
    try {
        const first = Array.isArray(services) ? services[0] : services;
        const parsed = typeof first === 'string' ? JSON.parse(first || '[]') : first;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return Array.isArray(services) ? services : [];
    }
};

function StatusBadge({ status }) {
    return (
        <span className={`text-xs font-semibold capitalize px-3 py-1 rounded-full ${STATUS_STYLES[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
        </span>
    );
}

function Section({ title, count, children }) {
    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">{title}</h2>
                {count > 0 && (
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5">{count}</span>
                )}
            </div>
            {children}
        </section>
    );
}

function Empty({ text }) {
    return <p className="text-sm text-gray-400 text-center py-8">{text}</p>;
}

function BookingRow({ booking, children }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-gray-100 rounded-lg p-4 hover:border-purple-200 transition">
            <div className="min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 capitalize truncate">{booking.service}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{booking.date} at {booking.time}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={booking.status} />
                {children}
            </div>
        </div>
    );
}

const CustomerDashboard = () => {
    const [bookings, setBookings] = useState([])
    const { fetchCurrentUser } = useContext(AuthContext)
    const [user, setUser] = useState(null)
    const navigate = useNavigate()
    const [serviceProviders, setServiceProviders] = useState([])
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [reviewed, setReviewed] = useState({}); // { bookingId: rating }
    const reviewRef = useRef(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetchCurrentUser();
                setUser(response);
            } catch (err) {
                console.error("Error fetching the user", err.stack);
            }
        };

        const fetchAllProviders = async () => {
            try {
                const response = await api.get('/fetch-service-providers');
                setServiceProviders(response.data.data);
            } catch (error) {
                console.error("Error fetching all providers:", error);
            }
        };

        const fetchMyReviews = async () => {
            try {
                const res = await api.get('/reviews/mine');
                const map = {};
                (res.data.data || []).forEach((r) => { map[r.booking] = r.rating; });
                setReviewed(map);
            } catch (error) {
                console.error("Error fetching my reviews:", error);
            }
        };

        fetchUser();
        fetchAllProviders();
        fetchMyReviews();
    }, []);

    const getBookings = useCallback(async () => {
        if (!user) return;
        try {
            const res = await api.post('/fetch-customer-bookings', { user });
            setBookings(res.data.data);
        } catch (error) {
            console.error('There was an error fetching bookings', error);
        }
    }, [user]);

    useEffect(() => { getBookings(); }, [getBookings]);

    useEffect(() => {
        window.addEventListener('notification:new', getBookings);
        return () => window.removeEventListener('notification:new', getBookings);
    }, [getBookings]);

    useEffect(() => {
        if (selectedBooking && reviewRef.current) {
            reviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [selectedBooking]);

    const submitReview = async ({ rating, review }) => {
        await api.post('/reviews', {
            bookingId: selectedBooking._id,
            rating,
            review,
        });
        setReviewed((prev) => ({ ...prev, [selectedBooking._id]: rating }));
        toast.success('Thanks! Your review has been submitted.');
        setSelectedBooking(null);
    };

    const viewBooking = (booking) => {
        navigate('/view-customer-booking', { state: { booking } })
    }

    const goToService = (service) => {
        navigate('/service-providers', { state: { service } })
    }

    const services = [
        ...Carpentry,
        ...Plumbing,
        ...HomeInstallation,
        ...Painting,
        ...Flooring,
        ...HomeCare,
        ...HomeAutomation,
        ...ExteriorMaintenance,
    ];

    const byDate = (a, b) => new Date(a.date) - new Date(b.date);
    const pending = bookings.filter((b) => b.status === 'pending').sort(byDate).slice(0, 3);
    const accepted = bookings.filter((b) => b.status === 'accepted').sort(byDate).slice(0, 3);
    const completed = bookings.filter((b) => b.status === 'completed');

    const detailsButton = (booking) => (
        <button
            onClick={() => viewBooking(booking)}
            className="text-xs font-medium text-purple-700 border border-purple-700 rounded-md px-3 py-1.5 hover:bg-purple-700 hover:text-white transition"
        >
            View Details
        </button>
    );

    return (
        <div className='flex bg-slate-100 min-h-screen'>
            <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <main className="flex-1 min-w-0 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
                {/* Top bar */}
                <header className="flex items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
                    <div className='flex items-center gap-3 min-w-0'>
                        <button className="lg:hidden" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
                            <Bars3Icon className="size-7 text-gray-700" />
                        </button>
                        <div className='min-w-0'>
                            <h1 className='font-bold text-lg truncate'>
                                Welcome back, {user ? user.firstName : 'Guest'}!
                            </h1>
                            <p className='text-xs text-gray-500'>Find the perfect service provider for your needs</p>
                        </div>
                    </div>
                    <NotificationBell />
                </header>

                {/* Services scroller */}
                <section>
                    <h2 className="font-bold text-gray-900 mb-3">Browse services</h2>
                    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
                        {services.map((service, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => goToService(service)}
                                className="w-64 shrink-0 snap-start text-left bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-purple-200 transition"
                            >
                                <div className="h-11 w-11 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                                    <img src={service.Icon} alt="" className="h-5 w-5" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{service.Title}</h3>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{service.Description}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Pending + Accepted side by side on large screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Section title="Pending Bookings" count={pending.length}>
                        {pending.length > 0 ? (
                            <div className="space-y-3">
                                {pending.map((b) => (
                                    <BookingRow key={b._id} booking={b}>{detailsButton(b)}</BookingRow>
                                ))}
                            </div>
                        ) : <Empty text="No pending bookings" />}
                    </Section>

                    <Section title="Accepted Bookings" count={accepted.length}>
                        {accepted.length > 0 ? (
                            <div className="space-y-3">
                                {accepted.map((b) => (
                                    <BookingRow key={b._id} booking={b}>{detailsButton(b)}</BookingRow>
                                ))}
                            </div>
                        ) : <Empty text="No accepted bookings" />}
                    </Section>
                </div>

                {/* Completed */}
                <Section title="Completed Bookings" count={completed.length}>
                    {completed.length > 0 ? (
                        <div className="space-y-3">
                            {completed.map((b) => (
                                <BookingRow key={b._id} booking={b}>
                                    {reviewed[b._id] ? (
                                        <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-md">
                                            Reviewed ★ {reviewed[b._id]}
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedBooking(b)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-md"
                                        >
                                            Rate &amp; Review
                                        </button>
                                    )}
                                </BookingRow>
                            ))}
                        </div>
                    ) : <Empty text="You don't have any completed bookings yet" />}
                </Section>

                {selectedBooking && (
                    <section ref={reviewRef} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-bold text-lg">Write Your Review</h2>
                            <button type="button" onClick={() => setSelectedBooking(null)} className="text-sm text-gray-500 hover:text-gray-900">
                                Close
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 capitalize">Service: {selectedBooking.service}</p>
                        <RatingReview providerName="your service provider" onSubmit={submitReview} />
                    </section>
                )}

                {/* Recommended providers */}
                <section>
                    <h2 className="font-bold text-gray-900 mb-3">Recommended Providers</h2>
                    {serviceProviders.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-8">
                            <Empty text="No providers to show yet" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {serviceProviders.slice(0, 3).map((p) => {
                                const svc = parseServices(p.services);
                                return (
                                    <article key={p._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col h-full hover:shadow-md transition">
                                        <div className="flex items-center gap-3">
                                            <Avatar path={p.profilePicture} name={p.companyName} size="h-14 w-14" text="text-lg" />
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">{p.companyName}</h3>
                                                {p.verified ? (
                                                    <span className="text-[11px] font-medium text-green-700">✓ Verified</span>
                                                ) : (
                                                    <span className="text-[11px] text-gray-400">Not yet verified</span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-600 mt-3 line-clamp-3 flex-1">{p.description}</p>

                                        {svc.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {svc.slice(0, 3).map((s) => (
                                                    <span key={s} className="text-[11px] capitalize bg-purple-50 text-purple-700 rounded-full px-2.5 py-0.5">{s}</span>
                                                ))}
                                                {svc.length > 3 && (
                                                    <span className="text-[11px] text-gray-400 py-0.5">+{svc.length - 3} more</span>
                                                )}
                                            </div>
                                        )}

                                        <p className="text-[11px] text-gray-500 mt-3 pt-3 border-t border-gray-100">
                                            {p.yearsInService} {p.yearsInService === 1 ? 'year' : 'years'} in service
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default CustomerDashboard