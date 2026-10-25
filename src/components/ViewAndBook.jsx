import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
    BadgeCheck,
    CalendarDays,
    Check,
    Clock3,
    MapPin,
    MessageCircle,
    Share2,
    ShieldCheck,
    Star,
    Heart,
    Wrench,
    X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import CustomerHeader from './CustomerHeader';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';

const tabs = ['About', 'Services', 'Certifications', 'Reviews'];

const parseServices = (services) => {
    if (!Array.isArray(services)) return [];

    return services.flatMap((entry) => {
        if (typeof entry !== 'string') return [];
        try {
            const parsed = JSON.parse(entry);
            if (Array.isArray(parsed)) return parsed.map(String);
        } catch {
            return [entry];
        }
        return [entry];
    }).map((service) => service.trim()).filter(Boolean);
};

const getAssetUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;

    const baseUrl = import.meta.env.VITE_IMAGES_API_URL
        || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '')
        || 'http://localhost:5000';
    return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
};

const getInitials = (name = '') => name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'HC';

const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(date));
};

const Avatar = ({ src, name, className = 'h-16 w-16' }) => {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = getAssetUrl(src);

    return (
        <div className={`${className} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-semibold text-blue-700`}>
            {imageUrl && !imageFailed ? (
                <img
                    src={imageUrl}
                    alt={`${name} profile`}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            ) : getInitials(name)}
        </div>
    );
};

const Stars = ({ rating, size = 16 }) => (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                size={size}
                className={star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
            />
        ))}
    </span>
);

