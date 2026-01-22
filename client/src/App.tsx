import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AppointmentList from "./pages/AppointmentList";
import AppointmentDetails from "./pages/AppointmentDetails";
import Profile from "./pages/Profile";
import Demo from "./pages/Demo";
import Pricing from "./pages/Pricing";
import AuthLayout from "./layouts/AuthLayout";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import SignupCustomer from "./pages/auth/SignupCustomer";
import SignupOrganizer from "./pages/auth/SignupOrganizer";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyOTP from "./pages/auth/VerifyOTP";
import "./App.css";

import ProtectedRoute from "./components/ProtectedRoute";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import AppointmentForm from "./pages/organizer/AppointmentForm";
import Users from "./pages/organizer/Users";
import Resources from "./pages/organizer/Resources";
import UserDashboard from "./pages/UserDashboard";
import Reporting from "./pages/organizer/Reporting";


import HowItWorks from "./pages/HowItWorks";
import Bookings from "./pages/customer/Bookings";
import BookingDetails from "./pages/customer/BookingDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/appointments" element={<AppointmentList />} />
      <Route path="/appointments/:id" element={<AppointmentDetails />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/demo" element={<Demo />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/customer" element={<SignupCustomer />} />
          <Route path="/signup/organizer" element={<SignupOrganizer />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

      {/* Organizer Routes */}
      <Route element={<ProtectedRoute allowedRoles={["organiser"]} />}>
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
        <Route
          path="/organizer/appointments/new"
          element={<AppointmentForm />}
        />
        <Route
          path="/organizer/appointments/:id/edit"
          element={<AppointmentForm />}
        />
        <Route path="/organizer/users" element={<Users />} />
        <Route path="/organizer/resources" element={<Resources />} />
        <Route path="/organizer/reporting" element={<Reporting />} />
      </Route>

      {/* Customer Routes */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route path="/customer/dashboard" element={<UserDashboard />} />
        <Route path="/customer/bookings" element={<Bookings />} />
        <Route path="/customer/bookings/:id" element={<BookingDetails />} />
      </Route>
    </Routes>
  );
}

export default App;
