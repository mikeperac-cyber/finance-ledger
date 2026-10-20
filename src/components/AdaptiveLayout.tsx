import React, { useState, useEffect, useRef } from 'react';

export type WindowSizeClass = 'compact' | 'medium' | 'expanded' | 'wide';

export interface LayoutConstraints {
  maxWidth: number;
  maxHeight: number;
  sizeClass: WindowSizeClass;
  isLargeScreen: boolean; // > 960px
  isSplitPaneCapable: boolean; // >= 1140px
}

/**
 * React equivalent of Flutter's LayoutBuilder + MediaQuery.sizeOf:
 * Measures actual available container/window space rather than guessing hardware type,
 * and passes LayoutConstraints down to children.
 */
export const LayoutBuilder: React.FC<{
  children: (constraints: LayoutConstraints) => React.ReactNode;
}> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>(
    () => ({
      width: typeof window !== 'undefined' ? window.innerWidth : 1280,
      height: typeof window !== 'undefined' ? window.innerHeight : 800,
    })
  );

  useEffect(() => {
    const updateSize = () => {
      const width = containerRef.current?.clientWidth || window.innerWidth;
      const height = window.innerHeight;
      setDimensions({ width, height });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const w = dimensions.width;
  const sizeClass: WindowSizeClass =
    w < 640 ? 'compact' : w < 980 ? 'medium' : w < 1260 ? 'expanded' : 'wide';

  const constraints: LayoutConstraints = {
    maxWidth: w,
    maxHeight: dimensions.height,
    sizeClass,
    isLargeScreen: w >= 980,
    isSplitPaneCapable: w >= 1120,
  };

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-[#0c0d0f] text-[#ededef]">
      {children(constraints)}
    </div>
  );
};

/**
 * ConstrainedBox: Prevents lists, forms, and ledgers from stretching unnaturally
 * across large screens, keeping content centered at an optimal reading width.
 */
export const ConstrainedBox: React.FC<{
  maxWidth?: number;
  className?: string;
  children: React.ReactNode;
}> = ({ maxWidth = 1120, className = '', children }) => {
  return (
    <div className="w-full flex justify-center">
      <div
        style={{ maxWidth: `${maxWidth}px` }}
        className={`w-full ${className}`}
      >
        {children}
      </div>
    </div>
  );
};
