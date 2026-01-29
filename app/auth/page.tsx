'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LogIn, UserPlus, Eye, EyeOff, X, CircleAlert, Loader2 } from 'lucide-react';
import MailRoundedIcon from '@mui/icons-material/MailRounded';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import { addBasePath } from 'next/dist/client/add-base-path';
import { useTheme } from 'next-themes';
import { useAuth } from '@/components/auth/auth-provider';
import { signup, formatApiError } from '@/services/auth-api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  useFormField,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function FormMessage() {
  const { error, formMessageId } = useFormField();
  const message = error ? String(error?.message ?? '') : null;

  if (!message) {
    return null;
  }

  return (
    <div id={formMessageId} className="flex gap-2 rounded-lg">
      <CircleAlert className="h-3 w-3 text-destructive mt-0.5 flex-shrink-0" />
      <p className="text-xs font-medium text-destructive">{message}</p>
    </div>
  );
}

// Schemas
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  first_name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

// Loading fallback for Suspense
function AuthPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-lg">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Inner component that uses useSearchParams
function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme, resolvedTheme } = useTheme();

  // Get redirect path from query params (set by middleware)
  const redirectPath = searchParams.get('redirect') || '/chat';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Sync dark mode state with theme
  useEffect(() => {
    setIsDarkMode(resolvedTheme === 'dark' || theme === 'dark');
  }, [theme, resolvedTheme]);

  // Redirect if already authenticated (fallback - middleware handles this too)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, authLoading, router, redirectPath]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { first_name: '', email: '', password: '' },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        router.push(redirectPath);
      } else {
        setError(formatApiError(result.error || { detail: 'Invalid email or password' }));
        setIsLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signup({
        email: data.email,
        password: data.password,
        first_name: data.first_name,
      });

      if (result.success) {
        // Signup successful - switch to login mode with success message
        setMode('login');
        setError(null);
        signupForm.reset();
        // Optionally auto-fill email in login form
        loginForm.setValue('email', data.email);
      } else {
        setError(formatApiError(result.error || { detail: 'Signup failed' }));
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError(null);
    setShowPassword(false);
    loginForm.reset();
    signupForm.reset();
  };

  // Show nothing while checking auth
  if (authLoading || isAuthenticated) {
    return null;
  }

  const isLogin = mode === 'login';

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-lg shadow-lg py-0">
        <CardHeader className="p-0">
          {/* Toggle Header */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 flex items-center justify-center gap-2 p-4 transition-colors ${
                isLogin
                  ? 'btn-border text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn size={16} />
              <span className="text-sm">Login</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 flex items-center justify-center gap-2 p-4 transition-colors ${
                !isLogin
                  ? 'btn-border text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus size={16} />
              <span className="text-sm">Sign Up</span>
            </button>
          </div>

          {/* Logo */}
          <div className="flex justify-center py-6">
            <Image
              src={isDarkMode ? addBasePath('/icons/logo-dark.svg') : addBasePath('/icons/logo.svg')}
              alt="Asset AI"
              width={0}
              height={0}
              style={{ width: 'auto', height: '48px' }}
              priority
            />
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          {/* Login Form */}
          {isLogin && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="login-email" className="data-[error=true]:text-foreground">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MailRoundedIcon sx={{ fontSize: 16 }} className="text-muted-foreground" />
                          </span>
                          <Input
                            id="login-email"
                            type="email"
                            placeholder="example@mail.com"
                            autoComplete="email"
                            className="h-10 pl-10 pr-10 auth-input transition-all"
                            {...field}
                          />
                          {field.value && (
                            <button
                              type="button"
                              onClick={() => field.onChange('')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              aria-label="Clear email"
                            >
                              <X size={14} className="text-muted-foreground hover:text-foreground" />
                            </button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="login-password" className="data-[error=true]:text-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockIcon sx={{ fontSize: 16 }} className="text-muted-foreground" />
                          </span>
                          <Input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            className="h-10 pl-10 pr-16 auth-input transition-all"
                            {...field}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center">
                            {field.value && (
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="pr-2 flex items-center"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? (
                                  <EyeOff size={16} className="text-muted-foreground hover:text-foreground" />
                                ) : (
                                  <Eye size={16} className="text-muted-foreground hover:text-foreground" />
                                )}
                              </button>
                            )}
                            {field.value && (
                              <button
                                type="button"
                                onClick={() => field.onChange('')}
                                className="pr-3 flex items-center"
                                aria-label="Clear password"
                              >
                                <X size={14} className="text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="flex gap-2 rounded-lg p-2 bg-destructive/10">
                    <CircleAlert className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-10 admin-btn text-sm font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* Signup Form */}
          {!isLogin && (
            <Form {...signupForm}>
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-6">
                <FormField
                  control={signupForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-first-name" className="data-[error=true]:text-foreground">
                        Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <PersonIcon sx={{ fontSize: 16 }} className="text-muted-foreground" />
                          </span>
                          <Input
                            id="signup-first-name"
                            type="text"
                            placeholder="Enter your name"
                            autoComplete="given-name"
                            className="h-10 pl-10 pr-10 auth-input transition-all"
                            {...field}
                          />
                          {field.value && (
                            <button
                              type="button"
                              onClick={() => field.onChange('')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              aria-label="Clear name"
                            >
                              <X size={14} className="text-muted-foreground hover:text-foreground" />
                            </button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-email" className="data-[error=true]:text-foreground">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MailRoundedIcon sx={{ fontSize: 16 }} className="text-muted-foreground" />
                          </span>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="example@mail.com"
                            autoComplete="email"
                            className="h-10 pl-10 pr-10 auth-input transition-all"
                            {...field}
                          />
                          {field.value && (
                            <button
                              type="button"
                              onClick={() => field.onChange('')}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              aria-label="Clear email"
                            >
                              <X size={14} className="text-muted-foreground hover:text-foreground" />
                            </button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signupForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="signup-password" className="data-[error=true]:text-foreground">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockIcon sx={{ fontSize: 16 }} className="text-muted-foreground" />
                          </span>
                          <Input
                            id="signup-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a password"
                            autoComplete="new-password"
                            className="h-10 pl-10 pr-16 auth-input transition-all"
                            {...field}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center">
                            {field.value && (
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="pr-2 flex items-center"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? (
                                  <EyeOff size={16} className="text-muted-foreground hover:text-foreground" />
                                ) : (
                                  <Eye size={16} className="text-muted-foreground hover:text-foreground" />
                                )}
                              </button>
                            )}
                            {field.value && (
                              <button
                                type="button"
                                onClick={() => field.onChange('')}
                                className="pr-3 flex items-center"
                                aria-label="Clear password"
                              >
                                <X size={14} className="text-muted-foreground hover:text-foreground" />
                              </button>
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="flex gap-2 rounded-lg p-2 bg-destructive/10">
                    <CircleAlert className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-destructive">{error}</p>
                  </div>
                )}

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full h-10 admin-btn text-sm font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap with Suspense for useSearchParams
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <AuthPageContent />
    </Suspense>
  );
}
