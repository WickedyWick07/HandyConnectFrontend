import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    User,
    MapPin,
    Loader2,
    CheckCircle2,
} from 'lucide-react';
import loginImg from '../assets/login-pic.jpg';
import AuthContext from '../context/AuthContext';

const inputClass =
    'block h-12 w-full min-w-0 rounded-lg border border-gray-300 bg-gray-50 pl-10 text-base text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60';

// Labelled input with a leading icon and an optional trailing element (e.g. eye toggle)
const Field = ({ id, label, icon: Icon, trailing, className = '', ...inputProps }) => (
    <div className={className}>
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
        </label>
        <div className="relative">
            <Icon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
            />
            <input
                id={id}
                name={id}
                className={`${inputClass} ${trailing ? 'pr-11' : 'pr-3'}`}
                {...inputProps}
            />
            {trailing}
        </div>
    </div>
);

const PasswordToggle = ({ visible, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-500 transition hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
        {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
    </button>
);

const SubmitButton = ({ loading, loadingText, children }) => (
    <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-base font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
    >
        {loading ? (
            <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                {loadingText}
            </>
        ) : (
            children
        )}
    </button>
);

const Login = () => {
    const navigate = useNavigate();
    const { login, register } = useContext(AuthContext);

    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [serviceProvider, setServiceProvider] = useState(false);
    const [location, setLocation] = useState('');
    const [coordinates, setCoordinates] = useState({ longitude: null, latitude: null });
    const [locationVerified, setLocationVerified] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isLogin = mode === 'login';

    const switchMode = () => {
        setMode(isLogin ? 'register' : 'login');
        setError('');
        setConfirmPassword('');
        setShowPassword(false);
    };

    async function getCoordinate(place) {
        setLocationLoading(true);
        setLocationError('');
        setLocationVerified(false);

        if (!place || place.trim() === '') {
            setLocationError('Please enter a location');
            setLocationLoading(false);
            return null;
        }

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status}`);
            }
            const data = await response.json();

            if (data.length > 0) {
                const newCoords = { longitude: data[0].lon, latitude: data[0].lat };
                setCoordinates(newCoords);
                setLocationVerified(true);
                return newCoords;
            }
            setLocationError('No location found. Please try a different address or city.');
            return null;
        } catch (err) {
            console.error('Error fetching coordinates:', err);
            setLocationError('Failed to fetch coordinates: ' + err.message);
            return null;
        } finally {
            setLocationLoading(false);
        }
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await login(email, password);
            if (response.status === 200) {
                navigate(
                    response.data.user.role === 'service provider'
                        ? '/dashboard/service-provider'
                        : '/dashboard/customer'
                );
            }
        } catch (err) {
            console.error(err.message);
            setError('Login failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const userRole = serviceProvider ? 'service provider' : 'customer';

            // Use already-verified coordinates, otherwise verify now
            const coords = locationVerified ? coordinates : await getCoordinate(location);
            if (!coords) {
                setError('Please verify your location before registering');
                return;
            }

            const response = await register(
                firstName,
                lastName,
                email,
                userRole,
                password,
                location,
                coords.longitude,
                coords.latitude
            );

            if (response.success) {
                await login(email, password);
                navigate(userRole === 'service provider' ? '/provider-signup' : '/dashboard/customer');
            } else {
                setError(response.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('Registration failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const passwordType = showPassword ? 'text' : 'password';
    const passwordToggle = (
        <PasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
    );

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden md:flex">
            {/* Image: full-page background on mobile/tablet, left half on md+ */}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center md:relative md:inset-auto md:w-1/2"
                style={{ backgroundImage: `url(${loginImg})` }}
            />
            {/* Dark overlay, mobile/tablet only */}
            <div aria-hidden="true" className="absolute inset-0 bg-black/60 md:hidden" />

            {/* Form side */}
            <main className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 md:w-1/2 md:bg-gray-50">
                <div className="w-[90%] max-w-sm rounded-2xl bg-white/90 p-6 shadow-xl backdrop-blur-md md:w-full md:max-w-[400px] md:bg-white md:p-8 md:backdrop-blur-none">
                    <Link
                        to="/"
                        className="mb-6 block rounded text-center font-sans text-2xl font-extrabold text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                        HandyConnect
                    </Link>

                    <h1 className="mb-6 text-center text-xl font-bold text-gray-900">
                        {isLogin ? 'Login' : 'Create your account'}
                    </h1>

                    {isLogin ? (
                        <form onSubmit={handleLogin} className="space-y-4" noValidate={false}>
                            <Field
                                id="email"
                                label="Email Address"
                                icon={Mail}
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                            />
                            <Field
                                id="password"
                                label="Password"
                                icon={Lock}
                                type={passwordType}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                trailing={passwordToggle}
                            />

                            {error && (
                                <p role="alert" className="text-center text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            <SubmitButton loading={loading} loadingText="Logging in...">
                                Login
                            </SubmitButton>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field
                                    id="firstName"
                                    label="First Name"
                                    icon={User}
                                    type="text"
                                    autoComplete="given-name"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="First name"
                                    className="min-w-0"
                                />
                                <Field
                                    id="lastName"
                                    label="Last Name"
                                    icon={User}
                                    type="text"
                                    autoComplete="family-name"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Last name"
                                    className="min-w-0"
                                />
                            </div>
                            <Field
                                id="email"
                                label="Email Address"
                                icon={Mail}
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                            />
                            <Field
                                id="password"
                                label="Password"
                                icon={Lock}
                                type={passwordType}
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                trailing={passwordToggle}
                            />
                            <Field
                                id="confirmPassword"
                                label="Confirm Password"
                                icon={Lock}
                                type={passwordType}
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                            />

                            <div>
                                <div className="flex items-end gap-2">
                                    <Field
                                        id="location"
                                        label="Location"
                                        icon={MapPin}
                                        type="text"
                                        required
                                        value={location}
                                        onChange={(e) => {
                                            setLocation(e.target.value);
                                            setLocationVerified(false);
                                            setLocationError('');
                                        }}
                                        placeholder="Address, City, Country"
                                        className="min-w-0 flex-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => getCoordinate(location)}
                                        disabled={locationLoading || !location}
                                        className="h-12 shrink-0 rounded-lg border border-gray-300 bg-gray-100 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {locationLoading ? 'Verifying...' : 'Verify'}
                                    </button>
                                </div>
                                {locationVerified && (
                                    <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
                                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                        Location verified successfully
                                    </p>
                                )}
                                {locationError && (
                                    <p role="alert" className="mt-1 text-xs text-red-600">
                                        {locationError}
                                    </p>
                                )}
                                {!locationVerified && !locationError && location && (
                                    <p className="mt-1 text-xs text-amber-600">Please verify your location</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <span id="provider-label" className="text-sm font-medium text-gray-700">
                                    Are you a service provider?
                                </span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={serviceProvider}
                                    aria-labelledby="provider-label"
                                    onClick={() => setServiceProvider((v) => !v)}
                                    className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                                        serviceProvider ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                                >
                                    <span
                                        className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                                            serviceProvider ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            {error && (
                                <p role="alert" className="text-center text-sm text-red-600">
                                    {error}
                                </p>
                            )}

                            <SubmitButton loading={loading} loadingText="Signing you up...">
                                Register
                            </SubmitButton>
                        </form>
                    )}

                    <p className="mt-6 text-center text-sm text-gray-600">
                        {isLogin ? 'Want an account?' : 'Already have an account?'}{' '}
                        <button
                            type="button"
                            onClick={switchMode}
                            className="rounded font-medium text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                            {isLogin ? 'Register here' : 'Log in here'}
                        </button>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Login;