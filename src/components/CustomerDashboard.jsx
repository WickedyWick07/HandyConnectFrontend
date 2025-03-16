import { BellAlertIcon } from '@heroicons/react/24/solid';
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

import { ArrowLongRightIcon, ArrowLongLeftIcon } from '@heroicons/react/24/solid';
import SideMenu from './SideMenu';
import api from '../utils/api';

const CustomerDashboard = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [bookings, setBookings] = useState([])
    const {fetchCurrentUser} = useContext(AuthContext)
    const [user, setUser] = useState(null)
    const services_per_page = 4;
    const navigate = useNavigate()
    const startIndex = currentPage * services_per_page;
    const endIndex = startIndex + services_per_page;
    const currentServices = services.slice(startIndex, endIndex);
    const [serviceProviders, setServiceProviders] = useState([])

    
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
    

    const handleNext = () => {
        if (endIndex < services.length) {
            setCurrentPage((prevState) => prevState + 1);
        }
    };


    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage((prevPage) => prevPage - 1);
        }
    };

    const goToService = (service) => {
        console.log('service passed as state:', service)
        navigate('/service-providers',{ state:{service}})  
    }

    

    

    return (
        <div className='flex bg-slate-100 min-h-screen'>
            <SideMenu className="w-64 bg-gray-800 text-white min-h-screen hidden lg:block" />
            <main className='flex-1 p-4'>
                <section className='flex justify-between p-4 items-center'>
                    <div className='flex flex-col mr-20'>
                        <h1 className='font-bold'>
                            Welcome back, {user ? user.firstName : 'Guest'}!
                        </h1>
                        <p className='text-xs font-light'>
                            Find the perfect service provider for your needs
                        </p>
                    </div>
                    <div className='flex justify-end gap-4'>
                        <BellAlertIcon className='size-8' />
                       
                    </div>
                </section>
                <section>
                    <button
                        className="px-4 py-2 bg-gray-300 rounded-l"
                        onClick={handlePrevious}
                        disabled={currentPage === 0}
                    >
                        <ArrowLongLeftIcon />
                    </button>
                    <div className='flex'>
                        {currentServices.map((service, i) => (
                            <div className='flex flex-col justify-center border rounded bg-white border-none m-4 p-4 cursor-pointer' onClick={() => goToService(service)} key={i}>
                                <div className='p-2 m-2 rounded-full w-8 mx-auto'>
                                    <img className='h-5 w-6' src={service.Icon} />
                                </div>
                                <p className='font-medium text-sm text-center'>{service.Title}</p>
                                <p className='text-xs font-light'>{service.Description}</p>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleNext}
                        className="px-4 py-2 bg-gray-300 rounded-l"
                        disabled={endIndex >= services.length}
                    >
                        <ArrowLongRightIcon />
                    </button>
                </section>
                <section className='bg-white m-4 rounded'>
                    <h1 className='text-black font-bold text-md px-4 py-2'>
                       Pending Bookings
                    </h1>
                    <div className='p-4'>
                        {bookings.length > 0  ? bookings.filter((booking) => booking.status === 'pending').sort((a,b) => a.date -  b.date).slice(0,3).map((booking, i) => (
                            <div key={i} className='border border-gray-100 my-2 rounded'>
                                <div className='flex items-center justify-between'>
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
                        )): <p className='text-5xl text-gray-200 text-center py-10 font-bold'>No Bookings Made</p> }
                    </div>
                </section>
                <section className='bg-white m-4 rounded'>
                    <h1 className='text-black font-bold text-md px-4 py-2'>
                        Accepted Bookings
                    </h1>
                    <div className='p-4'>
                        {bookings.length > 0  ? bookings.filter((booking) => booking.status === 'accepted').sort((a,b) => a.date -  b.date).slice(0,3).map((booking, i) => (
                            <div key={i} className='border border-gray-100 my-2 rounded'>
                                <div className='flex items-center justify-between'>
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
                        )): <p className='text-5xl text-gray-200 text-center py-10 font-bold'>No Bookings Made</p> }
                    </div>
                </section>
                <section className='bg-white m-4 rounded flex flex-col'>
                    <h1 className='text-black font-bold text-md px-4 py-2'>
                        Recommended Providers
                    </h1>
                    <div className='flex justify-between'>
                        {serviceProviders.slice(0,3).map((providers, i) => (
                            <div key={i} className='flex items-center flex-col justify-between w-auto m-4 p-3 space-y-3'>
                                <div className='flex items-center'>
                                <img
                                                                src={providers.profilePicture?.startsWith('http')
                                                                    ? providers.profilePicture
                                                                    : `${import.meta.env.VITE_IMAGES_API_URL}${providers.profilePicture}` || `https://localhost:5000${providers.profilePicture}`}
                                                                alt={providers.companyName || 'Provider profile'}
                                                                className="w-7 h-7 object-cover rounded-full"
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