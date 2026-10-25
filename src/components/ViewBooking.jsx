import { useEffect, useState } from 'react';
import ProviderHeader from './ProviderHeader';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const ViewBooking = () => {
  const location = useLocation();
  const booking = location.state?.booking;
  const [customer, setCustomer] = useState(null);
  const [map, setMap] = useState(null);
  const navigate = useNavigate();

  const fetchCustomer = async () => {
    try {
      if (!booking) {
        console.error('Booking data is missing');
        return;
      }

      const res = await api.post('/fetch-customer', { booking });
      console.log(res)
      setCustomer(res.data.data);
    } catch (error) {
      console.error('Error fetching customer information:', error.response || error);
    }
  };

  const getCoordinates = async (userLocation) => {
    const searchLocation = userLocation.toLowerCase()
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchLocation)}&format=json`
    );
    console.log(response)

    const data = await response.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];
      return { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else {
      throw new Error('Location not found');
    }
  };

  const initializeMap = async () => {
    if (!booking || !booking.location) {
      console.error('Booking location is missing');
      return;
    }

    try {
      const { lat, lon } = await getCoordinates(booking.location);

      if (!map) {
        const newMap = L.map('map').setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(newMap);

        L.marker([lat, lon]).addTo(newMap).bindPopup(booking.location).openPopup();
        setMap(newMap);
      } else {
        map.setView([lat, lon], 13);
        L.marker([lat, lon]).addTo(map).bindPopup(booking.location).openPopup();
      }
    } catch (error) {
      console.error('Error initializing map:', error.message);
    }
  };

  useEffect(() => {
    if (booking) {
      fetchCustomer();
      initializeMap();
    }
  }, [booking]);

  const updateStatus = async (status) => {
    try {
      await api.patch('/fetch-provider-bookings', { status, bookingId: booking._id });
      booking.status = status;
      navigate('/dashboard/service-provider');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (!booking) {
    return <div className="bg-gray-100 min-h-screen flex items-center justify-center text-gray-700">Loading booking details...</div>;
  }

  const goToChat = () => {
    navigate('/service-provider/chat', {state:{customer:customer, bookingId:booking._id}})
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="mb-7">
      <ProviderHeader />
      </div>
      <main className="max-w-6xl mx-auto py-8 px-6 bg-white shadow-md rounded-lg space-y-7">
        <h1 className="text-3xl text-center font-bold text-gray-800 mb-6">Booking Details</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg shadow-md">
  <div className="space-y-6">
    <p className="font-semibold text-gray-800">
      <span className="block text-gray-500 text-sm">Location:</span>
      <span className="text-lg">{booking.location}</span>
    </p>
    <p className="font-semibold text-gray-800">
      <span className="block text-gray-500 text-sm">Service:</span>
      <span className="text-lg">{booking.service}</span>
    </p>
    
    <p className="font-semibold text-gray-800">
      <span className="block text-gray-500 text-sm">Customer:</span>
      <span className="text-lg">
        {customer ? `${customer.firstName} ${customer.lastName}` : 'Loading customer details...'}
      </span>
    </p>
    <p className="font-semibold text-gray-800">
      <span className="block text-gray-500 text-sm">Date:</span>
      <span className="text-lg">{booking.date}</span>
    </p>
    <p className="font-semibold text-gray-800">
      <span className="block text-gray-500 text-sm">Time:</span>
      <span className="text-lg">{booking.time}</span>
    </p>
    <p className="font-semibold text-gray-800">
      <span className="block text-gray-500 text-sm">Problem Description:</span>
      <span className="text-lg">
        {booking.problem_description !== 'N/A' ? booking.problem_description : 'Not provided'}
      </span>
    </p>
    <p className="font-semibold text-gray-800">
      <span className="block text-gray-500 text-sm">Status:</span>
      <span
        className={`text-lg ${
          booking.status === 'accepted'
            ? 'text-green-600'
            : booking.status === 'declined'
            ? 'text-red-600'
            : 'text-yellow-600'
        }`}
      >
        {booking.status}
      </span>
    </p>
  </div>


          <div id="map" className="w-full h-72 rounded-lg shadow-md"></div>
        </div>
{(booking.status !== 'completed' && booking.status !== 'declined' && booking.status !== 'accepted' && booking.status === 'pending') ? (
        <div className="flex flex-col sm:flex-row justify-between mt-8 space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => updateStatus('accepted')}
            className="w-full sm:w-auto py-2 px-4 bg-green-500 text-white font-medium rounded shadow hover:bg-green-600 transition"
          >
            Accept
          </button>
          <button
            onClick={() => updateStatus('declined')}
            className="w-full sm:w-auto py-2 px-4 bg-red-500 text-white font-medium rounded shadow hover:bg-red-600 transition"
          >
            Decline
          </button>
          <button
            onClick={() => updateStatus('completed')}
            className="w-full sm:w-auto py-2 px-4 bg-yellow-500 text-white font-medium rounded shadow hover:bg-yellow-600 transition"
          >
            Mark as Completed
          </button>
        </div>) :
        <div>
          <button  className="w-full sm:w-auto py-2 px-4 bg-green-500 text-white font-medium rounded shadow hover:bg-green-600 transition" onClick={ goToChat}>
            Go to the chat
          </button>
        </div>
        
        }
      </main>
    </div>
  );
};

export default ViewBooking;
