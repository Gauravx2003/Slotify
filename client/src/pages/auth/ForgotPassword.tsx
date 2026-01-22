import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { Mail, ArrowLeft, KeyRound } from "lucide-react";
import api from "../../store/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/otp/forget-password", {
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setIsSent(true);
      toast.success("Reset link sent to your email");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 rounded-[2rem] shadow-2xl max-w-md w-full mx-auto text-center animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rust-400 to-rust-600"></div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rust-100 mb-6 group transition-all duration-500 hover:scale-110">
          <Mail className="h-8 w-8 text-rust-600 group-hover:text-rust-700 transition-colors" />
        </div>
        <h3 className="text-2xl font-bold text-surface-900 mb-2">
          Check your email
        </h3>
        <p className="text-surface-600 mb-8 leading-relaxed">
          We sent a password reset link to <br />
          <span className="font-bold text-surface-900">{email}</span>
        </p>
        <div className="space-y-4">
          <Button
            onClick={() => setIsSent(false)}
            className="w-full bg-white/60 text-surface-900 border border-surface-200 hover:bg-white hover:border-rust-200 hover:text-rust-600 shadow-sm transition-all"
          >
            Try another email
          </Button>
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

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/60 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-auto relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-32 h-32 bg-rust-100 rounded-full blur-3xl -z-10 translate-x-10 -translate-y-10 opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-yellow/20 rounded-full blur-3xl -z-10 -translate-x-10 translate-y-10 opacity-60"></div>

      <div className="text-center mb-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rust-50 mb-4 shadow-sm border border-rust-100">
          <KeyRound className="h-6 w-6 text-rust-600" />
        </div>
        <h3 className="text-2xl font-bold text-surface-900 mb-2">
          Forgot password?
        </h3>
        <p className="text-surface-500">
          No worries! Enter your email and we'll send you reset instructions.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Email address"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          startIcon={<Mail className="w-4 h-4" />}
          className="bg-white/50 focus:bg-white transition-colors"
        />

        <Button
          type="submit"
          className="w-full h-11 text-base bg-rust-600 hover:bg-rust-700 shadow-lg shadow-rust-500/20 hover:shadow-rust-500/30 active:scale-[0.99] transition-all"
          isLoading={isLoading}
        >
          Send Reset Link
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
