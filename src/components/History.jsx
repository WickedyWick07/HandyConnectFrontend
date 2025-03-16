import { useContext, useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import CustomerHeader from '../components/CustomerHeader';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

const History = () => {
    const [bookings, setBookings] = useState([]);
    const { fetchCurrentUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [endIndex, setEndIndex] = useState(5); // Number of bookings to display per page
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetchCurrentUser();
                console.log("Current User:", response);
                setUser(response);
            } catch (err) {
                console.error("Error fetching the user", err.stack);
            }
        };
        fetchUser();
    }, [fetchCurrentUser]);

    useEffect(() => {
        const getBookings = async () => {
            if (!user) return; // Wait until user is set
            try {
                console.log("Sending user:", user);
                const res = await api.post('/fetch-customer-bookings', { user });
                console.log('Fetched bookings:', res.data.data);
                setBookings(res.data.data);
            } catch (error) {
                console.error('There was an error fetching bookings', error);
            }
        };

        getBookings();
    }, [user]);


    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage((prevPage) => prevPage - 1);
            setEndIndex((prevIndex) => prevIndex - 5);
        }
    };

    const handleNext = () => {
        if (endIndex < bookings.length) {
            setCurrentPage((prevPage) => prevPage + 1);
            setEndIndex((prevIndex) => prevIndex + 5);
        }
    };

    const paginatedBookings = bookings.slice((currentPage - 1) * 5, endIndex); // Pagination logic

    return (
        <div className="bg-gray-100 min-h-screen">
            <CustomerHeader />
            <main>
                <div>
                    <h1 className="text-2xl font-semibold text-left px-4 py-2">Booking History</h1>
                    <p className="text-xs text-gray-500 px-4 py-1 text-left">
                        View all your past bookings and reservations
                    </p>
                </div>
                <div>
                    <div className="flex flex-col gap-4">
                        {paginatedBookings.sort((a,b) => a.booking.date - b.booking.date).map((booking) => (
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
                            className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300"
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            className="px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300"
                            disabled={endIndex >= bookings.length}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default History;
