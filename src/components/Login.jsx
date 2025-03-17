import  { useState, useContext } from 'react';
import loginImg from '../assets/login-pic.jpg';
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingPage from './LoadingPage';

const Login = () => {
    const navigate = useNavigate();
    const [openRegisterForm, setOpenRegisterForm] = useState(false);
    const [openLoginForm, setOpenLoginForm] = useState(true);
    const [serviceProvider, setServiceProvider] = useState(false);
    const { login, register } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [role, setRole] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState('');
    const [coordinates, setCoordinates] = useState({
        longitude: null,
        latitude: null
    });
    const [loading, setLoading] = useState(false)


    const toggleRegisterForm = () => {
        setOpenRegisterForm((prevState) => !prevState);
        setOpenLoginForm((prevState) => !prevState);
    };

    const getCoordinate = async (location) => {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json`;
    
        try {
            const response = await fetch(url);
            const data = await response.json();
    
            if (data.length > 0) {
                const newCoords = {
                    longitude: data[0].lon,
                    latitude: data[0].lat,
                };
                setCoordinates(newCoords);
                return newCoords;  // Return coordinates immediately
            } else {
                throw new Error('No data found for the given location');
            }
        } catch (error) {
            console.error(error);
            setError('Failed to fetch coordinates, please try again.');
            return { longitude: null, latitude: null };  // Ensure function always returns something
        }
    };
    
    const newUserFirstTimeLogIn = async () => {
        try {
            const response = await login(email, password)
            if(response.status === 200 && response.data.user.role === 'service provider'){
                navigate('/provider-signup')
            } else {
            navigate('/dashboard-customer')}
            
        } catch (error) {
            console.log("An error occured during the login process", error)
            
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true)
        try {
            const response = await login(email, password);
            console.log("server response", response.data)
            if (response.status === 200){
                if (response.data.user.role === 'service provider') {
                    navigate('/dashboard/service-provider');
                } else {
                    navigate('/dashboard/customer');}
            }
        } catch (error) {
            console.error(error.message);
            setError('Login failed: ' + error.message);
        } finally{
            setLoading(false)
        }
    };
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
    
        try {
            const userRole = serviceProvider ? 'service provider' : 'customer';
            setRole(userRole);
    
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                setLoading(false);
                return;
            }
    
            let coords = { longitude: null, latitude: null };
    
            if (location) {
                const fetchedCoords = await getCoordinate(location);
                if (fetchedCoords) {
                    coords = fetchedCoords; 
                }
                setCoordinates(coords);
                console.log(coordinates)
            }
    
            // Ensure coordinates are valid
            if (!coords.longitude || !coords.latitude) {
                setError('Invalid location, please check the coordinates.');
                setLoading(false);
                return;
            }
    
            console.log('Attempting registration with:', {
                email,
                location,
                passwordLength: password.length,
                role: role,
                hasCoordinates: !!(coords.longitude && coords.latitude),
            });
    
            const response = await register(
                firstName,
                lastName,
                email,
                role,
                password,
                location,
                coords.longitude,
                coords.latitude
            );
    
            if (response.success) {
                console.log('Registration response:', response);
    
                if (serviceProvider) {
                    const loginAttempt = await newUserFirstTimeLogIn(email, password);
                    if (loginAttempt.status === 200) {
                        console.log('Successfully logged user in');
                        navigate('/provider-signup');
                    }
                } else {
                    const loginAttempt = await login(email, password);
                    if (loginAttempt.status === 200) {
                        console.log('Successfully logged user in');
                        navigate('/dashboard/customer');
                    }
                }
            }
        } catch (error) {
            console.error(error.message);
            setError('Registration failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    

    const toggleServiceProvider = (e) => {
        e.preventDefault();
        setServiceProvider((prevState) => !prevState);
    };

    return (
        <div className="min-h-screen flex">
            {/* Background image covering half of the page */}
            <div
                className="w-1/2"
                style={{
                    backgroundImage: `url(${loginImg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            ></div>

            {/* Login form covering the other half */}
            {openLoginForm && (
                <div className="w-1/2 flex items-center justify-center">
                    <form className="bg-white p-8 rounded shadow-md w-3/4" onSubmit={handleLogin}>
                        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                name="email"
                                type="email"
                                id="email"
                                required
                                placeholder="Enter your email"
                                className="mt-1 p-2 border bg-gray-300 rounded w-full"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                name="password"
                                type="password"
                                id="password"
                                required
                                placeholder="Enter your password"
                                className="mt-1 p-2 border bg-gray-300 rounded w-full"
                            />
                        </div>
                        <button type="submit" className="w-full bg-purple-700 text-white p-2 rounded hover:bg-blue-600">
                            {loading ? 'Logging In' : "Login"}
                        </button>
                        <p className="text-center m-4 text-xs">
                            Want an account ?
                            <a className="cursor-pointer underline ml-2 hover:text-purple-700 font-medium" onClick={toggleRegisterForm}>
                                Register here
                            </a>
                        </p>
                    </form>
                </div>
            )}
            {openRegisterForm && (
                <div className="w-1/2 flex items-center justify-center">
                    <form className="bg-white p-8 rounded shadow-md w-11/12" onSubmit={handleRegister}>
                        <h2 className="text-2xl font-bold mb-4 text-center">Sign up</h2>
                        <div className="flex justify-between">
                            <div className="mb-4">
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                    First Name
                                </label>
                                <input
                                    onChange={(e) => setFirstName(e.target.value)}
                                    value={firstName}
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    required
                                    placeholder="Enter your first name"
                                    className="mt-1 p-2 border bg-gray-300 rounded w-full"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                    Last Name
                                </label>
                                <input
                                    onChange={(e) => setLastName(e.target.value)}
                                    value={lastName}
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    required
                                    placeholder="Enter your last name"
                                    className="mt-1 p-2 border bg-gray-300 rounded w-full"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                type="email"
                                id="email"
                                required
                                name="email"
                                placeholder="Enter your email"
                                className="mt-1 p-2 border bg-gray-300 rounded w-full"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                onChange={(e) => setPassword(e.target.value)}
                                value={password}
                                type="password"
                                id="password"
                                name="password"
                                required
                                placeholder="Enter your password"
                                className="mt-1 p-2 border bg-gray-300 rounded w-full"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm password
                            </label>
                            <input
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                value={confirmPassword}
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                                placeholder="Confirm your password"
                                className="mt-1 p-2 border bg-gray-300 rounded w-full"
                            />
                        </div>
                        <div className="mb-4">
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                                Location
                            </label>
                            <input
                                onChange={(e) => setLocation(e.target.value)}
                                value={location}
                                type="text"
                                id="location"
                                name="location"
                                required
                                placeholder="(Address, City, Country)"
                                className="mt-1 p-2 border bg-gray-300 rounded w-full"
                            />
                        </div>
                       
                        <div>
                            <p className="text-xs font-semibold text-gray-800 mb-1 underline">Are you a service provider?</p>
                            <button
                                type="button"
                                name="role"
                                onClick={toggleServiceProvider}
                                className={`w-14 h-8 flex items-center bg-gray-300 rounded-full p-1 ${
                                    serviceProvider ? 'bg-green-400' : 'bg-gray-300'
                                }`}
                            >
                                <div
                                    className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                                        serviceProvider ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                                ></div>
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-purple-700 text-white p-2 rounded hover:bg-blue-600"
                        >
                            {loading ? 'Signing you up' : "Register"}

                        </button>
                        <p className="text-center m-4 text-xs">
                            Already have an account?
                            <a className="cursor-pointer underline font-medium hover:text-purple-700" onClick={toggleRegisterForm}>
                                Log in here
                            </a>
                        </p>

                        {error && <p className="text-red-500 text-center">{error}</p>}
                    </form>
                </div>
            )}

        </div>
    );
};

export default Login;
