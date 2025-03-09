import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import ProviderHeader from './ProviderHeader';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';


const ProviderHistory = () => {
    const { fetchCurrentUser } = useContext(AuthContext);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await fetchCurrentUser();
                setUser(user);
            } catch (error) {
                console.error('There was an error fetching the user', error);
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        setLoading(true)
        const fetchProviderBookings = async () => {
            try {
                const res = await api.post('/fetch-provider-bookings', { user });
                console.log('provider bookings:', res.data.bookings);
                setBookings(res.data.bookings);
            } catch (error) {
                console.error('Error fetching provider bookings:', error);
            }
        };

        if (user) {
            fetchProviderBookings();
        }

        setLoading(false)
    }, [user]);
    if (loading) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-red-50 p-4 rounded-lg text-red-500">
                {error}
            </div>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'declined':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <ProviderHeader />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Booking History</h2>
                    <div className="flex gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
                            Pending
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
                            Completed
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm">
                            Cancelled
                        </span>
                    </div>
                </div>

                <div className="grid gap-6">
                    {bookings.map((booking, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-blue-500" />
                                            <span className="text-gray-700">{formatDate(booking.date)}</span>
                                            <Clock className="w-5 h-5 text-blue-500 ml-4" />
                                            <span className="text-gray-700">{booking.time}</span>
                                        </div>
                                        
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-5 h-5 text-blue-500 mt-1" />
                                            <span className="text-gray-700 flex-1">{booking.location}</span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <span className="text-gray-700">{booking.service}</span>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="w-5 h-5 text-blue-500 mt-1" />
                                            <p className="text-gray-700 flex-1">{booking.problem_description}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-4">
                                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {bookings.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-lg">No bookings found</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProviderHistory;