
import { useEffect, useState } from 'react';
import ProviderHeader from './ProviderHeader';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { notify } from '../utils/notify';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const STATUS_MESSAGES = {
  accepted: 'Booking accepted.',
  declined: 'Booking declined.',
  in_progress: 'Booking marked as in progress.',
  completed: 'Booking marked as completed.',
};

const ViewBooking = () => {
  const location = useLocation();
  const booking = location.state?.booking;
  const [customer, setCustomer] = useState(null);
  const [map, setMap] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        if (!booking) return;
        const res = await api.post('/fetch-customer', { booking });
        setCustomer(res.data.data);
      } catch (error) {
        console.error('Error fetching customer information:', error.response || error);
      }
    };

    fetchCustomer();
  }, [booking]);

  useEffect(() => {
    let newMap;

    const initializeMap = async () => {
      if (!booking?.location) return;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            booking.location
          )}&format=json`
        );

        const data = await response.json();

        if (!data.length) {
          console.error('Location not found');
          return;
        }

        const { lat, lon } = data[0];

        if (!document.getElementById('map')) return;

        newMap = L.map('map').setView([parseFloat(lat), parseFloat(lon)], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(newMap);

        L.marker([parseFloat(lat), parseFloat(lon)])
          .addTo(newMap)
          .bindPopup(booking.location)
          .openPopup();

        setMap(newMap);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();

    return () => {
      if (newMap) newMap.remove();
    };
  }, [booking]);

  const updateStatus = async (status) => {
    try {
      await api.patch('/fetch-provider-bookings', {
        status,
        bookingId: booking._id,
      });

      booking.status = status;
      notify('success', STATUS_MESSAGES[status] || 'Booking updated.');
      navigate('/dashboard/service-provider');
    } catch (error) {
      console.error('Error updating status:', error.response || error);
      notify('error', 'Could not update booking status. Please try again.');
    }
  };

  const goToChat = () => {
    navigate('/service-provider/chat', {
      state: { customer, bookingId: booking._id },
    });
  };

  if (!booking) {
    return (
      <div className="bg-gray-100 min-h-screen flex items-center justify-center text-gray-700">
        Booking details are unavailable. Please return to your bookings and open one again.
      </div>
    );
  }

  const stages = [
    { label: 'Pending', statuses: ['pending'] },
    { label: 'Accepted', statuses: ['accepted'] },
    { label: 'In Progress', statuses: ['in_progress', 'in progress'] },
    { label: 'Completed', statuses: ['completed'] },
  ];

  const currentStage = stages.findIndex((stage) =>
    stage.statuses.includes(booking.status?.toLowerCase())
  );

  const isDeclined = booking.status?.toLowerCase() === 'declined';

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="mb-7">
        <ProviderHeader />
      </div>

      <main className="max-w-6xl mx-auto py-8 px-6 bg-white shadow-md rounded-lg space-y-7">
        <h1 className="text-2xl sm:text-3xl text-center font-bold text-gray-800 mb-6">
          Booking Details
        </h1>

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
                {customer
                  ? `${customer.firstName} ${customer.lastName}`
                  : 'Loading customer details...'}
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
                {booking.problem_description &&
                booking.problem_description !== 'N/A'
                  ? booking.problem_description
                  : 'Not provided'}
              </span>
            </p>

            <div>
              <p className="block text-gray-500 text-sm mb-2">Booking Progress:</p>

              <p
                className={`font-semibold text-lg mb-4 capitalize ${
                  isDeclined ? 'text-red-600' : 'text-green-700'
                }`}
              >
                {booking.status?.replace('_', ' ')}
              </p>

              {!isDeclined && (
                <>
                  <div className="flex items-center gap-1">
                    {stages.map((stage, index) => (
                      <div
                        key={stage.label}
                        className={`h-2 flex-1 rounded-full ${
                          currentStage >= index
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-1 mt-2">
                    {stages.map((stage) => (
                      <span
                        key={stage.label}
                        className="text-center text-xs text-gray-500"
                      >
                        {stage.label}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {isDeclined && (
                <p className="text-sm text-red-600">
                  This booking was declined.
                </p>
              )}
            </div>
          </div>

          <div
            id="map"
            className="w-full h-72 rounded-lg shadow-md"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          {booking.status === 'pending' && (
            <>
              <button
                onClick={() => updateStatus('accepted')}
                className="py-2 px-4 bg-green-500 text-white font-medium rounded shadow hover:bg-green-600 transition"
              >
                Accept
              </button>

              <button
                onClick={() => updateStatus('declined')}
                className="py-2 px-4 bg-red-500 text-white font-medium rounded shadow hover:bg-red-600 transition"
              >
                Decline
              </button>
            </>
          )}

          {booking.status === 'accepted' && (
            <button
              onClick={() => updateStatus('in_progress')}
              className="py-2 px-4 bg-blue-500 text-white font-medium rounded shadow hover:bg-blue-600 transition"
            >
              Mark as In Progress
            </button>
          )}

          {(booking.status === 'in_progress' ||
            booking.status === 'in progress') && (
            <button
              onClick={() => updateStatus('completed')}
              className="py-2 px-4 bg-green-500 text-white font-medium rounded shadow hover:bg-green-600 transition"
            >
              Mark as Completed
            </button>
          )}

          {(booking.status === 'accepted' ||
            booking.status === 'in_progress' ||
            booking.status === 'in progress' ||
            booking.status === 'completed' ||
            booking.status === 'declined') && (
            <button
              onClick={goToChat}
              className="py-2 px-4 bg-gray-600 text-white font-medium rounded shadow hover:bg-gray-700 transition"
            >
              Go to the chat
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewBooking;