import React from 'react';
import CustomerHeader from './CustomerHeader';
import { StarIcon } from '@heroicons/react/24/solid';
import mapIcon from '../assets/Icons/pin-map-fill.svg';
import { useLocation, useNavigate } from 'react-router-dom';
import {useState, useContext, useEffect} from 'react'
import api from '../utils/api';
import AuthContext from '../context/AuthContext'
import {toast} from 'react-toastify'

const ViewAndBook = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {fetchCurrentUser} = useContext(AuthContext)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [service, setService] = useState('')  // Initialize with empty string
    const [time, setTime] = useState('')
    const [user, setUser] = useState(null)
    const [userLocation, setUserLocation] = useState('')
    const [date, setDate] = useState('')
    const [problemDescription, setProblemDescription] = useState('')
    const provider = location.state?.provider || [];
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetchCurrentUser()
                console.log('user:',res)
                setUser(res)
                console.log(provider)
            } catch(err) {
                console.error('Error fetching the user', err)
            }
        }

        fetchUser()
    }, [])


    if(provider){
        console.log("provider:", provider)
    }
    if(user){
        console.log('user:', user)
    }

    const toggleBookingModal = () =>{
        setIsModalOpen((prevState) => (!prevState))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if(provider ){
            console.log("provider:", provider)
        }
        console.log("Form submission values:", {
            service,
            time,
            date,
            userLocation,
            userId: user?._id,
            providerId: provider?._id,
            problemDescription
        });

        console.log("Current user state:", user);  // Add this line
        console.log("User ID:", user?._id); 
        console.log("Provider ID:", provider?._id); 

    
        const formData = new FormData()
        formData.append('service', service)
        formData.append('time', time)
        formData.append('date', date)
        formData.append('location', userLocation)
        formData.append('user', user._id)
        formData.append('service_provider', provider._id)
        if(problemDescription){
            formData.append('problem_description', problemDescription)
        }
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }        if (!service || !time || !date || !provider._id  || !userLocation) {
            alert('Please fill in all required fields.');
            return;
        }
        try {
            const response = await api.post('/submit-booking', formData)
            console.log('response:', response)
            if(response.status === 201){
               notify('success', 'your booking has been submitted')
                navigate('/dashboard/customer')
            }
        } catch (error) {
            console.error('Error submitting form', error)
            notify('error', 'something went wrong while submitting')
        }
    }

    const notify = (type, message) => {
        const options = {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        };
      
        if (type === "success") {
          toast.success(message, options);
        } else if (type === "error") {
          toast.error(message, options);
        }
      };
      
    return (
        <div className="bg-gray-100 min-h-screen">
            <div>
                <CustomerHeader />
            </div>
            <main>
                <div>
                   
                        <div className="flex" key={provider._id}>
                            {/* Provider Details */}
                            <div className="bg-white p-4 m-4 rounded shadow-md">
                                <div className="flex gap-4 items-center">
                                <img
                                                                src={provider.profilePicture?.startsWith('http')
                                                                    ? provider.profilePicture
                                                                    : `${import.meta.env.VITE_IMAGES_API_URL}${provider.profilePicture}` || `https://localhost:5000${providers.profilePicture}`}
                                                                alt={provider.companyName || 'Provider profile'}
                                                                className="w-7 h-7 object-cover rounded-full"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = `https://localhost:5000${provider.profilePicture}`;
                                                                }}
                                                            />  
                                    <div>
                                        <h1 className="text-lg font-semibold">{provider.companyName}</h1>
                                        <p className="text-xs text-gray-600">{provider.description}</p>
                                        <div className="flex gap-1 items-center">
                                            <span className="text-xs">{provider.yearsInService} years in service</span>
                                        </div>
                                    </div>
                                </div>
                                <hr className="mt-4" />
                                <div>
                                    <h1 className="font-medium mb-2">About</h1>
                                    <p className="text-xs text-gray-800 font-normal">{provider.description}</p>
                                    <div className="grid grid-cols-2">
                                        <p className="text-xs text-gray-800 font-normal">
                                            <img src={mapIcon} className="size-4 inline" alt="Location" />
                                            Location not specified
                                        </p>
                                        <div className="flex gap-2 items-center">
                                            {true && ( // Replace true with verification condition
                                                <div className="flex size-3 rounded-full animate-pulse bg-green-700"></div>
                                            )}
                                            <span className="text-black text-xs p-1 inline">
                                                Verified Provider
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <h1 className="text-md font-medium">Services offered</h1>
                                <div className="mt-1 grid grid-cols-2 gap-4">
                                    {JSON.parse(provider.services[0] || '[]').map((service, i) => (
                                        <div className="text-xs flex gap-2" key={i}>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                fill="currentColor"
                                                className="bi bi-check-circle-fill"
                                                viewBox="0 0 16 16"
                                            >
                                                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
                                            </svg>
                                            <p>{service}</p>
                                        </div>
                                    ))}
                                    {provider.review && provider.review.length > 0 ? (
                            <div className="bg-white rounded-sm m-4 p-4">
                                <h1 className="text-md font-medium">Reviews</h1>
                                {provider.review.map((review, i) => (
                                <div key={i} className="bg-white p-4 m-4 rounded shadow-md">
                                    <div className="flex gap-4 items-center">
                                    <img
                                        src={review.reviewer_image}
                                        className="h-10 w-10 rounded-full object-cover"
                                        alt="Reviewer"
                                    />
                                    <div>
                                        <h1 className="text-lg font-semibold">{review.reviewer_name}</h1>
                                        <div className="flex gap-1 items-center">
                                        {[...Array(Math.floor(Math.round(review.review_rating)))].map(
                                            (_, i) => (
                                            <StarIcon key={i} className="flex h-4 w-4 text-yellow-500" />
                                            )
                                        )}
                                        </div>
                                    </div>
                                    </div>
                                    <p className="text-xs text-gray-800 font-normal">
                                    {review.review_description}
                                    </p>
                                </div>
                                ))}
                            </div>
                            ) : (
                                <div className="bg-white rounded-sm m-4 p-4">
                            <p className="m-4 text-gray-600">No Reviews yet..</p>
                            </div>
                            )}
                                </div>
                            </div>
                            {/* Booking Form */}
                            <div>
                                <form className="bg-white p-4 m-4 rounded shadow-md" onSubmit={handleSubmit}>
                                    <h1 className="font-bold text-lg mb-4">Book a service</h1>
                                    <div className="mb-4">
                                        <label
                                            className="text-xs font-medium block mb-1"
                                            htmlFor="service-type"
                                        >
                                            Service Type
                                        </label>
                                        <select
                                            className="w-full text-xs p-2 border border-gray-300 rounded"
                                            id="service-type"
                                            value={service}  // Add this
                                            onChange={(e) => setService(e.target.value)}
                                        >
                                            <option value="">Select a service</option>  
                                            {JSON.parse(provider.services[0] || '[]').map((service, i) => (
                                                <option key={i} className="text-xs" value={service}>  
                                                    {service}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-xs font-medium block mb-1" htmlFor="date">
                                            Date
                                        </label>
                                        <input
                                            className="w-full p-2 border text-xs border-gray-300 rounded"
                                            type="date"
                                            id="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-xs font-medium block mb-1" htmlFor="time">
                                            Time
                                        </label>
                                        <input
                                            className="w-full text-xs p-2 border border-gray-300 rounded"
                                            type="time"
                                            id="time"
                                            value={time}
                                            name='time'
                                            onChange={(e) => setTime(e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-xs font-medium block mb-1" htmlFor="time">
                                            Address
                                        </label>
                                        <input
                                            onChange={(e) => setUserLocation(e.target.value)}
                                            className="w-full text-xs p-2 border border-gray-300 rounded"
                                            type="text"
                                            id="location"
                                            value={userLocation}
                                            name='location'
                                            placeholder='123 Sweet Bay Avenue,Johanneburg, South Africa'
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="text-xs font-medium block mb-1" htmlFor="time">
                                            What is the problem <span className='text-xs text-black'>(Optional)</span>
                                        </label>
                                        <textarea
                                            onChange={(e) => setProblemDescription(e.target.value)}
                                            className="w-full text-xs p-2 border border-gray-300 rounded"
                                            type="text"
                                            id="probelem"
                                            value={problemDescription}
                                            name='problem'
                                        />
                                    </div>
                                    <div>
                                        <button type='button' onClick={toggleBookingModal} className="w-full bg-blue-500 text-white p-2 rounded">
                                            Book Service
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        
                </div>

                {isModalOpen && (
                        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
                            <div className="bg-white p-6 rounded shadow-md w-1/3">
                                <h1 className="text-lg font-bold mb-4">Confirm Booking</h1>
                                <p className="text-sm mb-6">
                                    Are you sure you want to book <b>{provider.companyName}</b> for {date} at {time}?
                                </p>
                                <div className="flex justify-end gap-4">
                                    <button
                                        onClick={toggleBookingModal}
                                        className="bg-gray-300 text-black p-2 rounded"
                                    >
                                        Cancel
                                    </button>
                                    <button type='submit'
                                        onClick={(e) => {
                                            handleSubmit(e)
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

                    <section>
                        {/*
                        Embed map
                        */ }
                    </section>
            </main>
        </div>
    );
};

export default ViewAndBook;
