import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { checkAuth } from '../store/authSlice';

interface AuthInitializerProps {
    children: React.ReactNode;
}

/**
 * Component that ensures auth state is initialized before rendering children
 * This prevents premature redirects on page refresh
 */
export const AuthInitializer = ({ children }: AuthInitializerProps) => {
    const dispatch = useAppDispatch();
    const { isInitialized } = useAppSelector((state) => state.auth);

    useEffect(() => {
        // Only check auth if not already initialized
        if (!isInitialized) {
            dispatch(checkAuth());
        }
    }, []); // Empty dependency array - only run once on mount

    // Show loading screen while checking auth
    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-surface-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-rust-200 border-t-rust-600 rounded-full animate-spin"></div>
                    <p className="text-surface-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthInitializer;
