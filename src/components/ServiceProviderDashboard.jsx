import ProviderSidemenu from './ProviderSidemenu'
import { BellAlertIcon } from '@heroicons/react/24/solid';
import profilePicture from '../assets/Merchants/Merchant-1.jpg';
import { useContext, useState, useEffect } from 'react';
import {useNavigate} from 'react-router-dom'
import AuthContext from '../context/AuthContext';
import api from '../utils/api';
import Schedule from './Schedule';

const ServiceProviderDashboard = () => {
    const {fetchCurrentUser} = useContext(AuthContext)
    const [user, setUser] = useState()
    const [activeJobs, setActiveJobs] = useState([])
    const [bookings, setBookings] = useState([])
    const navigate = useNavigate()
    const [customers, setCustomers] = useState([])
    
    
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
                setCustomers(res.data.customers)
            } catch (error) {
                console.error('There was an error fetching bookings', error);
            }
        };
    
        getBookings();
    }, [user]); // Runs when `user` changes

    useEffect(() => {
        const activeRequests = bookings.filter(booking => booking.status === 'accepted');
        setActiveJobs(activeRequests);
    }, [bookings]); 

    console.log('active requests:',activeJobs)


    const viewBooking = (booking) => {
        if(booking){
            navigate('/view-booking', {state: {booking}})
        } 

    }
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date));
    const completedJobs = [...bookings].filter(booking => booking.status === 'completed')
    const newRequests = [...bookings].filter(booking => booking.status === 'pending')




    return(
        <div className='flex bg-slate-100 min-h-screen'>
            <ProviderSidemenu className="w-64 bg-gray-800 text-white min-h-screen hidden lg:block" />
            <main className='flex-1 p-4' >
                <section className='flex justify-between p-4 items-center'>
                    <div className='flex flex-col mr-20'>
                        <h1 className='font-bold'>
                            Welcome back {user ? user.firstName : "Guest"}!
                        </h1>
                        <p className='text-xs font-light'>
                            Let's see who needs your services today!
                        </p>
                    </div>
                    <div className='flex justify-end gap-4'>
                        <BellAlertIcon className='size-8' />
                        <div>
                            <img src={profilePicture} alt="" className='size-8 object-cover rounded-full' />
                        </div>
                    </div>
                </section>

                <section className='grid grid-cols-4 gap-4 p-4 '>
                    <div className='border rounded p-4 bg-white'>
                        <div className='flex items-center justify-between'>
                        <h1 className='text-xl font-medium'>
                           Active Jobs
                        </h1>
                            <svg className='text-purple-700' xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-briefcase-fill" viewBox="0 0 16 16">
                                <path d="M6.5 1A1.5 1.5 0 0 0 5 2.5V3H1.5A1.5 1.5 0 0 0 0 4.5v1.384l7.614 2.03a1.5 1.5 0 0 0 .772 0L16 5.884V4.5A1.5 1.5 0 0 0 14.5 3H11v-.5A1.5 1.5 0 0 0 9.5 1zm0 1h3a.5.5 0 0 1 .5.5V3H6v-.5a.5.5 0 0 1 .5-.5"/>
                                <path d="M0 12.5A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5V6.85L8.129 8.947a.5.5 0 0 1-.258 0L0 6.85z"/>
                            </svg>
                        </div>
                        <p className='text-2xl font-extrabold'>{activeJobs.length}</p>
                    </div>  
                    <div className='border rounded p-4 bg-white'>
                        <div className='flex items-center justify-between'>
                        <h1 className='text-xl font-medium'>
                            New Requests</h1>
                        <svg className='text-purple-700' xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard-fill" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M10 1.5a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5zm-5 0A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5v1A1.5 1.5 0 0 1 9.5 4h-3A1.5 1.5 0 0 1 5 2.5zm-2 0h1v1A2.5 2.5 0 0 0 6.5 5h3A2.5 2.5 0 0 0 12 2.5v-1h1a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3.5a2 2 0 0 1 2-2"/>
                        </svg>
                        </div>
                        <p className='text-2xl font-extrabold'>{newRequests.length}</p>
                    </div>  
                    <div className='border rounded p-4 bg-white'>
                    <div className='flex items-center justify-between'>
                    <h1 className='text-xl font-medium'>
                    Completed</h1>
                        <svg className='text-purple-700' xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
                            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                        </svg>
                        </div>
                        <p className='text-2xl font-extrabold'>{completedJobs.length} </p>
                    </div>  
                    <div className='border rounded p-4 bg-white'>
                    <div className='flex items-center justify-between'>
                    <h1 className='text-xl font-medium'>
                    Earnings</h1>
                        <svg className='text-purple-700' xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-currency-dollar" viewBox="0 0 16 16">
                            <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73z"/>
                        </svg>
                        </div>  
                        <p className='text-2xl font-extrabold'>$2,854</p>                  
                    </div>    
                </section>   
                <section className='bg-white p-4 m-4 rounded '>
                    <h1 className='font-bold mb-4'> Recent Requests</h1>
                    <table className=' w-full rounded'>
                        <thead className='bg-gray-100'>
                            <tr className=''>
                                <th className='p-2 border-r text-xs text-left text-gray-500'>Client</th>
                                <th className='p-2 border-r text-xs text-left text-gray-500'>Service</th>
                                <th className='p-2 border-r text-xs text-left text-gray-500'>Location</th>
                                <th className='p-2 border-r text-xs text-left text-gray-500'>Date</th>
                                <th className='p-2 border-r text-xs text-left text-gray-500'>Status</th>
                                <th className='p-2 text-xs text-left text-gray-500'>Action</th>
                            </tr>
                        </thead>
                        <tbody className=''>
                            {sortedBookings.length > 0 && sortedBookings.some(booking => booking.status === 'pending') ? sortedBookings.slice(0, 3).map((booking, index) => (
                                <tr key={index} >
                                    <td className='p-2 text-semibold text-xs text-center flex my-4 items-center gap-3'>
                                        {customers.find(customer => customer.id === booking.customerId)?.firstName} {customers.find(customer => customer.id === booking.customerId)?.lastName}
                                    </td>
                                    <td className='p-2 text-semibold text-xs'>{booking.service}</td>
                                    <td className='p-2 text-semibold text-xs'>{booking.location}</td>
                                    <td className='p-2 text-semibold text-xs'>{booking.date}</td>
                                    <td className='p-2 text-semibold text-xs'>
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
                            )) : (
                                <tr>
                                    <td colSpan="6" className='text-center text-5xl font-bold text-gray-200'>No New Bookings</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>    
                <section className='grid grid-cols-2 gap-4 p-4'>
                    <div className='bg-white rounded p-4'>
                        <h1 className='font-medium'>Active Jobs</h1>
                        <hr />
                        {activeJobs.map((job, index) => (
                            <div key={index} className='flex items-center justify-between p-4'>
                                <div className='flex items-center gap-4'>
                                    <div>
                                        <img src={job.Image} alt="" className='size-7 object-cover rounded-full' />
                                    </div>
                                    <div>
                                        <h1 className='font-medium'>{job.service}</h1>
                                        <p className='text-xs'>{job.location}</p>
                                    </div>
                                </div>
                                <div className='bg-fuchsia-400 rounded-full p-2'>
                                    <p className='text-xs font-medium text-fuchsia-900'>{job.status}</p>
                                </div>
                            </div>
                        ))}


                    </div>
                    <div className="bg-white rounded p-4 h-[500px] overflow-hidden">
                        <h1 className="font-medium mb-2">Schedule</h1>
                        <div className="h-full">
                            <Schedule />
                        </div>
                    </div>

                    
                    
                </section> 
            </main>
        </div>
    )

}
export default ServiceProviderDashboard