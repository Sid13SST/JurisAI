import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address')
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required (minimum 2 characters)').max(100, 'Name is too long'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((val) => /[A-Z]/.test(val), { message: 'Must contain at least 1 uppercase letter' })
    .refine((val) => /[a-z]/.test(val), { message: 'Must contain at least 1 lowercase letter' })
    .refine((val) => /[0-9]/.test(val), { message: 'Must contain at least 1 number' })
    .refine((val) => /[^A-Za-z0-9]/.test(val), { message: 'Must contain at least 1 special character' }),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  terms: z.boolean().refine((val) => val === true, { message: 'You must accept the terms and conditions' })
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export default registerSchema;
