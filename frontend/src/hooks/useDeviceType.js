import { useState, useEffect } from 'react';

export default function useDeviceType() {
  const isMobile = () =>
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    window.matchMedia("(max-width: 768px)").matches;

  const [mobile, setMobile] = useState(isMobile());

  useEffect(() => {
    const handleResize = () => {
      setMobile(isMobile());
    };

    window.addEventListener('resize', handleResize);
    
    // Initial check
    setMobile(isMobile());

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return mobile;
}
