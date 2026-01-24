import { create } from 'zustand';
import apiClient from './auth-client';

interface MentorUser {
    _id: string;
    name: string;
    org_email: string;
    org_phone_number: string;
}

interface AuthStore {
    user: MentorUser | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    isLoading: true,

    login: async (email: string, password: string) => {
        try {
            const response = await apiClient.post('/mentor-auth/login', { email, password });
            const { accessToken, refreshToken, mentor } = response.data;

            localStorage.setItem('mentorAccessToken', accessToken);
            localStorage.setItem('mentorRefreshToken', refreshToken);
            set({ user: mentor, isLoading: false });
        } catch (error: any) {
            console.error('Login error:', error.response?.data || error.message);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('mentorAccessToken');
        localStorage.removeItem('mentorRefreshToken');
        set({ user: null, isLoading: false });
    },


    initialize: async () => {
        try {
            if (typeof window === 'undefined') return;

            const token = localStorage.getItem('mentorAccessToken');

            if (!token) {
                set({ user: null, isLoading: false });
                return;
            }

            try {
                const response = await apiClient.get('/mentor-auth/profile');

                set({
                    user: response.data.mentor,
                    isLoading: false,
                });
            } catch (profileError: any) {
                // Log detailed error info
                console.error('Profile fetch error details:', {
                    status: profileError.response?.status,
                    data: profileError.response?.data,
                    message: profileError.message,
                });

                // If we get a 404, the mentor might not exist in DB
                // But we still have a valid token, so don't fully logout
                if (profileError.response?.status === 404) {
                    console.warn('⚠️ Mentor profile not found (404). Token may be invalid or mentor deleted.');
                    // Try to refresh token instead of immediately logging out
                    try {
                        const refreshToken = localStorage.getItem('mentorRefreshToken');
                        if (refreshToken) {
                            console.log('Attempting to refresh token...');
                            // Token might be expired, try refresh
                            return; // Will keep trying on next load
                        }
                    } catch (refreshErr) {
                        console.error('Token refresh failed:', refreshErr);
                    }
                    // If refresh fails or no refresh token, logout
                    localStorage.removeItem('mentorAccessToken');
                    localStorage.removeItem('mentorRefreshToken');
                    set({ user: null, isLoading: false });
                } else if (profileError.response?.status === 401) {
                    // Unauthorized - token is invalid
                    console.warn('Token is unauthorized (401), clearing...');
                    localStorage.removeItem('mentorAccessToken');
                    localStorage.removeItem('mentorRefreshToken');
                    set({ user: null, isLoading: false });
                } else {
                    // Network or other errors
                    console.error('Unexpected error during profile fetch');
                    localStorage.removeItem('mentorAccessToken');
                    localStorage.removeItem('mentorRefreshToken');
                    set({ user: null, isLoading: false });
                }
            }
        } catch (error) {
            console.error(
                'Initialize error:',
                error instanceof Error ? error.message : error
            );

            set({
                isLoading: false,
            });
        }
    },
}));