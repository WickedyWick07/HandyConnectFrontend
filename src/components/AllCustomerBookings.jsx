import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import CustomerHeader from "../components/CustomerHeader";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

const AllCustomerBookings = () => {
    const [bookings, setBookings] = useState([]);
    const { fetchCurrentUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Fetch current user
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

    // Fetch bookings once user is set
    useEffect(() => {
        if (!user) return;

        const getBookings = async () => {
            try {
                console.log("Sending user:", user);
                const res = await api.post("/fetch-customer-bookings", { user });
                console.log("Fetched bookings:", res.data.data);
                setBookings(res.data.data);
            } catch (error) {
                console.error("There was an error fetching bookings", error);
            }
        };

        getBookings();
    }, [user]);

    const viewBooking = (booking) => {
        navigate("/view-customer-booking", { state: { booking } });
    };

    const pendingBookings = bookings.filter((booking) => booking.status === 'accepted')
    console.log(pendingBookings)

    return (
        <div>
            <CustomerHeader />
            <div className="p-4">
                {pendingBookings.length === 0 ? (
                    <p className="text-center text-gray-200 text-5xl text-bold py-10">No bookings found.</p>
                ) : (
                    pendingBookings.map((booking, i) => (
                        <div key={i} className="border border-gray-100 p-4 my-2 rounded shadow-md">
                            <div className="flex flex-col">
                                <h1 className="font-medium text-lg text-purple-700">{booking.service}</h1>
                                <p className="text-sm text-gray-600">Status: <span className="font-semibold">{booking.status}</span></p>
                                <p className="text-sm text-gray-600">Date: <span className="font-semibold">{booking.date}</span></p>
                                <p className="text-sm text-gray-600">Time: <span className="font-semibold">{booking.time}</span></p>
                                <p className="text-sm text-gray-600">Location: <span className="font-semibold">{booking.location}</span></p>
                                <p className="text-sm text-gray-600">Problem: <span className="font-semibold">{booking.problem_description}</span></p>
                                <p className="text-sm text-gray-600">Service Provider ID: <span className="font-semibold">{booking.service_provider}</span></p>
                            </div>
                            <div className="mt-4">
                                <button 
                                    onClick={() => viewBooking(booking)}
                                    className="text-white bg-purple-700 px-4 py-2 rounded hover:bg-purple-800"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AllCustomerBookings;
