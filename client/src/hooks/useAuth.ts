import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store';

/**
 * Custom hook for authentication state and actions
 */
export const useAuth = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();

    const { user, isAuthenticated, isLoginLoading, isSignupLoading } = useSelector(
        (state: RootState) => state.auth
    );

    /**
     * Require authentication - redirects to login if not authenticated
     * Returns true if authenticated, false if redirecting
     */
    const requireAuth = useCallback((): boolean => {
        if (!isAuthenticated) {
            // Store the current path to redirect back after login
            const returnUrl = encodeURIComponent(location.pathname + location.search);
            navigate(`/login?returnUrl=${returnUrl}`);
            return false;
        }
        return true;
    }, [isAuthenticated, navigate, location]);

    /**
     * Navigate to redirect URL after login, or fallback to home
     */
    const handlePostLoginRedirect = useCallback(() => {
        const searchParams = new URLSearchParams(location.search);
        const returnUrl = searchParams.get('returnUrl');
        if (returnUrl) {
            navigate(decodeURIComponent(returnUrl));
        } else {
            navigate('/');
        }
    }, [navigate, location.search]);

    return {
        user,
        isAuthenticated,
        isLoginLoading,
        isSignupLoading,
        requireAuth,
        handlePostLoginRedirect,
    };
};

export default useAuth;
