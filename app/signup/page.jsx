'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, Eye, EyeOff, Building2, MapPin } from 'lucide-react';
import FlowerLogo from '@/components/FlowerLogo';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    department: '',
    location: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email.toLowerCase(),
          username: formData.username.toLowerCase(),
          password: formData.password,
          department: formData.department,
          location: formData.location,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative flex h-auto min-h-screen w-full flex-col" style={{ backgroundColor: '#f5f5f5' }}>
        <div className="flex flex-1 items-center justify-center py-12 px-4">
          <div className="w-full max-w-md space-y-8 text-center">
            <div className="flex justify-center">
              <div className="w-48 h-20">
                <FlowerLogo className="w-full h-full" />
              </div>
            </div>
            <div
              className="p-8 rounded-lg"
              style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <svg className="w-8 h-8" style={{ color: '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1B1B6F' }}>
                Account Created Successfully!
              </h2>
              <p className="text-base mb-6" style={{ color: '#6B7280' }}>
                Your account has been created and is pending admin approval. You will receive an email notification once your account is approved.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full rounded-lg px-4 py-3 text-base font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Right Side - Signup Form */}
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
                  Create Account
                </p>
                <p
                  className="text-base font-normal leading-normal"
                  style={{ color: '#6B7280' }}
                >
                  Sign up to get started with Autoclik.
                </p>
              </div>

              {/* Signup Form */}
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
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col flex-1">
                      <p
                        className="text-sm font-medium leading-normal pb-2"
                        style={{ color: '#1B1B6F' }}
                      >
                        First Name
                      </p>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="flex w-full rounded-lg border border-gray-300 h-12 px-3 py-2 text-base font-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1B1B6F',
                        }}
                        placeholder="John"
                        required
                      />
                    </label>

                    <label className="flex flex-col flex-1">
                      <p
                        className="text-sm font-medium leading-normal pb-2"
                        style={{ color: '#1B1B6F' }}
                      >
                        Last Name
                      </p>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="flex w-full rounded-lg border border-gray-300 h-12 px-3 py-2 text-base font-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1B1B6F',
                        }}
                        placeholder="Doe"
                        required
                      />
                    </label>
                  </div>

                  {/* Email Field */}
                  <label className="flex flex-col flex-1">
                    <p
                      className="text-sm font-medium leading-normal pb-2"
                      style={{ color: '#1B1B6F' }}
                    >
                      Email Address
                    </p>
                    <div className="relative flex w-full flex-1 items-stretch">
                      <div
                        className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                        style={{ color: '#6B7280' }}
                      >
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                        className="flex w-full min-w-0 flex-1 rounded-lg border border-gray-300 h-12 pl-10 pr-3 py-2 text-base font-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1B1B6F',
                        }}
                        placeholder="john.doe@company.com"
                        required
                      />
                    </div>
                  </label>

                  {/* Username Field */}
                  <label className="flex flex-col flex-1">
                    <p
                      className="text-sm font-medium leading-normal pb-2"
                      style={{ color: '#1B1B6F' }}
                    >
                      Username
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
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                        className="flex w-full min-w-0 flex-1 rounded-lg border border-gray-300 h-12 pl-10 pr-3 py-2 text-base font-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1B1B6F',
                        }}
                        placeholder="johndoe (will be converted to lowercase)"
                        required
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                      Username will be automatically converted to lowercase
                    </p>
                  </label>

                  {/* Password Fields */}
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
                        className="flex w-full min-w-0 flex-1 rounded-lg border border-gray-300 h-12 pl-10 pr-10 py-2 text-base font-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1B1B6F',
                        }}
                        placeholder="Min. 8 characters"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        style={{ color: '#6B7280' }}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>

                  <label className="flex flex-col flex-1">
                    <p
                      className="text-sm font-medium leading-normal pb-2"
                      style={{ color: '#1B1B6F' }}
                    >
                      Confirm Password
                    </p>
                    <div className="relative flex w-full flex-1 items-stretch">
                      <div
                        className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                        style={{ color: '#6B7280' }}
                      >
                        <Lock className="h-5 w-5" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="flex w-full min-w-0 flex-1 rounded-lg border border-gray-300 h-12 pl-10 pr-10 py-2 text-base font-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#1B1B6F',
                        }}
                        placeholder="Re-enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                        style={{ color: '#6B7280' }}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </label>

                  {/* Optional Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col flex-1">
                      <p
                        className="text-sm font-medium leading-normal pb-2"
                        style={{ color: '#1B1B6F' }}
                      >
                        Department (Optional)
                      </p>
                      <div className="relative flex w-full flex-1 items-stretch">
                        <div
                          className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                          style={{ color: '#6B7280' }}
                        >
                          <Building2 className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          className="flex w-full rounded-lg border border-gray-300 h-12 pl-10 pr-3 py-2 text-base font-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#1B1B6F',
                          }}
                          placeholder="IT Operations"
                        />
                      </div>
                    </label>

                    <label className="flex flex-col flex-1">
                      <p
                        className="text-sm font-medium leading-normal pb-2"
                        style={{ color: '#1B1B6F' }}
                      >
                        Location (Optional)
                      </p>
                      <div className="relative flex w-full flex-1 items-stretch">
                        <div
                          className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                          style={{ color: '#6B7280' }}
                        >
                          <MapPin className="h-5 w-5" />
                        </div>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="flex w-full rounded-lg border border-gray-300 h-12 pl-10 pr-3 py-2 text-base font-normal transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#1B1B6F',
                          }}
                          placeholder="New York"
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sign Up Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center rounded-lg border border-transparent px-4 py-3 text-base font-semibold text-white shadow-sm transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                    style={{
                      backgroundColor: 'var(--accent)',
                    }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </form>

              {/* Sign In Link */}
              <p
                className="text-center text-sm"
                style={{ color: '#6B7280' }}
              >
                Already have an account?{' '}
                <a
                  href="/login"
                  className="font-semibold hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--accent)' }}
                >
                  Sign In
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
