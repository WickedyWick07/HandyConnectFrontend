import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.API_URL|| 'http://localhost:5000',// Corrected key 'baseURL'
    headers: {
        'Content-Type': 'application/json' ,
        // Corrected 'Content Type' to 'Content-Type'
    }
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        console.log("token:", token);
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            
        }
        return config;
    },
    (error) => {
        // Handle request error (e.g., network error)
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,  // Return the response on success
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Here, you can refresh the token (if you are using refresh tokens)
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                
                if (refreshToken) {
                    // Example: send the refresh token to refresh the access token
                    const refreshResponse = await axios.post(`${import.meta.env.API_URL}/auth/refresh-token` ||'http://localhost:5000/api/auth/refresh-token' , { refreshToken });
                    
                    const { access_token } = refreshResponse.data;
                    localStorage.setItem('access_token', access_token);  // Store the new access token

                    originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
                    return axios(originalRequest);  // Retry the original request with the new token
                }
            } catch (refreshError) {
                console.error("Token refresh failed", refreshError);
                // Optionally, you can redirect the user to login if the refresh fails
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);  // Reject the error if not handled
    }
);

export default api;
