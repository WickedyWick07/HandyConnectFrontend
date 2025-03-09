import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import CustomerHeader from './CustomerHeader';

const ViewCustomerBooking = () => {
  const location = useLocation();
  const booking = location.state?.booking;
  const [customer, setCustomer] = useState(null);
  const navigate = useNavigate()
  const [providerInfo, setProviderInfo] = useState(null)

  useEffect(() => {
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

    fetchCustomer();
  }, [booking]);
  const providerId = booking.service_provider
  console.log('provider',providerId)
  useEffect(() => {
    const fetchServiceProviderInfo = async () =>{
      try {
        const res = await api.post('/fetch-service-provider', {providerId})
        console.log('Service Provider Info:', res.data.data)
        setProviderInfo(res.data.data)
      } catch (error) {
        console.error('Error fetching service provider info:', error.response || error)
    }
  }

  fetchServiceProviderInfo()

},[])

  console.log('service provider:', booking.service_provider)

  

  

  return (
    <>
    <CustomerHeader />
    <main className="max-w-6xl mx-auto py-8 px-6 bg-white shadow-lg rounded-lg space-y-8 transform transition-all duration-300 hover:shadow-2xl">
      <h1 className="text-4xl text-center font-extrabold text-gray-800 mb-8 tracking-tight">
        Booking Details
      </h1>
  
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-gray-50 p-8 rounded-lg shadow-inner border border-gray-100">
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="font-semibold text-gray-800">
              <span className="block text-gray-500 text-sm uppercase tracking-wider">Location:</span>
              <span className="text-xl font-medium text-gray-900">{booking?.location}</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-gray-800">
              <span className="block text-gray-500 text-sm uppercase tracking-wider">Service:</span>
              <span className="text-xl font-medium text-gray-900">{booking?.service}</span>
            </p>
          </div>
          {customer && (
            <>
              <div className="space-y-2">
                <p className="font-semibold text-gray-800">
                  <span className="block text-gray-500 text-sm uppercase tracking-wider">Customer Name:</span>
                  <span className="text-xl font-medium text-gray-900">
                    {customer.firstName} {customer.lastName}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-gray-800">
                  <span className="block text-gray-500 text-sm uppercase tracking-wider">Customer Email:</span>
                  <span className="text-xl font-medium text-gray-900 break-all">{customer.email}</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

    </main>
  </>
  );
};

export default ViewCustomerBooking;