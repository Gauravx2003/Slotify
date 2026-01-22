import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "./api";
import { toast } from "react-hot-toast";

interface User {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'organiser' | 'admin';
    image?: string | null;
    phone?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoginLoading: boolean;
  isSignupLoading: boolean;
  isInitialized: boolean; // Track if initial session check is done
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoginLoading: true, // Start as true to wait for initial session check
  isSignupLoading: false,
  isInitialized: false, // Not initialized yet
  error: null,
};

// Async Thunks - Using Better Auth endpoints
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/get-session");
      if (response.data?.user) {
        return response.data.user;
      }
      return rejectWithValue("No session");
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to authenticate"
      );
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/auth/sign-in/email", credentials);
      console.log("🔍 Better Auth login response:", response.data);
      console.log("🔍 User from response:", response.data.user);
      toast.success("Welcome back!");
      return response.data.user;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const signup = createAsyncThunk(
  "auth/signup",
  async (
    data: {
      name: string;
      email: string;
      password: string;
      role: "customer" | "organiser";
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post("/auth/sign-up/email", data);
      // Better Auth returns user on signup
      return response.data.user;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Signup failed");
      return rejectWithValue(error.response?.data?.message || "Signup failed");
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/sign-out");
      toast.success("Logged out successfully");
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Logout failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Check Auth
    builder
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User>) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.isLoginLoading = false;
        state.isInitialized = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.isLoginLoading = false;
        state.isInitialized = true;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoginLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoginLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoginLoading = false;
        state.error = action.payload as string;
      });

    // Signup
    builder
      .addCase(signup.pending, (state) => {
        state.isSignupLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.isSignupLoading = false;
        state.isAuthenticated = false; // Don't login yet
        state.user = null; // Don't set user yet
      })
      .addCase(signup.rejected, (state, action) => {
        state.isSignupLoading = false;
        state.error = action.payload as string;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
