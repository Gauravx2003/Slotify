import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import api from '../../store/api';
import toast from 'react-hot-toast';


export default function VerifyOTP() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [isVerified, setIsVerified] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const hasSentOtpRef = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email || '';

    useEffect(() => {
        if (!email) {
            navigate('/signup');
            return;
        }
        sendOTP();
    }, [email]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const sendOTP = async () => {
        try {
            await api.post('/otp/send-otp', { email });
            setCountdown(60);
            toast.success('OTP sent to your email', { id: 'otp-sent' });
        } catch (error: any) {
            console.error('Failed to send OTP on mount', error);
            // Optional: toast error if it's not a "just created" race condition
        }
    };

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split('').forEach((char, idx) => {
            if (idx < 6) newOtp[idx] = char;
        });
        setOtp(newOtp);

        const lastIndex = Math.min(pastedData.length - 1, 5);
        inputRefs.current[lastIndex]?.focus();
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast.error('Please enter the complete OTP');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/otp/verify-otp', { email, otp: otpString });
            setIsVerified(true);
            toast.success('Email verified successfully!');
            
            const userRole = response.data?.user?.role || location.state?.role;
            setTimeout(() => navigate('/login', { state: { email, verifiedRole: userRole } }), 2000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        setIsResending(true);
        try {
            await api.post('/otp/resend-otp', { email });
            setCountdown(60);
            toast.success('OTP resent successfully', { id: 'otp-resent' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setIsResending(false);
        }
    };

    if (isVerified) {
        return (
            <div className="-my-10 -mx-6 sm:-mx-12 min-h-[400px] flex items-center justify-center p-8 bg-white/50">
                <div className="text-center w-full animate-fade-in">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 mb-6 shadow-sm border border-emerald-200 animate-bounce">
                        <CheckCircle className="h-12 w-12 text-emerald-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-surface-900 mb-2">Verified!</h3>
                    <p className="text-surface-600 mb-8 text-lg">
                        Redirecting to login...
                    </p>
                     <div className="w-48 mx-auto h-1.5 bg-surface-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out] w-full origin-left"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="-my-10 -mx-6 sm:-mx-12 bg-white/60 p-8 sm:p-12 relative h-full flex flex-col justify-center">
            {/* Background blobs for internal depth */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-rust-200/40 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10"></div>
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-yellow/30 rounded-full blur-3xl -z-10 -translate-x-10 translate-y-10"></div>

            <div className="mb-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md border border-rust-100 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <ShieldCheck className="h-8 w-8 text-rust-600" />
                </div>
                <h1 className="text-3xl font-black text-surface-900 mb-3 tracking-tight">
                    Verify Email
                </h1>
                <p className="text-surface-600 text-lg leading-relaxed">
                    We've sent a code to <br />
                    <span className="font-bold text-surface-900 bg-white/50 px-2 py-0.5 rounded-lg border border-surface-200/50 inline-block mt-1">{email}</span>
                </p>
            </div>

            <div className="space-y-8">
                <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-3xl font-bold bg-white border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-rust-500/10 transition-all shadow-sm
                                ${digit 
                                    ? 'border-rust-500 text-rust-600 scale-105 shadow-md shadow-rust-500/10' 
                                    : 'border-surface-200/80 text-surface-900 hover:border-surface-300 focus:border-rust-500'}
                            `}
                        />
                    ))}
                </div>

                <Button
                    onClick={handleVerify}
                    className="w-full h-14 text-lg font-bold bg-rust-600 hover:bg-rust-700 shadow-xl shadow-rust-500/20 hover:shadow-rust-500/30 active:scale-[0.99] transition-all rounded-xl"
                    isLoading={isLoading}
                    disabled={otp.some(d => !d)}
                >
                    Verify Account
                </Button>

                <div className="text-center pt-2">
                    <p className="text-surface-500 mb-6 font-medium">
                        Didn't receive code?{' '}
                        {countdown > 0 ? (
                            <span className="text-rust-600 font-bold tabular-nums">
                                {countdown}s
                            </span>
                        ) : (
                            <button
                                onClick={handleResend}
                                disabled={isResending}
                                className="font-bold text-rust-600 hover:text-rust-700 hover:underline transition-colors"
                            >
                                {isResending ? 'Sending...' : 'Resend Code'}
                            </button>
                        )}
                    </p>
                </div>

                    <Link
                        to="/signup"
                        className="inline-flex items-center text-sm font-bold text-surface-400 hover:text-surface-600 transition-colors group px-4 py-2 rounded-xl hover:bg-surface-100/50"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Signup
                    </Link>
            </div>
            </div>
    );
}

