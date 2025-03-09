import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Services from './components/Services';
import HandymanListings from './components/HandymanListings';
import Login from './components/Login';
import CustomerDashboard from './components/CustomerDashboard';
import ServiceProviderDashboard from './components/ServiceProviderDashboard';
import ServiceProviders from './components/ServiceProviders';
import ViewAndBook from './components/ViewAndBook';
import History from './components/History';
import ViewBookings from './components/ViewBooking';
import Settings from './components/Settings';
import ProviderSignup from './components/ProviderSignup';
import ServiceProviderChat from './components/ServiceProviderChat'
import CustomerChat from './components/CustomerChat'
import Messages from './components/Messages'
import AllCustomerBookings from './components/AllCustomerBookings';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify's CSS
import ViewCustomerBooking from './components/ViewCustomerBooking';
import ProviderRequest from './components/ProviderRequest';
import ProviderHistory from './components/ProviderHistory';
import Schedule from './components/Schedule'

const App = () => {
  return (
    <AuthProvider>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop={false} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme="light" 
      />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/services" element={<Services />} />
          <Route path="/handyman-listings" element={<HandymanListings />} />
          <Route path="/sign-in" element={<Login />} />
          <Route path="/dashboard/customer" element={<CustomerDashboard />} />
          <Route path="/dashboard/service-provider" element={<ServiceProviderDashboard />} />
          <Route path="/service-providers" element={<ServiceProviders />} />
          <Route path="/view-provider" element={<ViewAndBook />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/provider-signup" element={<ProviderSignup />} />
          <Route path="/view-booking" element={<ViewBookings />} />
          <Route path="/service-provider/chat" element={<ServiceProviderChat />} />
          <Route path="/customer/chat" element={<CustomerChat />} />
          <Route path="/all-bookings" element={<AllCustomerBookings />} />
          <Route path="/view-customer-booking" element={<ViewCustomerBooking />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/provider-bookings" element={<ProviderRequest />} />
          <Route path="/service-provider/history" element={<ProviderHistory />} />
          <Route path='/provider-schedule' element={<Schedule />}/>


        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
