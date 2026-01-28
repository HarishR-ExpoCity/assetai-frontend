'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LogIn, Eye, EyeOff, X, CircleAlert, Loader2 } from 'lucide-react';
import MailRoundedIcon from '@mui/icons-material/MailRounded';
import LockIcon from '@mui/icons-material/Lock';
import { addBasePath } from 'next/dist/client/add-base-path';
import { useAuth } from './auth-provider';

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

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLoginError(null);

    // Add small delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const success = login(data.email, data.password);

      if (success) {
        router.push('/chat');
      } else {
        setLoginError('Invalid email or password');
        setIsLoading(false);
      }
    } catch {
      setLoginError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-lg shadow-lg py-0">
        <CardHeader className="p-0">
          <div className="flex items-center gap-2 border-b p-4">
            <LogIn size={16} />
            <span className="text-base font-medium">Login</span>
          </div>
          <div className="flex justify-center py-6">
            <Image
              src={addBasePath('/icons/logo.svg')}
              alt="Asset AI"
              width={0}
              height={0}
              style={{ width: 'auto', height: '48px' }}
              priority
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email" className="data-[error=true]:text-foreground">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <MailRoundedIcon sx={{ fontSize: 16 }} className="text-muted-foreground" />
                        </span>
                        <Input
                          id="email"
                          type="text"
                          placeholder="example@mail.com"
                          autoComplete="email"
                          className="h-10 pl-10 pr-10 transition-all"
                          {...field}
                        />
                        {field.value && (
                          <button
                            type="button"
                            onClick={() => field.onChange('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            aria-label="Clear email"
                          >
                            <X
                              size={14}
                              className="text-muted-foreground hover:text-foreground"
                            />
                          </button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="password" className="data-[error=true]:text-foreground">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockIcon sx={{ fontSize: 16 }} className="text-muted-foreground" />
                        </span>
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          autoComplete="current-password"
                          className="h-10 pl-10 pr-16 transition-all"
                          {...field}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                          {field.value && (
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="pr-2 flex items-center"
                              aria-label={
                                showPassword ? 'Hide password' : 'Show password'
                              }
                            >
                              {showPassword ? (
                                <EyeOff
                                  size={16}
                                  className="text-muted-foreground hover:text-foreground"
                                />
                              ) : (
                                <Eye
                                  size={16}
                                  className="text-muted-foreground hover:text-foreground"
                                />
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
                              <X
                                size={14}
                                className="text-muted-foreground hover:text-foreground"
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {loginError && (
                <div className="flex gap-2 rounded-lg p-2 bg-destructive/10">
                  <CircleAlert className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-destructive">{loginError}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}
