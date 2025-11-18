export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'text-white hover:opacity-90 focus:ring-purple-600',
    secondary: 'hover:opacity-80 focus:ring-gray-500',
    outline: 'hover:bg-opacity-90 focus:ring-gray-500',
    ghost: 'hover:opacity-80 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  const variantStyles = {
    primary: { backgroundColor: 'var(--primary)', color: '#FFFFFF' },
    secondary: { background: 'var(--secondary)', color: '#FFFFFF', border: 'none' },
    outline: { backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' },
    ghost: { backgroundColor: 'transparent', color: 'var(--text)' },
    danger: { backgroundColor: 'var(--danger)', color: '#FFFFFF' },
  };

  const baseStyle = variantStyles[variant] || {};

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      style={baseStyle}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
