import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Sparkles, AlertCircle, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { registerSchema } from '../utils/validationSchemas';
import type { RegisterFormValues } from '../utils/validationSchemas';
import { getFirebaseErrorMessage } from '../utils/firebaseErrors';
import { Logo } from '../components/ui/Logo';

export const Register: React.FC = () => {
  const { register: signup, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false
    }
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      await signup(data.email, data.password, data.fullName);
      showToast('Registration successful! Welcome to JurisAI.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('JurisAI Register Error:', err);
      const errMsg = getFirebaseErrorMessage(err?.code || 'custom');
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      showToast('Successfully authenticated with Google.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('JurisAI Google Sign-up Error:', err);
      const errMsg = getFirebaseErrorMessage(err?.code || 'custom');
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real-time password requirement checkers
  const requirements = [
    { label: 'Minimum 8 characters', test: (val: string) => val.length >= 8 },
    { label: 'At least 1 uppercase letter', test: (val: string) => /[A-Z]/.test(val) },
    { label: 'At least 1 lowercase letter', test: (val: string) => /[a-z]/.test(val) },
    { label: 'At least 1 number', test: (val: string) => /[0-9]/.test(val) },
    { label: 'At least 1 special character', test: (val: string) => /[^A-Za-z0-9]/.test(val) }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute left-1/3 top-1/4 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute right-1/3 bottom-1/4 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />

      {/* Main Authentication Box */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-white/5 bg-[#111827]/40 p-8 backdrop-blur-md shadow-2xl glass-panel text-left space-y-6 my-8"
      >
        
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo showText={true} iconSize={40} />
          </div>
          <p className="text-xs text-slate-400">
            Create an account to scan and analyze your legal agreements.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <User size={16} />
              </span>
              <input 
                type="text"
                placeholder="Alexander Wright"
                {...register('fullName')}
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-black/20 py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none transition-all placeholder-slate-600 ${
                  errors.fullName ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/5 focus:border-primary/50'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-3xs font-semibold text-red-400 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.fullName.message}
              </p>
            )}
          </div>

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

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', {
                  onChange: (e) => setPasswordValue(e.target.value)
                })}
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-black/20 py-2.5 pl-10 pr-10 text-xs text-slate-200 outline-none transition-all placeholder-slate-600 ${
                  errors.password ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/5 focus:border-primary/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-3xs font-semibold text-red-400 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.password.message}
              </p>
            )}

            {/* Real-time Password Requirements Checklist */}
            {passwordValue && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl border border-white/5 bg-black/10 p-3 mt-2 space-y-1.5"
              >
                <div className="text-3xs font-bold text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-primary" />
                  <span>Password Requirements:</span>
                </div>
                <div className="grid grid-cols-1 gap-1 text-[10px]">
                  {requirements.map((req, index) => {
                    const isMet = req.test(passwordValue);
                    return (
                      <div key={index} className="flex items-center gap-1.5">
                        {isMet ? (
                          <Check size={10} className="text-green-400 stroke-[3]" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-slate-700" />
                        )}
                        <span className={isMet ? 'text-green-400/90 font-medium' : 'text-slate-500'}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={isSubmitting}
                className={`w-full rounded-xl border bg-black/20 py-2.5 pl-10 pr-10 text-xs text-slate-200 outline-none transition-all placeholder-slate-600 ${
                  errors.confirmPassword ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/5 focus:border-primary/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-3xs font-semibold text-red-400 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="space-y-1.5 pt-1">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                {...register('terms')}
                disabled={isSubmitting}
                className="rounded border-white/10 bg-black/20 text-primary accent-primary h-4 w-4 mt-0.5"
              />
              <span className="text-3xs font-semibold text-slate-400 leading-normal">
                I agree to the{' '}
                <a href="#terms" className="text-primary hover:underline" onClick={(e) => e.preventDefault()}>Terms of Service</a>
                {' '}and{' '}
                <a href="#privacy" className="text-primary hover:underline" onClick={(e) => e.preventDefault()}>Privacy Policy</a>.
              </span>
            </label>
            {errors.terms && (
              <p className="text-3xs font-semibold text-red-400 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.terms.message}
              </p>
            )}
          </div>

          {/* Primary Action Button */}
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <Sparkles size={14} />
              </>
            )}
          </button>

        </form>

        {/* Separator line */}
        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-3xs font-extrabold uppercase text-slate-500">or sign up with</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Google OAuth Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-white/10 bg-white/3 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
        >
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer link to Login */}
        <p className="text-center text-3xs font-medium text-slate-400">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="font-bold text-primary hover:text-indigo-400 transition-colors"
          >
            Sign In
          </Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Register;
