import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="text-center px-6">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="Autoclik Logo"
            width={120}
            height={120}
            className="opacity-90"
            priority
          />
        </div>

        {/* 404 Text */}
        <h1
          className="text-8xl font-bold mb-4"
          style={{
            color: 'var(--primary)',
            textShadow: '0 0 30px rgba(239, 68, 68, 0.3)'
          }}
        >
          404
        </h1>

        {/* Error Message */}
        <h2
          className="text-2xl font-semibold mb-3"
          style={{ color: 'var(--text)' }}
        >
          Page Not Found
        </h2>

        <p
          className="text-base mb-8 max-w-md mx-auto"
          style={{ color: 'var(--muted)' }}
        >
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 shadow-lg"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
            }}
          >
            Go to Home
          </Link>

          <Link
            href="/catalog"
            className="px-6 py-3 rounded-lg font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: 'var(--card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            View Catalog
          </Link>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 flex justify-center gap-2">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--primary)', animationDelay: '0s' }}
          />
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--primary)', animationDelay: '0.2s' }}
          />
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--primary)', animationDelay: '0.4s' }}
          />
        </div>
      </div>
    </div>
  );
}
