import { useState, useEffect } from 'react';

export interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;    // < 600px
  isTablet: boolean;    // 600-1199px
  isDesktop: boolean;   // 1200px+
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      width,
      height,
      isMobile: width < 600,
      isTablet: width >= 600 && width < 1200,
      isDesktop: width >= 1200,
    };
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
