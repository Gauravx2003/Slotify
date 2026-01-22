import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

export default function AuthLayout() {
    const location = useLocation();
    // Pages that need more space (Signup flows & Login)
    const isWidePage = location.pathname.includes('/signup') || location.pathname.includes('/login');

    return (
        <div className="min-h-screen bg-rust-50/50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-surface-900">
            {/* Background decoration - Rust Theme */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-full h-full bg-gradient-to-br from-rust-500/5 via-transparent to-transparent opacity-70 blur-3xl" />
                <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-rust-400/10 blur-[120px]" />
                <div className="absolute -bottom-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-accent-yellow/10 blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent opacity-50" />
            </div>

            <div className={`z-10 transition-all duration-500 mx-auto w-full ${isWidePage ? 'max-w-7xl' : 'max-w-[480px]'}`}>
                <div className="flex justify-center mb-8">
                    <Link to="/" className="group flex items-center gap-2">
                        <div className="w-10 h-10 bg-rust-500 rounded-xl flex items-center justify-center transform -rotate-12 shadow-md group-hover:rotate-0 transition-transform duration-300">
                            <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight uppercase text-surface-900 group-hover:text-rust-600 transition-colors">
                            Slotify
                        </span>
                    </Link>
                </div>

                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`
                         backdrop-blur-xl border border-white/60 shadow-2xl relative overflow-hidden transition-all duration-500
                        ${isWidePage ? 'rounded-[2.5rem] p-0 bg-transparent border-0 shadow-none' : 'py-10 px-6 sm:px-12 rounded-3xl'}
                    `}
                >
                    {/* Only show card shine on narrow pages */}
                    {!isWidePage && (
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                    )}

                    <Outlet />
                </motion.div>

                {!isWidePage && (
                    <p className="mt-8 text-center text-sm text-surface-500 font-medium">
                        &copy; {new Date().getFullYear()} Slotify. All rights reserved.
                    </p>
                )}
            </div>
        </div>
    );
}
