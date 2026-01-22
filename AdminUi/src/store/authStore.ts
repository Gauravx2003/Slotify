import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'organiser' | 'admin';
  image?: string | null;
  emailVerified?: boolean;
  isActive?: boolean;
  phone?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance for auth
const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          // Call the Better Auth sign-in endpoint
          const response = await authApi.post('/auth/sign-in/email', {
            email,
            password,
          });

          console.log('Login response:', response.data);

          // Better Auth returns { user, session } directly (not wrapped in data)
          const responseData = response.data;
          
          // Check for user in different possible locations
          const userData = responseData.user || responseData.data?.user;
          const sessionData = responseData.session || responseData.data?.session;
          const tokenData = sessionData?.token || responseData.token || responseData.data?.token;
          
          if (userData) {
            // Store the token for API requests
            if (tokenData) {
              localStorage.setItem('admin_token', tokenData);
              axios.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`;
              authApi.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`;
            }

            const user: User = {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              image: userData.image,
              emailVerified: userData.emailVerified,
              isActive: userData.isActive,
              phone: userData.phone,
            };

            console.log('User data:', user);
            console.log('User role:', user.role);

            set({
              user,
              token: tokenData || 'session-cookie',
              isAuthenticated: true,
              isLoading: false,
            });

            return { success: true, message: 'Login successful' };
          }

          return { success: false, message: 'Invalid response from server' };
        } catch (error: any) {
          console.error('Login error:', error.response?.data || error);
          
          const errorMessage = error.response?.data?.message || 
                              error.response?.data?.error?.message || 
                              error.response?.data?.error ||
                              'Invalid credentials';
          
          return { 
            success: false, 
            message: typeof errorMessage === 'string' ? errorMessage : 'Invalid credentials'
          };
        }
      },

      logout: async () => {
        try {
          const token = localStorage.getItem('admin_token');
          if (token) {
            authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
          // Call logout endpoint
          await authApi.post('/auth/sign-out');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          // Clear local state regardless
          localStorage.removeItem('admin_token');
          delete axios.defaults.headers.common['Authorization'];
          delete authApi.defaults.headers.common['Authorization'];
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('admin_token');
        const currentState = get();
        
        // If we have cached user data from zustand persist, validate it
        if (currentState.user && currentState.isAuthenticated) {
          set({ isLoading: false });
          
          // Set the token in axios headers
          if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
          return;
        }
        
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          authApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        try {
          // Try to get current session
          const response = await authApi.get('/auth/get-session');
          
          console.log('Check auth response:', response.data);
          
          // Better Auth returns { user, session } directly
          const userData = response.data?.user || response.data?.data?.user;
          
          if (userData) {
            const user: User = {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              image: userData.image,
              emailVerified: userData.emailVerified,
              isActive: userData.isActive,
              phone: userData.phone,
            };

            set({
              user,
              token: token || 'session-cookie',
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
          
          // No valid session - clear state
          localStorage.removeItem('admin_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Auth check error:', error);
          // Clear any stored tokens on error
          localStorage.removeItem('admin_token');
          delete axios.defaults.headers.common['Authorization'];
          delete authApi.defaults.headers.common['Authorization'];
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useAuthStore;
