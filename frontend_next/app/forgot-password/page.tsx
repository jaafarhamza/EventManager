'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/api/error-handler';
import { Input, Label, Button } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');

    if (!email) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.forgotPassword({ email });
      setIsSuccess(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--color-tertiary)/10 mb-4">
              <svg
                className="w-8 h-8 text-(--color-tertiary)"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-2">
              Check Your Email
            </h1>
            <p className="text-(--color-muted-foreground) mb-6">
              We&apos;ve sent a password reset code to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-8 shadow-lg">
            <div className="space-y-4 text-sm text-(--color-muted-foreground)">
              <p>Please check your email inbox and follow these steps:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Open the email from EventHub</li>
                <li>Copy the 6-digit verification code</li>
                <li>Click the button below to reset your password</li>
              </ol>
              <p className="text-xs">
                Didn&apos;t receive the email? Check your spam folder or try again in a few minutes.
              </p>
            </div>

            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium bg-(--color-primary) text-(--color-destructive) hover:opacity-90 transition-all duration-200"
            >
              Continue to Reset Password
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-(--color-muted-foreground)">
            Remember your password?{' '}
            <Link
              href="/login"
              className="font-medium text-(--color-primary) hover:underline"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-(--color-primary) to-(--color-tertiary) mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) mb-2">
            Forgot Password?
          </h1>
          <p className="text-(--color-muted-foreground)">
            No worries, we&apos;ll send you reset instructions
          </p>
        </div>

        <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-8 shadow-lg">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-(--color-destructive)/10 border border-(--color-destructive)/20">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-(--color-destructive) shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-(--color-destructive)">
                  {error}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-(--color-muted-foreground)"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Code'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-(--color-muted-foreground)">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-medium text-(--color-primary) hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
