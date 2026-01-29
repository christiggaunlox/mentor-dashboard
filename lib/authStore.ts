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
            const errorMessage = error?.response?.data?.message || error?.message || 'Login failed. Please try again.';
            // Create a new error with the message for proper error handling
            const customError = new Error(errorMessage);
            throw customError;
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
                // If we get a 404, the mentor doesn't exist or token is invalid
                if (profileError.response?.status === 404) {
                    console.warn('⚠️ Mentor profile not found (404). Clearing authentication.');
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
                    // Network or other errors - just logout silently
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