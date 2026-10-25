import CustomerHeader from './CustomerHeader';
import { StarIcon } from '@heroicons/react/24/solid';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect } from 'react';
import api from '../utils/api';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import FileThumb from './FileThumb';

// services is stored as a JSON string inside an array: ['["plumbing","tiling"]']
const parseServices = (services) => {
    try {
        const first = Array.isArray(services) ? services[0] : services;
        const parsed = typeof first === 'string' ? JSON.parse(first || '[]') : first;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return Array.isArray(services) ? services : [];
    }
};

function Stars({ value, size = 'h-4 w-4' }) {
    return (
        <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((s) => (
                <StarIcon key={s} className={`${size} ${s <= Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );
}

const ViewAndBook = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { fetchCurrentUser } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [service, setService] = useState('');
    const [time, setTime] = useState('');
    const [user, setUser] = useState(null);
    const [userLocation, setUserLocation] = useState('');
    const [date, setDate] = useState('');
    const [problemDescription, setProblemDescription] = useState('');
    const [reviews, setReviews] = useState([]);
    const [ratingInfo, setRatingInfo] = useState({ average: 0, count: 0 });

    const provider = location.state?.provider || {};
    const services = parseServices(provider.services);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetchCurrentUser();
                setUser(res);
            } catch (err) {
                console.error('Error fetching the user', err);
            }
        };
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load this provider's reviews
    useEffect(() => {
        if (!provider._id) return;
        api.get(`/reviews/provider/${provider._id}`)
            .then((res) => {
                setReviews(res.data.data || []);
                setRatingInfo({ average: res.data.average || 0, count: res.data.count || 0 });
            })
            .catch((err) => console.error('Error loading reviews', err));
    }, [provider._id]);

    const toggleBookingModal = () => setIsModalOpen((prev) => !prev);

    const notify = (type, message) => {
        const options = {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: 'light',
        };
        if (type === 'success') toast.success(message, options);
        else if (type === 'error') toast.error(message, options);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?._id || !service || !time || !date || !provider?._id || !userLocation) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            const response = await api.post('/submit-booking', {
                service,
                time,
                date,
                location: userLocation,
                user: user._id,
                service_provider: provider._id,
                problem_description: problemDescription,
            });
            if (response.status === 201) {
                notify('success', 'your booking has been submitted');
                navigate('/dashboard/customer');
            }
        } catch (error) {
            console.error('Error submitting form', error);
            notify('error', 'something went wrong while submitting');
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <CustomerHeader />
            <main>
                <div className="flex flex-col lg:flex-row" key={provider._id}>
                    {/* Provider details + reviews */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white p-4 m-4 rounded shadow-md">
                            <div className="flex gap-4 items-center">
                                <FileThumb
                                    path={provider.profilePicture}
                                    alt={provider.companyName || 'Provider profile'}
                                    className="w-12 h-12 object-cover rounded-full"
                                />
                                <div>
                                    <h1 className="text-lg font-semibold">{provider.companyName}</h1>
                                    <div className="flex items-center gap-2">
                                        <Stars value={ratingInfo.average} />
                                        <span className="text-xs text-gray-600">
                                            {ratingInfo.count > 0
                                                ? `${ratingInfo.average} (${ratingInfo.count} review${ratingInfo.count === 1 ? '' : 's'})`
                                                : 'No ratings yet'}
                                        </span>
                                    </div>
                                    <span className="text-xs">{provider.yearsInService} years in service</span>
                                </div>
                            </div>
                            <hr className="mt-4" />
                            <div>
                                <h1 className="font-medium mb-2 mt-3">About</h1>
                                <p className="text-xs text-gray-800 font-normal">{provider.description}</p>
                                <div className="flex gap-2 items-center mt-2">
                                    {provider.verified ? (
                                        <div className="flex gap-2 items-center">
                                            <div className="flex size-3 rounded-full animate-pulse bg-green-700"></div>
                                            <span className="text-black text-xs p-1 inline">Verified Provider</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500 text-xs p-1 inline">Not yet verified</span>
                                    )}
                                </div>
                            </div>
                            <h1 className="text-md font-medium mt-3">Services offered</h1>
                            <div className="mt-1 grid grid-cols-2 gap-4">
                                {services.map((s, i) => (
                                    <div className="text-xs flex gap-2" key={i}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            viewBox="0 0 16 16"
                                        >
                                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                                        </svg>
                                        <p>{s}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reviews */}
                        <div className="bg-white p-4 m-4 rounded shadow-md">
                            <div className="flex items-center justify-between mb-3">
                                <h1 className="text-md font-medium">Reviews</h1>
                                {ratingInfo.count > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {ratingInfo.average} / 5 from {ratingInfo.count}
                                    </span>
                                )}
                            </div>

                            {reviews.length === 0 ? (
                                <p className="text-gray-500 text-sm">No reviews yet.</p>
                            ) : (
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {reviews.map((r) => (
                                        <div key={r._id} className="border border-gray-100 rounded p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                                                    {(r.reviewer_name || 'C')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold">{r.reviewer_name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Stars value={r.rating} size="h-3.5 w-3.5" />
                                                        <span className="text-[10px] text-gray-400">
                                                            {new Date(r.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-800 mt-2">{r.review}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Booking form */}
                    <div>
                        <form className="bg-white p-4 m-4 rounded shadow-md w-full lg:w-80" onSubmit={handleSubmit}>
                            <h1 className="font-bold text-lg mb-4">Book a service</h1>
                            <div className="mb-4">
                                <label className="text-xs font-medium block mb-1" htmlFor="service-type">Service Type</label>
                                <select
                                    className="w-full text-xs p-2 border border-gray-300 rounded"
                                    id="service-type"
                                    value={service}
                                    onChange={(e) => setService(e.target.value)}
                                >
                                    <option value="">Select a service</option>
                                    {services.map((s, i) => (
                                        <option key={i} className="text-xs" value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-medium block mb-1" htmlFor="date">Date</label>
                                <input
                                    className="w-full p-2 border text-xs border-gray-300 rounded"
                                    type="date"
                                    id="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-medium block mb-1" htmlFor="time">Time</label>
                                <input
                                    className="w-full text-xs p-2 border border-gray-300 rounded"
                                    type="time"
                                    id="time"
                                    value={time}
                                    name="time"
                                    onChange={(e) => setTime(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-medium block mb-1" htmlFor="location">Address</label>
                                <input
                                    onChange={(e) => setUserLocation(e.target.value)}
                                    className="w-full text-xs p-2 border border-gray-300 rounded"
                                    type="text"
                                    id="location"
                                    value={userLocation}
                                    name="location"
                                    placeholder="123 Sweet Bay Avenue, Johannesburg, South Africa"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="text-xs font-medium block mb-1" htmlFor="problem">
                                    What is the problem <span className="text-xs text-black">(Optional)</span>
                                </label>
                                <textarea
                                    onChange={(e) => setProblemDescription(e.target.value)}
                                    className="w-full text-xs p-2 border border-gray-300 rounded"
                                    id="problem"
                                    value={problemDescription}
                                    name="problem"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={toggleBookingModal}
                                className="w-full bg-blue-500 text-white p-2 rounded"
                            >
                                Book Service
                            </button>
                        </form>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded shadow-md w-11/12 sm:w-2/3 lg:w-1/3 mx-4">
                            <h1 className="text-lg font-bold mb-4">Confirm Booking</h1>
                            <p className="text-sm mb-6">
                                Are you sure you want to book <b>{provider.companyName}</b> for {date} at {time}?
                            </p>
                            <div className="flex justify-end gap-4">
                                <button type="button" onClick={toggleBookingModal} className="bg-gray-300 text-black p-2 rounded">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        handleSubmit(e);
                                        toggleBookingModal();
                                    }}
                                    className="bg-blue-500 text-white p-2 rounded"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <section className="bg-white p-6 m-4 rounded shadow-md">
                    <h1 className="text-black text-center font-semibold text-lg mb-2">Certifications</h1>
                    <p className="text-sm text-gray-600 text-center font-medium mb-4">
                        {provider.companyName} has the following certifications:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {provider.certifications?.map((cert, index) => (
                            <FileThumb
                                key={index}
                                path={cert}
                                alt={`Certification ${index + 1}`}
                                className="object-cover w-full h-60 border rounded"
                            />
                        ))}
                    </div>
                    {(!provider.certifications || provider.certifications.length === 0) && (
                        <p className="text-gray-600 text-center">No certifications available.</p>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ViewAndBook;