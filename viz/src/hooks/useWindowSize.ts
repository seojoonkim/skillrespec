import { useState, useEffect } from 'react';

export interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;    // < 600px
  isTablet: boolean;    // 600-1199px
  isDesktop: boolean;   // 1200px+
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setSize({
        width,
        height,
        isMobile: width < 600,
        isTablet: width >= 600 && width < 1200,
        isDesktop: width >= 1200,
      });
    };

    // Initial call
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export default useWindowSize;
