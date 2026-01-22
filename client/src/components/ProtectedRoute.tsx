import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../store';

interface ProtectedRouteProps {
    allowedRoles?: ('customer' | 'organiser')[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
    const { isAuthenticated, user, isInitialized } = useAppSelector((state) => state.auth);

    // Wait for auth initialization to complete
    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface-50">
                <div className="w-12 h-12 border-4 border-rust-200 border-t-rust-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Checking for user role if allowedRoles is provided
    // Note: authSlice needs to be updated to include 'role' in User interface
    if (allowedRoles && user) {
        const userRole = (user as any).role as 'customer' | 'organiser';
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
};

export default ProtectedRoute;
