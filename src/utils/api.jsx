import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        console.log("token:", token);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                
                if (refreshToken) {
                    // Fix the URL construction here
                    const refreshUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh-token`;
                    const refreshResponse = await axios.post(refreshUrl, { refreshToken });
                    
                    const { access_token } = refreshResponse.data;
                    localStorage.setItem('access_token', access_token);
                    
                    originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                    return axios(originalRequest);
                }
            } catch (refreshError) {
                console.error("Token refresh failed", refreshError);
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;