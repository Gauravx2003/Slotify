import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { signup } from '../../store/authSlice';
import api from '../../store/api';
import toast from 'react-hot-toast';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Mail, Lock, User, Camera, Eye, EyeOff, ArrowRight, Sparkles, Star, Shield } from 'lucide-react';

export default function SignupCustomer() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { isSignupLoading, error } = useSelector((state: RootState) => state.auth);

    const [profileFile, setProfileFile] = useState<File | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setValidationError('Image must be less than 5MB');
                return;
            }
            setProfileFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (formData.password !== formData.confirmPassword) {
            setValidationError("Passwords don't match");
            return;
        }

        if (formData.password.length < 8) {
            setValidationError("Password must be at least 8 characters");
            return;
        }

        const { confirmPassword, ...signupData } = formData;
        // Dispatch with role 'customer'
        const result = await dispatch(signup({ ...signupData, role: 'customer' }));

        if (signup.fulfilled.match(result)) {
            if (profileFile) {
                try {
                    const formData = new FormData();
                    formData.append('profilePicture', profileFile);
                    await api.post('/user/profile-picture', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                } catch (uploadError) {
                    console.error('Failed to upload profile picture', uploadError);
                }
            }
            toast.success('Verification code sent to your email');
            navigate('/verify-otp', { state: { email: formData.email, role: 'customer' } });
        }
    };

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return { strength: 0, label: '', color: '' };
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
        return { strength, label: labels[strength], color: colors[strength] };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[600px] max-w-6xl mx-auto w-full">
            {/* Left Side - Visuals (Customer specific) */}
            <div className="hidden md:flex flex-col justify-between p-12 bg-rust-50 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-rust-200/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-accent-yellow/10 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-8">
                        <Sparkles className="w-6 h-6 text-rust-500" />
                    </div>
                    <h2 className="text-4xl font-black text-surface-900 mb-6 leading-tight">
                        Discover & Book <br /><span className="text-rust-600">Local Services</span>
                    </h2>
                    <p className="text-surface-600 text-lg leading-relaxed max-w-md">
                        Join thousands of happy customers who trust Slotify for their appointment scheduling needs. Fast, easy, and reliable.
                    </p>
                </div>

                <div className="relative z-10 mt-12 grid grid-cols-2 gap-4">
                    <div className="bg-white/60 p-4 rounded-2xl border border-white/60">
                        <Star className="w-6 h-6 text-rust-500 mb-2" />
                        <p className="font-bold text-surface-900">Top Rated</p>
                        <p className="text-sm text-surface-500">Professionals</p>
                    </div>
                    <div className="bg-white/60 p-4 rounded-2xl border border-white/60">
                        <Shield className="w-6 h-6 text-rust-500 mb-2" />
                        <p className="font-bold text-surface-900">Secure</p>
                        <p className="text-sm text-surface-500">Payments</p>
                    </div>
                </div>

                {/* Floating Image Card */}
                <div className="relative z-10 mt-auto pt-8">
                    <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-white/50">
                        <img
                            src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt="Customer Experience"
                            className="w-full h-48 object-cover object-center hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-white/50 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rust-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-rust-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-surface-900">Seamless Booking</p>
                                <p className="text-[10px] text-surface-500">Book in seconds</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="p-8 sm:p-12 flex flex-col justify-center bg-white/40 overflow-y-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-surface-900 mb-2">Create Account</h1>
                    <p className="text-surface-500">Sign up to start booking appointments</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Profile Image - Compact */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-16 h-16 rounded-full bg-white border-2 border-surface-200 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-rust-400 shadow-sm">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-6 h-6 text-surface-400 group-hover:text-rust-500 transition-colors" />
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-surface-900">Profile Photo</p>
                            <p className="text-xs text-surface-500">Optional. Max 5MB.</p>
                        </div>
                    </div>

                    <Input
                        label="Full Name"
                        type="text"
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        startIcon={<User className="w-4 h-4" />}
                        className="bg-white/50 focus:bg-white transition-colors"
                    />

                    <Input
                        label="Email Address"
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        startIcon={<Mail className="w-4 h-4" />}
                        className="bg-white/50 focus:bg-white transition-colors"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            placeholder="******"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            startIcon={<Lock className="w-4 h-4" />}
                            className="bg-white/50 focus:bg-white transition-colors"
                            endIcon={
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-surface-400 hover:text-rust-600 focus:outline-none">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                        />
                        <Input
                            label="Confirm"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            placeholder="******"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            startIcon={<Lock className="w-4 h-4" />}
                            className="bg-white/50 focus:bg-white transition-colors"
                            error={validationError || undefined}
                            endIcon={
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-surface-400 hover:text-rust-600 focus:outline-none">
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            }
                        />
                    </div>

                    {formData.password && (
                        <div className="flex gap-1 h-1 rounded-full bg-surface-100 overflow-hidden">
                            {[1, 2, 3, 4].map((level) => (
                                <div key={level} className={`flex-1 transition-colors ${level <= passwordStrength.strength ? passwordStrength.color : 'bg-transparent'}`} />
                            ))}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 text-base bg-rust-600 hover:bg-rust-700 shadow-lg shadow-rust-500/20 hover:shadow-rust-500/30 active:scale-[0.99] transition-all"
                        isLoading={isSignupLoading}
                    >
                        <span className="mr-2">Create Customer Account</span>
                        {!isSignupLoading && <ArrowRight className="w-4 h-4" />}
                    </Button>

                    {error && (
                        <div className="p-3 bg-red-50/80 border border-red-100 rounded-lg flex items-center gap-3 text-sm text-red-600">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="text-center pt-2">
                        <p className="text-surface-500 text-sm">
                            Not a customer? <Link to="/signup/organizer" className="text-rust-600 font-semibold hover:underline">Register as Organizer</Link>
                        </p>
                        <p className="text-surface-500 text-sm mt-1">
                            Already have an account? <Link to="/login" className="text-rust-600 font-semibold hover:underline">Login</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
