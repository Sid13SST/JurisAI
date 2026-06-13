import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { forgotPasswordSchema } from '../utils/validationSchemas';
import type { ForgotPasswordFormValues } from '../utils/validationSchemas';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { Logo } from '../components/ui/Logo';

export const ForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await resetPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSent(true);
      setCountdown(60); // 60 second cooldown for resending
      showToast('Password reset link sent! Check your inbox.', 'success');
    } catch (err: any) {
      console.error('JurisAI Forgot Password Error:', err);
      const errMsg = getFirebaseErrorMessage(err?.code || 'custom');
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !submittedEmail) return;
    setIsSubmitting(true);
    try {
      await resetPassword(submittedEmail);
      setCountdown(60);
      showToast('A new reset link has been sent to your email.', 'success');
    } catch (err: any) {
      console.error('JurisAI Resend Forgot Password Error:', err);
      const errMsg = getFirebaseErrorMessage(err?.code || 'custom');
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute left-1/3 top-1/4 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-1/3 bottom-1/4 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-white/5 bg-[#111827]/40 p-8 backdrop-blur-md shadow-2xl glass-panel text-left space-y-6"
      >
        
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo showText={true} iconSize={40} />
          </div>
          <h2 className="text-sm font-bold tracking-tight text-slate-200">
            {isSent ? 'Check Your Email' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
            {isSent 
              ? `We have sent a secure password reset link to ${submittedEmail}` 
              : "Enter your email address and we'll send you a recovery link."}
          </p>
        </div>

        {/* Success / Input states */}
        {!isSent ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input 
                  type="email"
                  placeholder="name@company.com"
                  {...register('email')}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border bg-black/20 py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none transition-all placeholder-slate-600 ${
                    errors.email ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/5 focus:border-primary/50'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-3xs font-semibold text-red-400 flex items-center gap-1">
                  <AlertCircle size={10} /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-primary to-secondary py-2.5 text-xs font-semibold text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Sending reset link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

          </form>
        ) : (
          <div className="space-y-4">
            
            {/* Visual Confirmation Banner */}
            <div className="rounded-xl border border-green-500/10 bg-green-500/5 p-4 flex items-start gap-3">
              <CheckCircle className="text-green-400 h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-3xs font-bold text-green-400 uppercase tracking-wider">Link Sent Successfully</p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Please check your spam or promotions folders if you don't receive it within a few minutes.
                </p>
              </div>
            </div>

            {/* Resend Cooldown Option */}
            <button 
              onClick={handleResend}
              disabled={isSubmitting || countdown > 0}
              className="w-full rounded-xl border border-white/10 bg-white/3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={isSubmitting ? 'animate-spin' : ''} />
              <span>
                {countdown > 0 ? `Resend Link (${countdown}s)` : 'Resend Link'}
              </span>
            </button>

          </div>
        )}

        {/* Footer Link to return to login */}
        <div className="text-center pt-2">
          <Link 
            to="/login" 
            className="inline-flex items-center gap-1.5 text-3xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={12} />
            <span>Back to Sign In</span>
          </Link>
        </div>

      </motion.div>
    </div>
  );
};

export default ForgotPassword;
