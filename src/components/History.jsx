import { useContext, useEffect, useState, useCallback } from 'react';
import AuthContext from '../context/AuthContext';
import CustomerHeader from '../components/CustomerHeader';
import ProviderHeader from '../components/ProviderHeader';
import api from '../utils/api';
import LoadingPage from './LoadingPage';

const PAGE_SIZE = 5;

const History = () => {
    const [bookings, setBookings] = useState([]);
    const { fetchCurrentUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetchCurrentUser();
                setUser(response);
            } catch (err) {
                console.error("Error fetching the user", err.stack);
                setError("Error fetching user details.");
                setLoading(false);
            }
        };
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getBookings = useCallback(async () => {
        if (!user) return;
        try {
            if (user.role === 'customer') {
                const res = await api.post('/fetch-customer-bookings', { user });
                setBookings(res.data.data || []);
            } else {
                const res = await api.post('/fetch-provider-bookings', { user });
                setBookings(res.data.bookings || []);
            }
        } catch (err) {
            if ([400, 404].includes(err.response?.status)) {
                setBookings([]);
            } else {
                console.error('There was an error fetching bookings', err);
                setError('Error fetching bookings.');
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        getBookings();
    }, [getBookings]);

    // Refetch whenever a live notification arrives
    useEffect(() => {
        window.addEventListener('notification:new', getBookings);
        return () => window.removeEventListener('notification:new', getBookings);
    }, [getBookings]);

    const sortedBookings = bookings
        .filter((booking) => booking.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalPages = Math.max(1, Math.ceil(sortedBookings.length / PAGE_SIZE));
    const paginatedBookings = sortedBookings.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const handlePrevious = () => setCurrentPage((p) => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

    return (
        <div className="bg-gray-100 min-h-screen">
            {user?.role === 'customer' ? <CustomerHeader /> : <ProviderHeader />}
            <main>
                <div>
                    <h1 className="text-2xl font-semibold text-left px-4 py-2">Booking History</h1>
                    <p className="text-xs text-gray-500 px-4 py-1 text-left">
                        View all your past bookings and reservations
                    </p>
                </div>

                {loading ? (
                    <LoadingPage />
                ) : bookings.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-lg font-semibold text-gray-600">No bookings yet</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex flex-col gap-4">
                            {paginatedBookings.map((booking) => (
                                <div className="bg-white p-4 mx-4 rounded shadow-md" key={booking._id}>
                                    <div className="flex gap-4 items-center">
                                        <div>
                                            <h1 className="text-lg font-semibold">Service: {booking.service}</h1>
                                            <p className="text-xs text-gray-600 font-medium">
                                                Location: {booking.location}
                                            </p>
                                            <p className="text-xs text-gray-600 font-medium">
                                                Date: {booking.date} at {booking.time}
                                            </p>
                                            <p className="text-xs text-gray-600 font-medium">
                                                Problem Description: {booking.problem_description || "N/A"}
                                            </p>
                                        </div>
                                        <div className="ml-auto">
                                            {booking.status === 'accepted' ? (
                                                <div className="text-xs text-center rounded-full bg-green-200 text-green-700 inline-block px-4 py-1">
                                                    {booking.status}
                                                </div>
                                            ) : booking.status === 'declined' ? (
                                                <div className="text-xs text-center rounded-full bg-red-200 text-red-700 inline-block px-4 py-1">
                                                    {booking.status}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-center rounded-full bg-yellow-200 text-yellow-700 inline-block px-4 py-1">
                                                    {booking.status}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mx-2 mt-4">
                            <button
                                onClick={handlePrevious}
                                className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300 disabled:opacity-50"
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span className="text-xs text-gray-500 self-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={handleNext}
                                className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300 disabled:opacity-50"
                                disabled={currentPage >= totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
                {error && (
                    <div>
                        <p className="text-red-500 text-xl text-center">{error}</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default History;