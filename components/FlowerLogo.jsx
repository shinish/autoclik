import Image from 'next/image';

export default function FlowerLogo({ className = "h-8 w-8", fill = false }) {
  if (fill) {
    return (
      <div className={className} style={{ position: 'relative' }}>
        <Image
          src="/logo.png"
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
      src="/logo.png"
      alt="Autoclik Logo"
      width={200}
      height={200}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      priority
    />
  );
}
