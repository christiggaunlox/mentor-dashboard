import axios from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('mentorAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // List of public endpoints that don't require token refresh logic
    const publicAuthEndpoints = [
      '/mentor-auth/login',
      '/mentor-auth/register',
      '/mentor-auth/forgot-password',
      '/mentor-auth/verify-otp',
      '/mentor-auth/reset-password',
    ];

    // Check if this is a public endpoint - if so, don't retry refresh
    const isPublicEndpoint = publicAuthEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint)
    );

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('mentorRefreshToken');

      // If no refresh token exists, user is not authenticated - don't attempt refresh
      if (!refreshToken) {
        localStorage.removeItem('mentorAccessToken');
        localStorage.removeItem('mentorRefreshToken');
        // Only redirect if we're not already on a public page
        if (typeof window !== 'undefined' && !['/login', '/forgot-password', '/otp', '/reset-password', '/'].includes(window.location.pathname)) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/mentor-auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('mentorAccessToken', accessToken);
        localStorage.setItem('mentorRefreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('mentorAccessToken');
        localStorage.removeItem('mentorRefreshToken');
        // Only redirect if we're not already on a public page
        if (typeof window !== 'undefined' && !['/login', '/forgot-password', '/otp', '/reset-password', '/'].includes(window.location.pathname)) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 404 errors - treat them as unauthenticated
    if (error.response?.status === 404 && !originalRequest._retry) {
      // Don't retry 404s, just reject them
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiClient;