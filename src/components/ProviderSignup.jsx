import React, { useState, useEffect } from 'react';
import {useLocation, useNavigate} from 'react-router-dom'
import api from '../utils/api'
const ProviderSignup = () => {
    const navigate = useNavigate()
    const [user, setUser] = useState()
    const [phoneNumber, setPhoneNumber] = useState('')
    const [profilePicture, setProfilePicture] = useState(null); // For profile picture
    const [certifications, setCertifications] = useState(null); // For certifications
    const [companyName, setCompanyName] = useState('')
    const [description, setDescription] = useState('')
    const[yearsInService, setYearsInService] = useState('')
    const services_provided = [
        'exterior maintenance', 'home security', 'flooring',
        'plumbing', 'electrical', 'carpentry',
        'painting', 'home security', 'interior design',
        'home automation', 'home installation'
    ]; // Truncated for brevity
    const [loading, setLoading] = useState(false)
    // State for selected services
    const [selectedServices, setSelectedServices] = useState([]);

    
    const fetchCurrentUser = async () => {
        try {
            const accessToken = localStorage.getItem('access_token');
            
            if (!accessToken) {
                throw new Error('No access token available');
            }
    
            const response = await api.get('/auth/user', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log(response.data.user)
            console.log(response.data.user._id)
    
            return response.data.user;
        } catch (error) {
            console.error('Error fetching current user:', error);
            throw error;
        }
    };        
    useEffect(() => {
        const fetchUser = async () => {
            const user = await fetchCurrentUser();
            console.log('Received user data:', user);
            if (!user) {
                console.log('failed to fetch user');
            } else {
                setUser(user);
            }
        };
        fetchUser();
    }, []);

        useEffect(() => {
            console.log('Profile picture:', profilePicture);
            console.log('Certifications:', certifications);
        }, [profilePicture, certifications]);

    // Handle checkbox change
    const handleServiceChange = (service) => {
        setSelectedServices((prevSelected) =>
            prevSelected.includes(service)
                ? prevSelected.filter((s) => s !== service) // Remove if already selected
                : [...prevSelected, service] // Add if not selected
        );
    };

    const handleFileChange = (e, setFileState) => {
        const files = e.target.files;
        if (files) {
            setFileState(e.target.multiple ? Array.from(files) : files[0]);
        }
    };  
    
    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true);
        const formData = new FormData()
        formData.append('userId',user._id)
        formData.append('firstName', user.firstName)
        formData.append('lastName', user.lastName)
        formData.append('email', user.email)
        formData.append('phoneNumber', phoneNumber)
        formData.append('companyName', companyName)
        formData.append('description', description)
        formData.append('yearsInService', yearsInService)
        if (profilePicture) {
            formData.append('profile_picture', profilePicture);
        }       
        if (certifications && certifications.length > 0) {
            certifications.forEach((file) => {
                formData.append('certifications', file); // Use the same key for all files
            });
        }
        formData.append('services', JSON.stringify(selectedServices)); // Append selected services as a JSON string

        try {
            formData.forEach((value, key) => {
                console.log(key, value);
            });
            const response = await api.post('auth/complete-provider-signup', formData,  { headers: { 'Content-Type': 'multipart/form-data' } });
            console.log(response.data)
            if(response.status === 200){
                alert('Profile updated successfully!');
                navigate('/dashboard/service-provider')
            }     
        } catch (error) {
            console.error('An error occurred during the application', error);
            alert('Failed to submit the application. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='bg-gray-100 min-h-screen'>
            
            <div className='text-center py-8'>
                <h1 className='text-3xl font-bold'>Service Provider Registration</h1>
                <p className='text-gray-600 mt-2'>
                    Complete your profile to join our network of service providers.
                </p>
            </div>
            <main>
                <section>
                    <form onSubmit={handleSubmit} className='bg-white p-8 mx-20 my-4 rounded-lg shadow-md'>
                        <h1 className='text-xl font-medium mb-4'>Personal Information</h1>
                        <div>
                            {user &&  (
                                <div >
                                    <div className='flex flex-col md:flex-row gap-4 mb-4'>
                                        <div className='flex-1'>
                                            <label htmlFor="name" className='block text-sm font-medium text-gray-700'>Name</label>
                                            <input name='firstName' readOnly type="text" id="name" value={user?.firstName} className='mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm' />
                                        </div>
                                        <div className='flex-1'>
                                            <label htmlFor="password" className='block text-sm font-medium text-gray-700'>Last Name</label>
                                            <input name='lastName' readOnly type="text" id="password" value={user.lastName} className='mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm' />
                                        </div>
                                    </div>
                                    <div className='flex flex-col md:flex-row gap-4 mb-4'>
                                        <div className='flex-1'>
                                            <label htmlFor="phone" className='block text-sm font-medium text-gray-700'>Phone</label>
                                            <input placeholder='please fill me in' maxLength={10} required onChange={(e) => setPhoneNumber(e.target.value)} name='phoneNumber' type="tel" id="phone"  value={phoneNumber} className='mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm' />
                                        </div>
                                        <div className='flex-1'>
                                            <label htmlFor="email" className='block text-sm font-medium text-gray-700'>Email</label>
                                            <input name='email' readOnly type="email" id="email" value={user.email} className='mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm' />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <hr className='my-6' />
                            <h1 className='text-xl font-medium mb-1 '>
                                Company Information
                            </h1>
                        <div className='m-4 mx-auto p-2'>
                            <div className='flex flex-col'>
                                <div className='flex justify-between'>

                                    <div className='mb-2'>
                                        <p className='block text-sm font-medium text-gray-700'>Company Name</p>
                                        <input  className='mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm' value={companyName} onChange={(e)=> setCompanyName(e.target.value)} type="text" />
                                    </div>
                                    <div>
                                        <p className='block text-sm font-medium text-gray-700'>Years in service</p>
                                        <input onChange={(e) => setYearsInService(e.target.value)} value={yearsInService} type="number"  className='mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm' />
                                    </div>

                                </div>
                                <div className=''>
                                    <p className='block text-sm font-medium text-gray-700'>Description</p>
                                    <textarea onChange={(e) => setDescription(e.target.value)} value={description} type="text" name='description'  className='mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm' />
                                </div>
                            </div>
                        </div>
                        <div>
    <h1 className='text-xl font-medium mb-1 '>Profile picture</h1>
    <p className='text-xs text-gray-300 mb-4'>Enter a profile picture</p>
    <input name='profile_picture' onChange={(e) => handleFileChange(e, setProfilePicture)} type="file" className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100' />
</div>
<div className='mt-6'></div>
<div>
    <h1 className='text-xl font-medium mb-1'>Professional Certifications</h1>
    <p className='text-xs text-gray-300 mb-4'>Trade License</p>
    <div>
        <input multiple name='certifications' onChange={(e) => handleFileChange(e, setCertifications)} type="file" className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100'/>
    </div>
</div>
                <hr />
                <div>
                    <h1  className='text-xl font-medium mb-1'>Service Information</h1>
                    <p className='text-xs text-gray-300 mb-4'>Service Categories</p>
                    <div>
                    {services_provided.map((service) => (
                  <div key={service} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={service}
                      value={service}
                      checked={selectedServices.includes(service)}
                      onChange={() => handleServiceChange(service)}
                      className='flex'
                      name='service'
                    />
                    <label className='text-sm' htmlFor={service}>{service}</label>
                  </div>
                ))}
                        
                    </div>
                    <p className="mt-4 text-sm font-medium">
                Selected Services: {selectedServices.join(', ') || 'None'}
              </p>
                   
                </div>

                <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                className="bg-gray-200 border text-sm border-gray-700 text-black p-2 rounded"
                                onClick={() => navigate(-1)}
                                disabled={loading} // Disable cancel button during loading
                            >
                                Cancel
                            </button>
                            <button
                                disabled={loading}
                                type="submit"
                                className={`p-2 rounded text-sm ${loading ? 'bg-gray-400' : 'bg-black text-white'}`}
                            >
                                {loading ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                    {loading && (
                        <div className="mt-4 text-center">
                            <p className="text-gray-500">Processing your application...</p>
                        </div>
                    )}
            </section>
        </main>
      
    </div>
  )
}

export default ProviderSignup
