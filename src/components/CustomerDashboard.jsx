import { BellAlertIcon } from '@heroicons/react/24/solid';
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
import {useContext, useEffect, useState} from 'react'
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';





import SideMenu from './SideMenu';
import api from '../utils/api';

const CustomerDashboard = () => {

    const [bookings, setBookings] = useState([])
    const {fetchCurrentUser} = useContext(AuthContext)
    const [user, setUser] = useState(null)

    const navigate = useNavigate()

    const [serviceProviders, setServiceProviders] = useState([])
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    
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
    
        const fetchAllProviders = async () => {
            try {
                console.log('Fetching all providers');
                const response = await api.get('/fetch-service-providers');
                console.log(response.data.data);
                setServiceProviders(response.data.data);
            } catch (error) {
                console.error("Error fetching all providers:", error);
            }
        };
    
        fetchUser();
        fetchAllProviders();
    }, []);
    
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
    }, [user]); // Runs when `user` changes

    const viewBooking = (booking) => {
        navigate('/view-customer-booking', {state:{booking}})
    }
    

   

    const goToService = (service) => {
        console.log('service passed as state:', service)
        navigate('/service-providers',{ state:{service}})  
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
    

    

return (
    <div className='flex bg-slate-100 min-h-screen'>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
       <main className="flex-1 min-w-0 p-4 max-w-7xl mx-auto w-full">
                <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4">
                    <div className='flex items-center gap-3'>
                        <button
                            className="lg:hidden"
                            onClick={() => setIsMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Bars3Icon className="size-7 text-gray-700" />
                        </button>
                        <div className='flex flex-col'>
                            <h1 className='font-bold'>
                                Welcome back, {user ? user.firstName : 'Guest'}!
                            </h1>
                            <p className='text-xs font-light'>
                                Find the perfect service provider for your needs
                            </p>
                        </div>
                    </div>
                    <div className='flex justify-end gap-4'>
                        <BellAlertIcon className='size-8' />
                       
                    </div>
                </section>

                
            <section className="mb-6 min-w-0">
    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">

        {services.map((service, i) => (
            <div
                key={i}
                onClick={() => goToService(service)}
                className="min-w-[260px] sm:min-w-[280px] bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-lg transition snap-start flex-shrink-0"
            >
                <div className="flex justify-center">
                    <img
                        src={service.Icon}
                        alt={service.Title}
                        className="h-6 w-6"
                    />
                </div>

                <h2 className="text-center font-semibold mt-3">
                    {service.Title}
                </h2>

                <p className="text-sm text-gray-600 text-center mt-2">
                    {service.Description}
                </p>
            </div>
        ))}

    </div>
</section>

               <section className="bg-white rounded-lg shadow mt-6">
                    <h1 className='text-black font-bold text-md px-4 py-2'>
                       Pending Bookings
                    </h1>
                    <div className='p-4'>
                        {bookings.length > 0  ? bookings.filter((booking) => booking.status === 'pending').sort((a,b) => a.date -  b.date).slice(0,3).map((booking, i) => (
                            <div key={i} className='border border-gray-100 my-2 rounded'>
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4">
                                    <div className='flex items-center'>
                                        {/*<div className='p-2 m-2 bg-purple-300 rounded-full w-8'>
                                            <img className='h-5 w-6' src={booking.Icon} />
                                        </div>*/}
                                        <div className='flex flex-col'>
                                            <h1 className='font-medium text-sm'>{booking.service}</h1>
                                            <p className='text-xs font-light'>Booked for: {booking.date} at {booking.time}</p>
                                        </div>
                                    </div>

                                    <div className='bg-yellow-400 px-3 py-2 rounded-full text-xs font-semibold '>
                                        <p>{booking.status}</p>
                                    </div>
                                    <div className='m-4  hover:bg-purple-700 border border-purple-700 rounded'>
                                        <button onClick={() => viewBooking(booking)}  className='text-xs hover:text-white font-medium text-purple-700 px-4 py-1'>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )): <p className="text-xl sm:text-3xl lg:text-5xl text-gray-200 text-center py-10 font-bold">No Bookings Made</p> }
                    </div>
                </section>
              <section className="bg-white rounded-lg shadow mt-6">
                    <h1 className='text-black font-bold text-md px-4 py-2'>
                        Accepted Bookings
                    </h1>
                    <div className='p-4'>
                        {bookings.length > 0  ? bookings.filter((booking) => booking.status === 'accepted').sort((a,b) => a.date -  b.date).slice(0,3).map((booking, i) => (
                            <div key={i} className='border border-gray-100 my-2 rounded'>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4">
                                    <div className='flex items-center'>
                                        {/*<div className='p-2 m-2 bg-purple-300 rounded-full w-8'>
                                            <img className='h-5 w-6' src={booking.Icon} />
                                        </div>*/}
                                        <div className='flex flex-col'>
                                            <h1 className='font-medium text-sm'>{booking.service}</h1>
                                            <p className='text-xs font-light'>Booked for: {booking.date} at {booking.time}</p>
                                        </div>
                                    </div>

                                    <div className='bg-yellow-400 px-3 py-2 rounded-full text-xs font-semibold '>
                                        <p>{booking.status}</p>
                                    </div>
                                    <div className='m-4  hover:bg-purple-700 border border-purple-700 rounded'>
                                        <button onClick={() => viewBooking(booking)}  className='text-xs hover:text-white font-medium text-purple-700 px-4 py-1'>
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )): <p className="text-xl sm:text-3xl lg:text-5xl text-gray-200 text-center py-10 font-bold"> No Bookings Made </p> }
                    </div>
                </section>
                <section className='bg-white m-4 rounded flex flex-col'>
                    <h1 className='text-black font-bold text-md px-4 py-2'>
                        Recommended Providers
                    </h1>
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {serviceProviders.slice(0,3).map((providers, i) => (
                            <div key={i} className="bg-white rounded-lg p-4 shadow flex flex-col items-center text-center">
                                <div className='flex items-center'>
                                <img
                                                                src={providers.profilePicture?.startsWith('http')
                                                                    ? providers.profilePicture
                                                                    : `${import.meta.env.VITE_IMAGES_API_URL}${providers.profilePicture}` || `https://localhost:5000${providers.profilePicture}`}
                                                                alt={providers.companyName || 'Provider profile'}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = `https://localhost:5000${providers.profilePicture}`;
                                                                }}
                                                            />                              <div className='flex flex-col m-1'>
                                        <h1 className='text-sm font-medium'>
                                            {providers.companyName}
                                        </h1>
                                        {/*<div className='flex items-center'>
                                            {[...Array(Math.floor(providers.Rating))].map((_, i) => (
                                                <StarIcon key={i} className='text-yellow-500 size-3' />
                                            ))}
                                            {providers.Rating % 1 !== 0 && (<OutlineStarIcon className='size-3 text-yellow-500' />)}
                                            <p className='text-xs ml-1'>{providers.Rating}</p>
                                        </div>*/}
                                    </div>
                                </div>
                                <p className='text-xs'>{providers.description}</p>
                                
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};





export default CustomerDashboard