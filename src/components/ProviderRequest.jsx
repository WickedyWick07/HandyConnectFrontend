import React, {useState, useEffect, useContext} from 'react'
import api from '../utils/api'
import AuthContext from '../context/AuthContext';
import ProviderHeader from '../components/ProviderHeader'
import {useNavigate} from 'react-router-dom'
const ProviderRequest = () => {
    const [bookings, setBookings] = useState([])
    const [user, setUser] = useState(null)
    const {fetchCurrentUser} = useContext(AuthContext)
    const [customer, setCustomer] = useState()
    const navigate = useNavigate()

    
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetchCurrentUser()
                console.log(res)
                setUser(res)
            } catch (error) {
                console.error('Error fetching user', error.stack)
            }
        }
        fetchUser()
    }, [])

    useEffect(() => {
        const getBookings = async () => {
            if (!user) return; // Wait until user is set
            try {
                console.log("Sending user:", user);
                const res = await api.post('/fetch-provider-bookings', { user });
                console.log('Fetched bookings:', res.data);
                setBookings(res.data.bookings);
                setCustomer(res.data.customers)
            } catch (error) {
                console.error('There was an error fetching bookings', error);
            }
        };
    
        getBookings();
    }, [user]); 

    console.log('customer from booking:', customer)

    const viewBooking = (booking) =>{
        navigate('/view-booking', {state:{booking}})
    }

    
  return (
    <div>
        <ProviderHeader /> 
        {bookings.length > 0 && bookings.some(booking => booking.status === 'pending' || booking.status === 'accepted') ? (
    <table className='w-full rounded'>
        <thead className='bg-gray-100'>
            <tr>
                <th className='p-2 border-r text-xs text-left text-gray-500'>Client</th>
                <th className='p-2 border-r text-xs text-left text-gray-500'>Service</th>
                <th className='p-2 border-r text-xs text-left text-gray-500'>Location</th>
                <th className='p-2 border-r text-xs text-left text-gray-500'>Date</th>
                <th className='p-2 border-r text-xs text-left text-gray-500'>Status</th>
                <th className='p-2 text-xs text-left text-gray-500'>Action</th>
            </tr>
        </thead>
        <tbody>
            {bookings.map((booking, index) => {
                const customerData = customer?.find(cust => cust._id === booking.user) || {};

                return (
                    <tr key={index}>
                        <td className='p-2 text-xs font-semibold text-center py-5 px-4'>
                            {customerData.firstName} {customerData.lastName}
                        </td>
                        <td className='p-2 font-semibold text-xs'>{booking.service}</td>
                        <td className='p-2 font-semibold text-xs'>{booking.location}</td>
                        <td className='p-2 font-semibold text-xs'>{booking.date}</td>
                        <td className='p-2 text-xs font-medium'>
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
                        </td>
                        <td className='p-2 text-xs'>
                            <button onClick={() => viewBooking(booking)} className='mx-auto text-center flex justify-center px-2'>
                                <p className='text-xs p-2 m-2 font-medium text-center px-1 py-1 bg-purple-800 rounded text-white'>
                                    View Booking
                                </p>
                            </button>
                        </td>
                    </tr>
                );
            })}
        </tbody>
    </table>
) : (
    <p className='font-bold text-5xl text-gray-200 text-center py-10'> No New Requests</p>
)}
    </div>
  );
};


export default ProviderRequest
