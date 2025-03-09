import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        currentUser: null,
        tokens: null,
        user: null,
    });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const storedTokens = JSON.parse(localStorage.getItem('tokens'));

        if (storedUser && storedTokens) {
            setAuth({
                currentUser: storedUser,
                tokens: storedTokens,
                user: storedUser,
            });
        }
    }, []);

    const login = async (email, password) => {
        try {
            const response = await api.post('auth/login', { email, password });
            console.log("Server Response:", response);

            const { accessToken, refreshToken, user } = response.data;

            setAuth({
                currentUser: user,
                tokens: { 
                    access: accessToken, 
                    refresh: refreshToken 
                },               
                user: { email },
            });

            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('tokens', JSON.stringify({ 
                access: accessToken, 
                refresh: refreshToken 
            }));

            
            return response
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Network error';
            console.error('Login error:', errorMessage);

            return { success: false, message: errorMessage };
        }
    };

    const register = async (firstName, lastName, email, role, password,location, longitude, latitude) => {
        try {
            console.log('Sending registration request:', {
                email,
                role,
                passwordLength: password.length
            });
            const response = await api.post('auth/register', { firstName, lastName, email, role, password,location, longitude, latitude });
            const { accessToken, refreshToken, user } = response.data;
            console.log(response.data)

            setAuth({
                currentUser: user,
                tokens: { 
                    access: accessToken, 
                    refresh: refreshToken 
                }
            });

            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

        

            return { success: true, message: 'Registration successful' };
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Network error';
            console.error('Registration error:', errorMessage);

            return { success: false, message: errorMessage };
        }
    };

    const refreshToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            const response = await api.post('auth/refresh-token', { refreshToken });
            const { access } = response.data;

            localStorage.setItem('access_token', access);
            setAuth((prev) => ({
                ...prev,
                tokens: { ...prev.tokens, access },
            }));

            return { success: true, message: 'Token refreshed' };
        } catch (err) {
            console.error('Token refresh error:', err.response?.data || err.message);
            logout();
            window.location.href = '/login'
            return { success: false, message: 'Failed to refresh token, please log in again' };
        }
    };

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
            window.location.href = '/sign-in'
            throw error;
        }
    };    

    const logout = () => {
        localStorage.clear();
        setAuth({
            currentUser: null,
            tokens: null,
            user: null,
        });
        window.location.href = '/';
        return { success: true, message: 'Logout successful' };
    };

    const value = {
        auth,
        login,
        register,
        logout,
        refreshToken,
        fetchCurrentUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