const CertificationCard = ({ certification, index }) => {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = getAssetUrl(certification);

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-44 items-center justify-center bg-slate-100">
                {imageUrl && !imageFailed ? (
                    <img
                        src={imageUrl}
                        alt={`Provider certification ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                        <BadgeCheck size={36} />
                        <span className="text-sm">Certification image unavailable</span>
                    </div>
                )}
            </div>
            <p className="truncate px-4 py-3 text-sm font-medium text-slate-700">
                Certification {index + 1}
            </p>
        </article>
    );
};

Avatar.propTypes = {
    src: PropTypes.string,
    name: PropTypes.string,
    className: PropTypes.string,
};

Stars.propTypes = {
    rating: PropTypes.number.isRequired,
    size: PropTypes.number,
};

CertificationCard.propTypes = {
    certification: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
};

const ViewAndBook = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { fetchCurrentUser } = useContext(AuthContext);
    const provider = location.state?.provider;
    const providerName = provider?.companyName || 'Service provider';
    const services = useMemo(() => parseServices(provider?.services), [provider?.services]);

    const [activeTab, setActiveTab] = useState('About');
    const [user, setUser] = useState(null);
    const [service, setService] = useState('');
    const [time, setTime] = useState('');
    const [date, setDate] = useState('');
    const [userLocation, setUserLocation] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [reviewSummary, setReviewSummary] = useState({
        averageRating: 0,
        totalReviews: 0,
        breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        completedJobs: 0,
    });
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [eligibleBookings, setEligibleBookings] = useState([]);
    const [selectedBookingId, setSelectedBookingId] = useState('');
    const [isPreparingReview, setIsPreparingReview] = useState(false);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    const loadReviews = useCallback(async () => {
        if (!provider?._id) return;
        const response = await api.get(`/reviews/${provider._id}`);
        setReviews(response.data.reviews || []);
        setReviewSummary((current) => ({ ...current, ...response.data.summary }));
    }, [provider?._id]);

    useEffect(() => {
        if (!provider?._id) return undefined;

        let isMounted = true;
        api.get(`/reviews/${provider._id}`)
            .then((response) => {
                if (!isMounted) return;
                setReviews(response.data.reviews || []);
                setReviewSummary((current) => ({ ...current, ...response.data.summary }));
            })
            .catch((error) => {
                console.error('Unable to load provider reviews:', error);
                toast.error('Reviews could not be loaded right now.');
            });

        return () => {
            isMounted = false;
        };
    }, [provider?._id]);

    useEffect(() => {
        let isMounted = true;
        const accessToken = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');

        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Unable to read saved user details:', error);
            }
        }

        if (accessToken) {
            fetchCurrentUser()
                .then((currentUser) => {
                    if (isMounted) setUser(currentUser);
                })
                .catch((error) => {
                    console.error('Unable to fetch signed-in user:', error);
                });
        }

        return () => {
            isMounted = false;
        };
    }, [fetchCurrentUser]);

    useEffect(() => {
        if (!provider?._id) return;
        setIsFavorite(localStorage.getItem(`handyconnect:favorites:${provider._id}`) === 'true');
    }, [provider?._id]);

    const handleBookingRequest = (event) => {
        event.preventDefault();
        if (!user?._id) {
            toast.info('Please sign in before booking a service.');
            navigate('/sign-in');
            return;
        }
        if (!service || !date || !time || !userLocation.trim()) {
            toast.error('Please complete the service, date, time, and address fields.');
            return;
        }
        setIsConfirmOpen(true);
    };

    const submitBooking = async () => {
        if (!provider?._id || !user?._id) return;
        setIsSubmittingBooking(true);

        try {
            await api.post('/submit-booking', {
                service,
                time,
                date,
                location: userLocation.trim(),
                user: user._id,
                service_provider: provider._id,
                problem_description: problemDescription.trim(),
            });
            toast.success('Your booking request has been submitted.');
            setIsConfirmOpen(false);
            navigate('/dashboard/customer');
        } catch (error) {
            console.error('Error submitting booking:', error);
            toast.error(error.response?.data?.message || 'Your booking could not be submitted. Please try again.');
        } finally {
            setIsSubmittingBooking(false);
        }
    };

    const toggleFavorite = () => {
        const nextValue = !isFavorite;
        setIsFavorite(nextValue);
        localStorage.setItem(`handyconnect:favorites:${provider._id}`, String(nextValue));
        toast.success(nextValue ? 'Provider added to your favorites.' : 'Provider removed from your favorites.');
    };

    const shareProvider = async () => {
        const shareData = { title: providerName, url: window.location.href };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                toast.success('Provider link copied.');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Unable to share provider:', error);
                toast.error('Unable to share this provider.');
            }
        }
    };

    const openReviewModal = async () => {
        if (!user?._id || user.role !== 'customer') {
            toast.info('Sign in as a customer to write a review.');
            navigate('/sign-in');
            return;
        }

        setIsPreparingReview(true);
        try {
            const response = await api.post('/fetch-customer-bookings', { user: { _id: user._id } });
            const completedBookings = (response.data.data || []).filter((booking) => (
                booking.status === 'completed'
                && String(booking.service_provider?._id || booking.service_provider) === String(provider._id)
            ));

            if (!completedBookings.length) {
                toast.info('You can review this provider after one of your bookings is completed.');
                return;
            }

            setEligibleBookings(completedBookings);
            setSelectedBookingId(String(completedBookings[0]._id));
            setReviewRating(0);
            setReviewComment('');
            setIsReviewModalOpen(true);
        } catch (error) {
            console.error('Unable to check completed bookings:', error);
            toast.error(error.response?.data?.message || 'Your completed bookings could not be checked.');
        } finally {
            setIsPreparingReview(false);
        }
    };

    const submitReview = async (event) => {
        event.preventDefault();
        if (!reviewRating || !reviewComment.trim() || !selectedBookingId) {
            toast.error('Select a rating and write a comment before submitting.');
            return;
        }

        setIsSubmittingReview(true);
        try {
            await api.post('/reviews', {
                providerId: provider._id,
                bookingId: selectedBookingId,
                rating: reviewRating,
                comment: reviewComment.trim(),
            });
            await loadReviews();
            setIsReviewModalOpen(false);
            toast.success('Thank you. Your review has been submitted.');
        } catch (error) {
            console.error('Unable to submit review:', error);
            toast.error(error.response?.data?.message || 'Your review could not be submitted.');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    if (!provider?._id) {
        return (
            <div className="min-h-screen bg-slate-50">
                <CustomerHeader />
                <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
                    <h1 className="text-2xl font-bold text-slate-900">Provider details are unavailable</h1>
                    <p className="mt-3 text-slate-600">Choose a provider from the listings to view their profile and book a service.</p>
                    <Link to="/service-providers" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
                        Browse providers
                    </Link>
                </main>
            </div>
        );
    }

    const certificationList = provider.certifications || [];
    const providerLocation = provider.location || provider.user?.location;
    const savedAddress = user?.location || '';
    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <CustomerHeader />
            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-8 lg:px-8">
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(320px,1fr)] xl:gap-8">
                    <section className="min-w-0 space-y-6">
                        <header className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                <Avatar src={provider.profilePicture} name={providerName} className="h-20 w-20 sm:h-24 sm:w-24" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{providerName}</h1>
                                        {certificationList.length > 0 && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                <BadgeCheck size={15} /> Certifications listed
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{provider.description || 'Provider profile details are not available yet.'}</p>
                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600">
                                        <span className="inline-flex items-center gap-2">
                                            <Stars rating={reviewSummary.averageRating} size={15} />
                                            {reviewSummary.totalReviews
                                                ? `${reviewSummary.averageRating.toFixed(1)} (${reviewSummary.totalReviews} reviews)`
                                                : 'No reviews yet'}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <Wrench size={16} className="text-blue-600" />
                                            {reviewSummary.completedJobs} completed {reviewSummary.completedJobs === 1 ? 'job' : 'jobs'}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <MapPin size={16} className="text-blue-600" />
                                            {providerLocation || 'Location not listed'}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <Clock3 size={16} className="text-blue-600" />
                                            Response time varies
                                        </span>
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <button type="button" onClick={shareProvider} aria-label="Share provider" className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                        <Share2 size={17} /> <span className="hidden sm:inline">Share</span>
                                    </button>
                                    <button type="button" onClick={toggleFavorite} aria-pressed={isFavorite} aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'} className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium ${isFavorite ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                                        <Heart size={17} className={isFavorite ? 'fill-current' : ''} /> <span className="hidden sm:inline">Favorite</span>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-2 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Provider information">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTab === tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </header>

                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                            {activeTab === 'About' && (
                                <div className="space-y-7">
                                    <div>
                                        <h2 className="text-lg font-bold">About {providerName}</h2>
                                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{provider.description || 'This provider has not added a bio yet.'}</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Skills and services</h3>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {services.length ? services.map((item) => (
                                                <span key={item} className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">{item}</span>
                                            )) : <p className="text-sm text-slate-500">No skills have been listed yet.</p>}
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Experience</p>
                                            <p className="mt-1 font-semibold">{provider.yearsInService ? `${provider.yearsInService} years` : 'Not specified'}</p>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Languages</p>
                                            <p className="mt-1 font-semibold">Not listed on this profile</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Services' && (
                                <div>
                                    <h2 className="text-lg font-bold">Services offered</h2>
                                    <p className="mt-2 text-sm text-slate-600">Choose a service when you send a booking request. This profile does not publish fixed prices or durations.</p>
                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        {services.length ? services.map((item) => (
                                            <article key={item} className="rounded-2xl border border-slate-200 p-5">
                                                <div className="flex items-start gap-3">
                                                    <span className="rounded-xl bg-blue-50 p-2 text-blue-700"><Wrench size={19} /></span>
                                                    <div className="min-w-0">
                                                        <h3 className="font-semibold">{item}</h3>
                                                        <p className="mt-2 text-sm text-slate-500">Price: quote on request</p>
                                                        <p className="mt-1 text-sm text-slate-500">Duration: agreed with provider</p>
                                                    </div>
                                                </div>
                                            </article>
                                        )) : <p className="text-sm text-slate-500">No services are listed yet.</p>}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'Certifications' && (
                                <div>
                                    <h2 className="text-lg font-bold">Certifications</h2>
                                    <p className="mt-2 text-sm text-slate-600">Documents shared on this provider profile.</p>
                                    {certificationList.length ? (
                                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                            {certificationList.map((certification, index) => (
                                                <CertificationCard key={`${certification}-${index}`} certification={certification} index={index} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-5 rounded-xl bg-slate-50 p-6 text-sm text-slate-600">No certifications have been added to this profile.</div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'Reviews' && (
                                <div>
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                        <div>
                                            <h2 className="text-lg font-bold">Customer reviews</h2>
                                            <p className="mt-1 text-sm text-slate-600">Ratings are submitted by customers with a completed booking.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={openReviewModal}
                                            disabled={isPreparingReview}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <MessageCircle size={17} /> {isPreparingReview ? 'Checking booking...' : 'Write a Review'}
                                        </button>
                                    </div>
                                    <div className="mt-6 grid gap-6 rounded-2xl bg-slate-50 p-5 sm:grid-cols-[auto_1fr] sm:items-center">
                                        <div className="text-center sm:min-w-32">
                                            <p className="text-4xl font-bold">{reviewSummary.averageRating ? reviewSummary.averageRating.toFixed(1) : '—'}</p>
                                            <div className="mt-2 flex justify-center"><Stars rating={reviewSummary.averageRating} /></div>
                                            <p className="mt-2 text-sm text-slate-500">{reviewSummary.totalReviews} reviews</p>
                                        </div>
                                        <div className="space-y-2">
                                            {[5, 4, 3, 2, 1].map((rating) => {
                                                const count = reviewSummary.breakdown?.[rating] || 0;
                                                const percentage = reviewSummary.totalReviews ? (count / reviewSummary.totalReviews) * 100 : 0;
                                                return (
                                                    <div key={rating} className="flex items-center gap-3 text-xs text-slate-600">
                                                        <span className="w-3">{rating}</span><Star size={13} className="fill-amber-400 text-amber-400" />
                                                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                                                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
                                                        </div>
                                                        <span className="w-7 text-right">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-6 space-y-4">
                                        {reviews.length ? reviews.map((review) => {
                                            const customerName = [review.customerId?.firstName, review.customerId?.lastName].filter(Boolean).join(' ') || 'Customer';
                                            return (
                                                <article key={review._id} className="rounded-2xl border border-slate-200 p-5">
                                                    <div className="flex items-start gap-3">
                                                        <Avatar name={customerName} className="h-11 w-11 text-sm" />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                <h3 className="font-semibold">{customerName}</h3>
                                                                <time className="text-xs text-slate-500">{formatDate(review.createdAt)}</time>
                                                            </div>
                                                            <div className="mt-1"><Stars rating={review.rating} size={14} /></div>
                                                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{review.comment}</p>
                                                        </div>
                                                    </div>
                                                </article>
                                            );
                                        }) : (
                                            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                                No reviews yet. A completed customer booking can be the first.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <aside className="min-w-0 lg:sticky lg:top-24">
                        <form onSubmit={handleBookingRequest} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md md:p-8">
                            <div>
                                <h2 className="text-xl font-bold">Book a service</h2>
                                <p className="mt-1 text-sm text-slate-500">Send a request to {providerName}</p>
                            </div>
                            <div className="mt-6 space-y-4">
                                <div>
                                    <label htmlFor="service-type" className="mb-1.5 block text-sm font-medium text-slate-700">Service type</label>
                                    <div className="relative">
                                        <Wrench size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <select id="service-type" value={service} onChange={(event) => setService(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                            <option value="">Select a service</option>
                                            {services.map((item) => <option key={item} value={item}>{item}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                    <div>
                                        <label htmlFor="booking-date" className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
                                        <div className="relative">
                                            <CalendarDays size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input id="booking-date" type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="booking-time" className="mb-1.5 block text-sm font-medium text-slate-700">Time</label>
                                        <div className="relative">
                                            <Clock3 size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input id="booking-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="booking-address" className="mb-1.5 block text-sm font-medium text-slate-700">Service address</label>
                                    <div className="relative">
                                        <MapPin size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input id="booking-address" type="text" list="saved-addresses" autoComplete="street-address" value={userLocation} onChange={(event) => setUserLocation(event.target.value)} placeholder="Enter the service address" className="h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                        <datalist id="saved-addresses">
                                            {[savedAddress, providerLocation].filter(Boolean).map((address) => <option key={address} value={address} />)}
                                        </datalist>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">Suggestions use saved profile locations when available.</p>
                                </div>
                                <div>
                                    <label htmlFor="problem-description" className="mb-1.5 block text-sm font-medium text-slate-700">Describe the problem <span className="font-normal text-slate-400">(optional)</span></label>
                                    <textarea id="problem-description" value={problemDescription} onChange={(event) => setProblemDescription(event.target.value)} rows={4} placeholder="Share any details that may help the provider prepare." className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                                </div>
                            </div>
                            <div className="mt-5 rounded-xl bg-blue-50 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm font-semibold text-slate-800">Price estimate</span>
                                    <span className="text-sm font-bold text-blue-700">Quote on request</span>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-600">The provider will confirm pricing after reviewing your request.</p>
                            </div>
                            <button type="submit" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200">
                                <Check size={18} /> Book Now
                            </button>
                            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-slate-500">
                                <ShieldCheck size={15} className="text-emerald-600" /> You won&apos;t be charged yet
                            </p>
                        </form>
                    </aside>
                </div>
            </main>

            {isConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
                    <section role="dialog" aria-modal="true" aria-labelledby="booking-confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl md:p-8">
                        <h2 id="booking-confirm-title" className="text-xl font-bold">Confirm your booking request</h2>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Request {service} from <span className="font-semibold text-slate-900">{providerName}</span> for {date} at {time}. No payment is taken now.
                        </p>
                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setIsConfirmOpen(false)} disabled={isSubmittingBooking} className="h-11 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Go back</button>
                            <button type="button" onClick={submitBooking} disabled={isSubmittingBooking} className="h-11 rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                                {isSubmittingBooking ? 'Submitting...' : 'Confirm request'}
                            </button>
                        </div>
                    </section>
                </div>
            )}

            {isReviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
                    <form onSubmit={submitReview} role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl md:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 id="review-dialog-title" className="text-xl font-bold">Write a review</h2>
                                <p className="mt-1 text-sm text-slate-500">Share your experience with {providerName}.</p>
                            </div>
                            <button type="button" aria-label="Close review form" onClick={() => setIsReviewModalOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
                        </div>
                        {eligibleBookings.length > 1 && (
                            <div className="mt-5">
                                <label htmlFor="review-booking" className="mb-1.5 block text-sm font-medium">Completed booking</label>
                                <select id="review-booking" value={selectedBookingId} onChange={(event) => setSelectedBookingId(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                                    {eligibleBookings.map((booking) => (
                                        <option key={booking._id} value={booking._id}>{booking.service} · {booking.date}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <fieldset className="mt-5">
                            <legend className="mb-2 text-sm font-medium">Your rating</legend>
                            <div className="flex gap-1" role="radiogroup" aria-label="Rating from one to five stars">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button key={rating} type="button" role="radio" aria-checked={reviewRating === rating} aria-label={`${rating} star${rating === 1 ? '' : 's'}`} onClick={() => setReviewRating(rating)} className="rounded-lg p-2 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-300">
                                        <Star size={28} className={rating <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
                                    </button>
                                ))}
                            </div>
                        </fieldset>
                        <div className="mt-4">
                            <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium">Your comments</label>
                            <textarea id="review-comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={1000} rows={5} placeholder="What went well? What should other customers know?" className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                            <p className="mt-1 text-right text-xs text-slate-500">{reviewComment.length}/1000</p>
                        </div>
                        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button type="button" onClick={() => setIsReviewModalOpen(false)} disabled={isSubmittingReview} className="h-11 rounded-xl border border-slate-200 px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
                            <button type="submit" disabled={isSubmittingReview} className="h-11 rounded-xl bg-blue-600 px-4 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">
                                {isSubmittingReview ? 'Submitting...' : 'Submit review'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ViewAndBook;
