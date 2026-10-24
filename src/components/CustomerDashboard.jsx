import NotificationBell from './NotificationBell';
import RatingReview from './RatingReview';
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
import {useContext, useEffect, useMemo, useState} from 'react'
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
    const [selectedBooking, setSelectedBooking] = useState(null);

    
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

    // Notifications for the bell: built from the bookings already loaded above
    const notifications = useMemo(() => {
        const updates = {
            accepted: {
                type: 'success',
                text: (service) => `Your ${service} booking was accepted.`,
            },
            declined: {
                type: 'error',
                text: (service) => `Your ${service} booking was declined.`,
            },
            completed: {
                type: 'success',
                text: (service) => `Your ${service} booking is complete. You can now rate and review it.`,
            },
        };

        return bookings
            .filter((booking) => updates[booking.status])
            .map((booking) => ({
                id: `${booking._id}-${booking.status}`,
                type: updates[booking.status].type,
                message: updates[booking.status].text(booking.service),
                time: booking.updatedAt || booking.createdAt,
                booking,
            }))
            .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
            .slice(0, 10);
    }, [bookings]);

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
                        <NotificationBell
                            notifications={notifications}
                            onNotificationClick={(notification) => viewBooking(notification.booking)}
                        />
                       
                    </div>
                </section>

                
            <section className="mb-6 min-w-0">
    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">

        {services.map((service, i) => (
            <div
                key={i}
                onClick={() => goToService(service)}
                className="flex-none snap-start w-full sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)] bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-lg transition"
            >
                <div className="flex justify-center">
                    <img
                        src={service.Icon}
                        alt={service.Title}
                        className="h-6 w-6"
                    />
                </div>

                <h2 className="text-center font-semibold mt-3 break-words">
                    {service.Title}
                </h2>

                <p className="text-sm text-gray-600 text-center mt-2 break-words">
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
                
<section className="bg-white rounded-lg shadow mt-6">
  <h1 className="text-black font-bold text-md px-4 py-2">
    Completed Bookings
  </h1>

  <div className="p-4">
    {bookings.filter((booking) => booking.status === 'completed').length > 0 ? (
      bookings
        .filter((booking) => booking.status === 'completed')
        .map((booking) => (
          <div
            key={booking._id}
            className="border border-gray-100 my-2 rounded p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h2 className="font-medium text-sm">{booking.service}</h2>
              <p className="text-xs text-gray-500">
                Booked for: {booking.date} at {booking.time}
              </p>
              <p className="text-sm text-green-700 font-semibold mt-1">
                Completed
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBooking(booking)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded"
            >
              Rate &amp; Review
            </button>
          </div>
        ))
    ) : (
      <p className="text-sm text-gray-500 py-4">
        You don't have any completed bookings yet.
      </p>
    )}
  </div>
</section>

{selectedBooking && (
  <section className="bg-white rounded-lg shadow mt-6 p-4">
    <div className="flex justify-between items-center mb-4">
      <h2 className="font-bold text-lg">Write Your Review</h2>
      <button
        type="button"
        onClick={() => setSelectedBooking(null)}
        className="text-gray-600 hover:text-gray-900"
      >
        Close
      </button>
    </div>

    <p className="text-sm text-gray-600 mb-4">
      Service: {selectedBooking.service}
    </p>

    <RatingReview
      providerName="your service provider"
      onSubmit={(reviewData) => {
        console.log("Review prepared:", {
          bookingId: selectedBooking._id,
          providerId: selectedBooking.service_provider,
          ...reviewData,
        });
      }}
    />
  </section>
)}

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