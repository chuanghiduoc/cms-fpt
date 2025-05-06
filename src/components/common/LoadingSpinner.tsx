import Image from 'next/image';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

const LoadingSpinner = ({ size = 'medium', fullScreen = false }: LoadingSpinnerProps) => {
  // Define sizes based on the size prop
  const sizes = {
    small: { container: 'w-20 h-20', logo: 40, border: 'border-2' },
    medium: { container: 'w-32 h-32', logo: 60, border: 'border-4' },
    large: { container: 'w-40 h-40', logo: 80, border: 'border-5' },
  };

  const { container, logo, border } = sizes[size];

  const containerClasses = fullScreen 
    ? "fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm z-50"
    : "flex items-center justify-center";

  return (
    <div className={containerClasses}>
      <div className="relative">
        {/* Static Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Loading..."
            width={logo}
            height={logo}
            priority
            className="z-10"
          />
        </div>
        
        {/* Spinning Border */}
        <motion.div 
          className={`${container} ${border} border-orange-500 border-t-transparent rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
        
        {/* Outer glow effect */}
        <div className={`absolute inset-0 ${container} rounded-full bg-orange-500/10 blur-md`}></div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 