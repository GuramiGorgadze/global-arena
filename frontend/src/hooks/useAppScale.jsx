import { useEffect } from 'react';

const useAppScale = () => {
  useEffect(() => {
    const handleResize = () => {
      const scale =
        window.innerWidth > 1920
          ? Math.max(1, Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
          : 1;

      const doc = document.documentElement;
      doc.style.setProperty('--app-scale', `${scale}`);
    };

    window.addEventListener('resize', handleResize);

    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
};

export default useAppScale;
