import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { login } from "../../store/authSlice";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoginLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  // Pre-fill email if coming from OTP verification
  useEffect(() => {
    const stateEmail = location.state?.email;
    const verifiedRole = location.state?.verifiedRole;

    if (stateEmail) {
      setFormData((prev) => ({ ...prev, email: stateEmail }));

      if (verifiedRole) {
        toast.success(
          verifiedRole === "organiser"
            ? "Email verified! Please login to access your organizer dashboard."
            : "Email verified! Please login to continue."
        );
      }
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login(formData));

    if (login.fulfilled.match(result)) {
      const user = result.payload as any;
      console.log("🔍 Login successful, user data:", user);
      console.log("🔍 User role:", user?.role);

      if (user?.role === "organiser") {
        console.log("✅ Redirecting to organizer dashboard");
        navigate("/organizer/dashboard");
      } else if (user?.role === "customer") {
        console.log("✅ Redirecting to customer dashboard");
        navigate("/customer/dashboard");
      } else {
        console.log("✅ Redirecting to home page");
        navigate("/");
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 bg-white/70 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[600px] max-w-5xl mx-auto w-full">
      {/* Left Side - Visual */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-rust-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-yellow/20 rounded-full blur-3xl translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rust-200/20 rounded-full blur-3xl -translate-x-10 translate-y-10" />
        </div>

        <div className="relative z-10">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-8">
            <Sparkles className="w-6 h-6 text-rust-500" />
          </div>
          <h2 className="text-4xl font-black text-surface-900 mb-4 tracking-tight">
            Welcome back to <span className="text-rust-600">Slotify</span>
          </h2>
          <p className="text-surface-600 text-lg leading-relaxed">
            Manage your appointments, track your schedule, and grow your
            business with our powerful tools.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3 text-surface-700 font-medium">
            <CheckCircle2 className="w-5 h-5 text-rust-500" />
            <span>Real-time availability sync</span>
          </div>
          <div className="flex items-center gap-3 text-surface-700 font-medium">
            <CheckCircle2 className="w-5 h-5 text-rust-500" />
            <span>Secure payment processing</span>
          </div>
          <div className="flex items-center gap-3 text-surface-700 font-medium">
            <CheckCircle2 className="w-5 h-5 text-rust-500" />
            <span>Automated reminders</span>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="p-8 sm:p-12 flex flex-col justify-center bg-white/40">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Sign In</h1>
          <p className="text-surface-500">
            Enter your credentials to access your account.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            startIcon={<Mail className="w-5 h-5" />}
            className="bg-white/50 focus:bg-white transition-colors"
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            startIcon={<Lock className="w-5 h-5" />}
            className="bg-white/50 focus:bg-white transition-colors"
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-surface-400 hover:text-rust-600 transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            }
          />

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-rust-600 focus:ring-rust-500 cursor-pointer"
              />
              <span className="ml-2 text-sm text-surface-600 group-hover:text-surface-900 transition-colors">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-rust-600 hover:text-rust-700 transition-colors hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg bg-rust-500 hover:bg-rust-600 shadow-lg shadow-rust-500/20 active:scale-[0.99] transition-all"
            isLoading={isLoginLoading}
          >
            <span className="mr-2">Sign in</span>
            {!isLoginLoading && <ArrowRight className="w-5 h-5" />}
          </Button>

          {error && (
            <div className="p-4 bg-red-50/50 backdrop-blur border border-red-100 rounded-xl flex items-center gap-3 animate-fade-in">
              <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}
        </form>

        <div className="mt-10 text-center">
          <p className="text-surface-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-rust-600 hover:text-rust-700 transition-colors hover:underline"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
