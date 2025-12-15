import { useMemo, useState } from 'react';

// List of available motivation images (add more as needed)
// Place images in frontend/public/img/motivation/
const AVAILABLE_IMAGES = [
  '/img/motivation/1.jpg',
  '/img/motivation/2.jpg',
  '/img/motivation/3.jpg',
  '/img/motivation/4.jpg',
  '/img/motivation/5.jpg',
  '/img/motivation/6.jpg',
  '/img/motivation/7.jpg',
  '/img/motivation/8.jpg',
  '/img/motivation/9.jpg',
  '/img/motivation/10.jpg',
  '/img/motivation/11.jpg',
  '/img/motivation/12.jpg',
  '/img/motivation/13.jpg',
  '/img/motivation/14.jpg',
  '/img/motivation/15.jpg',
];

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

interface ImagePanelProps {
  images: string[];
  side: 'left' | 'right';
}

const ImagePanel = ({ images, side }: ImagePanelProps) => {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  
  const positionClasses = side === 'left' 
    ? 'left-4' 
    : 'right-4';

  const handleImageError = (src: string) => {
    setFailedImages(prev => new Set(prev).add(src));
  };

  return (
    <div 
      className={`fixed ${positionClasses} top-1/2 -translate-y-1/2 z-10 hidden xl:flex flex-col gap-6`}
      aria-hidden="true"
    >
      {images.map((src, index) => {
        const hasFailed = failedImages.has(src);
        return (
          <div 
            key={`${side}-${index}`}
            className="w-48 h-64 rounded-2xl overflow-hidden border border-white/10 shadow-lg shadow-black/20 bg-slate-900 relative"
          >
            {hasFailed ? (
              <div className="w-full h-full flex items-center justify-center text-white/20 text-xs text-center p-2">
                <div>
                  <div className="text-2xl mb-1">📷</div>
                  <div>Add image</div>
                </div>
              </div>
            ) : (
              <img 
                src={src} 
                alt=""
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
                loading="lazy"
                onError={() => handleImageError(src)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export const MotivationalSidePanels = () => {
  // Randomize images on component mount (persists until page refresh)
  const { leftImages, rightImages } = useMemo(() => {
    const shuffled = shuffleArray(AVAILABLE_IMAGES);
    // Split into left (first 3) and right (next 3)
    return {
      leftImages: shuffled.slice(0, 3),
      rightImages: shuffled.slice(3, 6),
    };
  }, []);

  return (
    <>
      <ImagePanel images={leftImages} side="left" />
      <ImagePanel images={rightImages} side="right" />
    </>
  );
};

