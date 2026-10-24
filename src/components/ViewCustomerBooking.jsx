
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import CustomerHeader from './CustomerHeader';

const ViewCustomerBooking = () => {
  const location = useLocation();
  const booking = location.state?.booking;

  const [customer, setCustomer] = useState(null);
  const [providerInfo, setProviderInfo] = useState(null);

  useEffect(() => {
    if (!booking) return;

    const fetchCustomer = async () => {
      try {
        const res = await api.post('/fetch-customer', { booking });
        setCustomer(res.data.data);
      } catch (error) {
        console.error(
          'Error fetching customer information:',
          error.response || error
        );
      }
    };

    fetchCustomer();
  }, [booking]);

  useEffect(() => {
    if (!booking?.service_provider) return;

    const fetchServiceProviderInfo = async () => {
      console.log('Booking:', booking);
console.log('Provider ID:', booking.service_provider);
      try {
        const res = await api.post('/fetch-service-provider', {
  providerId: booking.service_provider,
});

console.log(
  'Provider details:',
  JSON.stringify(res.data.data, null, 2)
);
setProviderInfo(res.data.data);
      } catch (error) {
        console.error(
          'Error fetching service provider information:',
          error.response || error
        );
      }
    };

    fetchServiceProviderInfo();
  }, [booking]);

  if (!booking) {
    return (
      <>
        <CustomerHeader />
        <main className="max-w-6xl mx-auto p-6">
          <p>Booking details are unavailable. Please return to your bookings and select a booking again.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <CustomerHeader />

      <main className="max-w-6xl mx-auto py-8 px-6 bg-white shadow-lg rounded-lg space-y-8">
        <h1 className="text-4xl text-center font-extrabold text-gray-800 mb-8">
          Booking Details
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50 p-8 rounded-lg border border-gray-100">

          {/* Booking information */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">
              Booking Information
            </h2>

            <p>
              <span className="block text-sm text-gray-500 uppercase">Location</span>
              <span className="text-lg text-gray-900">{booking.location}</span>
            </p>

            <p>
              <span className="block text-sm text-gray-500 uppercase">Service</span>
              <span className="text-lg text-gray-900">{booking.service}</span>
            </p>

            <p>
              <span className="block text-sm text-gray-500 uppercase">Status</span>
              <span className="text-lg font-semibold text-gray-900">{booking.status}</span>
            </p>
          </section>

          {/* Customer information */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">
              Customer Details
            </h2>

            {customer ? (
              <>
                <p>
                  <span className="block text-sm text-gray-500 uppercase">Name</span>
                  <span className="text-lg text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </span>
                </p>

                <p>
                  <span className="block text-sm text-gray-500 uppercase">Email</span>
                  <span className="text-lg text-gray-900 break-all">{customer.email}</span>
                </p>
              </>
            ) : (
              <p className="text-gray-500">Loading customer details...</p>
            )}
          </section>

          
{/* Service provider information */}
<section className="space-y-4">
  <h2 className="text-xl font-bold text-gray-800">
    Service Provider Details
  </h2>

  {providerInfo ? (
    <>
      <p>
        <span className="block text-sm text-gray-500 uppercase">
          Company Name
        </span>
        <span className="text-lg text-gray-900">
          {providerInfo.companyName || 'Company name unavailable'}
        </span>
      </p>

      <p>
        <span className="block text-sm text-gray-500 uppercase">
          Services Offered
        </span>
        <span className="text-lg text-gray-900">
          {Array.isArray(providerInfo.services)
            ? providerInfo.services
                .flatMap((service) => {
                  try {
                    const parsed = JSON.parse(service);
                    return Array.isArray(parsed) ? parsed : [service];
                  } catch {
                    return [service];
                  }
                })
                .join(', ')
            : 'Services unavailable'}
        </span>
      </p>

      <p>
        <span className="block text-sm text-gray-500 uppercase">
          Years in Service
        </span>
        <span className="text-lg text-gray-900">
          {providerInfo.yearsInService ?? 'Not specified'}
        </span>
      </p>

      <p>
        <span className="block text-sm text-gray-500 uppercase">
          Email
        </span>
        <span className="text-lg text-gray-900 break-all">
          {providerInfo.email || 'Email stored in user account'}
        </span>
      </p>
    </>
  ) : (
    <p className="text-gray-500">
      Loading service provider details...
    </p>
  )}
</section>

        </div>
      </main>
    </>
  );
};

export default ViewCustomerBooking;
