'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import FlowerLogo from '@/components/FlowerLogo';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Store login timestamp for session timeout (60 minutes)
        localStorage.setItem('loginTimestamp', Date.now().toString());
        // Redirect to dashboard
        router.push('/');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="flex flex-1 items-stretch">
        <div className="flex w-full flex-wrap">
          {/* Left Side - Image/Illustration */}
          <div
            className="hidden lg:flex w-1/2 items-center justify-center p-8"
            style={{ backgroundColor: 'rgba(0, 168, 89, 0.05)' }}
          >
            <div
              className="w-full h-full bg-center bg-no-repeat bg-cover rounded-lg"
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDOroQuR1vwpIkATaLkHo9VaVpWz3x6Y7CD9T8qwCWS4cHBfv8WesWHDYrsTnj4pAXqDAuxyYyVQKc5KGqY3JID7sJKad9Sq9XiFKLY4AdPw7b-VwaGDQMrJF2kwIcudjnaU0FiGAdNpszIGlmNHybASIZxUv1Q1lAB-FEuvJEKhqKXPsmTWt2yItcvwNqTLFa92GuaMxP9P4t5Fybmoly1xWqhT-ErnesWs-dRbAkUv0qdGT19HguMwdDnAZv_IjiOe7bUdJR4un2N")',
                minHeight: '500px'
              }}
            ></div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
              {/* Logo/Brand */}
              <div className="flex justify-center">
                <div className="w-48 h-20">
                  <FlowerLogo className="w-full h-full" />
                </div>
              </div>

              {/* Welcome Text */}
              <div className="flex flex-col gap-3">
                <p
                  className="text-4xl font-black leading-tight tracking-tight"
                  style={{ color: '#1B1B6F' }}
                >
                  Welcome Back!
                </p>
                <p
                  className="text-base font-normal leading-normal"
                  style={{ color: '#6B7280' }}
                >
                  Sign in to continue to your dashboard.
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {/* Error Message */}
                {error && (
                  <div
                    className="p-4 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Email Field */}
                  <label className="flex flex-col flex-1">
                    <p
                      className="text-sm font-medium leading-normal pb-2"
                      style={{ color: '#1B1B6F' }}
                    >
                      Username or Email
                    </p>
                    <div className="relative flex w-full flex-1 items-stretch">
                      <div
                        className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                        style={{ color: '#6B7280' }}
                      >
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="flex w-full min-w-0 flex-1 rounded-lg border border-gray-300 h-14 pl-10 pr-3 py-3.5 text-base font-normal leading-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1B1B6F',
                        }}
                        placeholder="Enter your username or email"
                        required
                      />
                    </div>
                  </label>

                  {/* Password Field */}
                  <label className="flex flex-col flex-1">
                    <p
                      className="text-sm font-medium leading-normal pb-2"
                      style={{ color: '#1B1B6F' }}
                    >
                      Password
                    </p>
                    <div className="relative flex w-full flex-1 items-stretch">
                      <div
                        className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                        style={{ color: '#6B7280' }}
                      >
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="flex w-full min-w-0 flex-1 rounded-lg border border-gray-300 h-14 pl-10 pr-10 py-3.5 text-base font-normal leading-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1B1B6F',
                        }}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 group"
                        style={{ color: '#6B7280' }}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </label>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 transition"
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm"
                      style={{ color: '#6B7280' }}
                    >
                      Remember Me
                    </label>
                  </div>
                  <div className="text-sm">
                    <a
                      href="#"
                      className="font-medium hover:opacity-80 transition-opacity"
                      style={{ color: 'var(--accent)' }}
                    >
                      Forgot Password?
                    </a>
                  </div>
                </div>

                {/* Sign In Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-lg border border-transparent px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--accent)',
                      focusRing: 'var(--accent)'
                    }}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                </div>
              </form>

              {/* Sign Up Link */}
              <p
                className="text-center text-sm"
                style={{ color: '#6B7280' }}
              >
                Don't have an account?{' '}
                <a
                  href="#"
                  className="font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--accent)' }}
                >
                  Sign Up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
