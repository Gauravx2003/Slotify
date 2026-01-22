import { Link } from 'react-router-dom';
import { User, Briefcase, ArrowRight, Sparkles } from 'lucide-react';

export default function Signup() {
    return (
        <div className="flex flex-col items-center justify-center p-4 animate-fade-in w-full">
            <div className="bg-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-2xl w-full max-w-5xl">

                <div className="text-center mb-12">
                    <div className="w-12 h-12 bg-rust-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-6 h-6 text-rust-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-surface-900 mb-4 tracking-tight">
                        Join Our <span className="text-rust-600">Community</span>
                    </h1>
                    <p className="text-surface-600 text-lg md:text-xl font-medium max-w-xl mx-auto">
                        Choose how you want to use Slotify. Whether you're booking or organizing, we have the perfect tools for you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Customer Selection Card */}
                    <Link
                        to="/signup/customer"
                        className="group relative bg-surface-50 border border-transparent hover:border-rust-200 rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:bg-white overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-40 h-40 bg-rust-100 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex flex-col h-full justify-between items-start relative z-10">
                            <div className="p-4 bg-white rounded-2xl text-rust-600 shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300 border border-surface-100">
                                <User className="w-8 h-8" />
                            </div>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-surface-900 mb-2">I am a Customer</h2>
                                <p className="text-surface-600 font-medium leading-relaxed">
                                    Book appointments, discover local services, and manage your schedule with ease.
                                </p>
                            </div>

                            <div className="flex items-center text-surface-900 group-hover:text-rust-600 font-bold group-hover:gap-2 transition-all">
                                <span>Continue as Customer</span>
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </div>
                        </div>
                    </Link>

                    {/* Organizer Selection Card */}
                    <Link
                        to="/signup/organizer"
                        className="group relative bg-surface-50 border border-transparent hover:border-rust-200 rounded-3xl p-8 transition-all duration-300 hover:shadow-xl hover:bg-white overflow-hidden"
                    >
                        <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent-yellow/20 rounded-full blur-3xl -z-10 -translate-x-10 translate-y-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex flex-col h-full justify-between items-start relative z-10">
                            <div className="p-4 bg-white rounded-2xl text-rust-600 shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300 border border-surface-100">
                                <Briefcase className="w-8 h-8" />
                            </div>

                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-surface-900 mb-2">I am an Organizer</h2>
                                <p className="text-surface-600 font-medium leading-relaxed">
                                    List your services, manage bookings, and grow your business efficiently.
                                </p>
                            </div>

                            <div className="flex items-center text-surface-900 group-hover:text-rust-600 font-bold group-hover:gap-2 transition-all">
                                <span>Continue as Organizer</span>
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="mt-12 text-center text-surface-500 font-medium">
                    Already have an account? <Link to="/login" className="text-rust-600 font-bold hover:underline">Log in</Link>
                </div>
            </div>
        </div>
    );
}
