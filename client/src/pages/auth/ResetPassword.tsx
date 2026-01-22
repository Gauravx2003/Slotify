import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Lock, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../../store/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (!token) {
            toast.error("Invalid reset token");
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/otp/reset-password', {
                token,
                newPassword: formData.password,
            });
            toast.success('Password reset successfully');
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] shadow-2xl max-w-md w-full mx-auto text-center animate-fade-in">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
                    <Lock className="h-8 w-8 text-red-600" />
                </div>
                <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-6 font-medium">
                    Invalid or missing reset token.
                </div>
                <Link to="/forgot-password" className="text-rust-600 font-bold hover:underline hover:text-rust-700 transition-colors">
                    Request a new link
                </Link>
            </div>
        )
    }

    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-auto relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rust-100 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10 opacity-60"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-yellow/20 rounded-full blur-3xl -z-10 -translate-x-10 translate-y-10 opacity-60"></div>

            <div className="text-center mb-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rust-50 mb-4 shadow-sm border border-rust-100">
                    <ShieldCheck className="h-6 w-6 text-rust-600" />
                </div>
                <h3 className="text-2xl font-bold text-surface-900 mb-2">Reset Password</h3>
                <p className="text-surface-500">
                    Enter your new password below to secure your account.
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
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
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    startIcon={<Lock className="w-4 h-4" />}
                    className="bg-white/50 focus:bg-white transition-colors"
                    endIcon={
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-surface-400 hover:text-rust-600 focus:outline-none">
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    }
                />

                <Button
                    type="submit"
                    className="w-full h-11 text-base bg-rust-600 hover:bg-rust-700 shadow-lg shadow-rust-500/20 hover:shadow-rust-500/30 active:scale-[0.99] transition-all"
                    isLoading={isLoading}
                >
                    Reset Password
                </Button>
            </form>

            <div className="mt-8 text-center border-t border-surface-200/60 pt-6">
                <Link
                    to="/login"
                    className="flex items-center justify-center text-sm font-semibold text-surface-500 hover:text-rust-600 transition-colors gap-2 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to login
                </Link>
            </div>
        </div>
    );
}
