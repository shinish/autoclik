'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function FlowerLogo({ className = "h-8 w-8", fill = false }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      const theme = localStorage.getItem('theme') || 'light';
      setIsDarkMode(theme === 'dark');
    };

    checkTheme();

    // Listen for theme changes
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        checkTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom theme change events
    const handleThemeChange = () => checkTheme();
    window.addEventListener('themechange', handleThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, []);

  // Use light logo for dark mode, dark logo for light mode (opposite)
  const logoSrc = isDarkMode ? '/light.png' : '/dark.png';

  if (fill) {
    return (
      <div className={className} style={{ position: 'relative' }}>
        <Image
          src={logoSrc}
          alt="Autoclik Logo"
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
    );
  }

  return (
    <Image
      src={logoSrc}
      alt="Autoclik Logo"
      width={200}
      height={200}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      priority
    />
  );
}
