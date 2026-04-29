// // "use client";

// // import { motion, AnimatePresence } from "framer-motion";
// // import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
// // import React, { useState, useEffect, useCallback } from "react";

// // const Skiper47 = () => {
// //   const images = [
// //     {
// //       src: "/five.jpg",
// //       alt: "Illustrations by my fav AarzooAly",
// //     },
// //     {
// //       src: "/five.jpg",
// //       alt: "Illustrations by my fav AarzooAly",
// //     },
// //     {
// //       src: "/five.jpg",
// //       alt: "Illustrations by my fav AarzooAly",
// //     },
// //     {
// //       src: "/five.jpg",
// //       alt: "Illustrations by my fav AarzooAly",
// //     },
// //     {
// //       src: "/five.jpg",
// //       alt: "Illustrations by my fav AarzooAly",
// //     },
// //     {
// //       src: "/five.jpg",
// //       alt: "Illustrations by my fav AarzooAly",
// //     },
// //   ];

// //   return (
// //     <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[#f5f4f3]">
// //       <Carousel_001 className="" images={images} showPagination loop />
// //     </div>
// //   );
// // };

// // export { Skiper47 };

// // const Carousel_001 = ({
// //   images,
// //   className = "",
// //   showPagination = false,
// //   showNavigation = false,
// //   loop = true,
// //   autoplay = false,
// //   spaceBetween = 40,
// // }: {
// //   images: { src: string; alt: string }[];
// //   className?: string;
// //   showPagination?: boolean;
// //   showNavigation?: boolean;
// //   loop?: boolean;
// //   autoplay?: boolean;
// //   spaceBetween?: number;
// // }) => {
// //   const [currentIndex, setCurrentIndex] = useState(0);
// //   const [isAnimating, setIsAnimating] = useState(false);
// //   const [visibleSlides] = useState(3); // Nombre de slides visibles simultanément

// //   // Calcul des slides à afficher (avec effet coverflow)
// //   const getVisibleSlides = () => {
// //     const slides = [];
// //     const totalImages = images.length;
    
// //     // Créer un tableau circulaire des indices
// //     for (let i = -1; i <= 1; i++) {
// //       let index = currentIndex + i;
// //       if (index < 0) {
// //         index = loop ? totalImages - 1 : currentIndex;
// //       } else if (index >= totalImages) {
// //         index = loop ? 0 : currentIndex;
// //       }
      
// //       if (index >= 0 && index < totalImages) {
// //         slides.push({
// //           index,
// //           image: images[index],
// //           position: i, // -1: gauche, 0: centre, 1: droite
// //         });
// //       }
// //     }
    
// //     return slides;
// //   };

// //   const goToNext = useCallback(() => {
// //     if (isAnimating) return;
    
// //     setIsAnimating(true);
// //     setCurrentIndex((prev) => {
// //       if (prev === images.length - 1) {
// //         return loop ? 0 : prev;
// //       }
// //       return prev + 1;
// //     });
    
// //     setTimeout(() => setIsAnimating(false), 300);
// //   }, [images.length, loop, isAnimating]);

// //   const goToPrev = useCallback(() => {
// //     if (isAnimating) return;
    
// //     setIsAnimating(true);
// //     setCurrentIndex((prev) => {
// //       if (prev === 0) {
// //         return loop ? images.length - 1 : prev;
// //       }
// //       return prev - 1;
// //     });
    
// //     setTimeout(() => setIsAnimating(false), 300);
// //   }, [images.length, loop, isAnimating]);

// //   const goToSlide = (index: number) => {
// //     if (isAnimating) return;
    
// //     setIsAnimating(true);
// //     setCurrentIndex(index);
// //     setTimeout(() => setIsAnimating(false), 300);
// //   };

// //   // Autoplay
// //   useEffect(() => {
// //     if (!autoplay) return;
    
// //     const interval = setInterval(() => {
// //       goToNext();
// //     }, 3000);
    
// //     return () => clearInterval(interval);
// //   }, [autoplay, goToNext]);

// //   const visibleSlidesData = getVisibleSlides();

// //   return (
// //     <motion.div
// //       initial={{ opacity: 0, translateY: 20 }}
// //       animate={{ opacity: 1, translateY: 0 }}
// //       transition={{
// //         duration: 0.3,
// //         delay: 0.5,
// //       }}
// //       className={`relative w-full max-w-4xl mx-auto ${className}`}
// //     >
// //       <div className="relative h-[400px] flex items-center justify-center">
// //         {/* Slides container */}
// //         <div 
// //           className="relative flex items-center justify-center w-full h-full"
// //           style={{ gap: `${spaceBetween}px` }}
// //         >
// //           <AnimatePresence mode="wait">
// //             {visibleSlidesData.map((slide) => (
// //               <motion.div
// //                 key={`${slide.index}-${slide.position}`}
// //                 className={`absolute h-[320px] rounded-lg overflow-hidden border border-gray-200 ${
// //                   slide.position === 0 ? 'z-30' : 'z-20'
// //                 }`}
// //                 style={{
// //                   width: `calc(${100 / visibleSlides}% - ${spaceBetween}px)`,
// //                 }}
// //                 initial={{
// //                   x: slide.position === -1 ? '-150%' : 
// //                      slide.position === 1 ? '150%' : '0%',
// //                   scale: slide.position === 0 ? 1 : 0.85,
// //                   opacity: slide.position === 0 ? 1 : 0.7,
// //                   rotateY: slide.position !== 0 ? 20 * slide.position : 0,
// //                 }}
// //                 animate={{
// //                   x: slide.position === -1 ? `calc(-50% - ${spaceBetween}px)` : 
// //                      slide.position === 1 ? `calc(50% + ${spaceBetween}px)` : '0%',
// //                   scale: slide.position === 0 ? 1 : 0.85,
// //                   opacity: slide.position === 0 ? 1 : 0.7,
// //                   rotateY: slide.position !== 0 ? 20 * slide.position : 0,
// //                 }}
// //                 exit={{
// //                   x: slide.position === -1 ? '-150%' : 
// //                      slide.position === 1 ? '150%' : '0%',
// //                   opacity: 0,
// //                 }}
// //                 transition={{
// //                   type: "spring",
// //                   stiffness: 300,
// //                   damping: 30,
// //                 }}
// //               >
// //                 <img
// //                   className="h-full w-full object-cover"
// //                   src={slide.image.src}
// //                   alt={slide.image.alt}
// //                 />
// //               </motion.div>
// //             ))}
// //           </AnimatePresence>
// //         </div>

// //         {/* Navigation buttons */}
// //         {showNavigation && (
// //           <>
// //             <button
// //               onClick={goToPrev}
// //               className="absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 disabled:opacity-50"
// //               disabled={!loop && currentIndex === 0}
// //             >
// //               <ChevronLeftIcon className="h-6 w-6" />
// //             </button>
// //             <button
// //               onClick={goToNext}
// //               className="absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 disabled:opacity-50"
// //               disabled={!loop && currentIndex === images.length - 1}
// //             >
// //               <ChevronRightIcon className="h-6 w-6" />
// //             </button>
// //           </>
// //         )}
// //       </div>

// //       {/* Pagination dots */}
// //       {showPagination && (
// //         <div className="mt-8 flex justify-center gap-2">
// //           {images.map((_, index) => (
// //             <button
// //               key={index}
// //               onClick={() => goToSlide(index)}
// //               className={`h-2 w-2 rounded-full transition-all ${
// //                 index === currentIndex
// //                   ? "w-8 bg-black"
// //                   : "bg-gray-300 hover:bg-gray-400"
// //               }`}
// //               aria-label={`Go to slide ${index + 1}`}
// //             />
// //           ))}
// //         </div>
// //       )}

// //       {/* Info du slide actuel */}
// //       <div className="mt-4 text-center text-sm text-gray-600">
// //         {currentIndex + 1} / {images.length} - {images[currentIndex].alt}
// //       </div>
// //     </motion.div>
// //   );
// // };

// // export { Carousel_001 };

// "use client";

// import { motion, AnimatePresence } from "framer-motion";
// import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
// import React, { useState, useEffect, useCallback, useRef, TouchEvent } from "react";

// const Skiper47 = () => {
//   const images = [
//     {
//       src: "/five.jpg",
//       alt: "Illustrations by my fav AarzooAly",
//     },
//     {
//       src: "/five.jpg",
//       alt: "Illustrations by my fav AarzooAly",
//     },
//     {
//       src: "/five.jpg",
//       alt: "Illustrations by my fav AarzooAly",
//     },
//     {
//       src: "/five.jpg",
//       alt: "Illustrations by my fav AarzooAly",
//     },
//     {
//       src: "/five.jpg",
//       alt: "Illustrations by my fav AarzooAly",
//     },
//     {
//       src: "/five.jpg",
//       alt: "Illustrations by my fav AarzooAly",
//     },
//   ];

//   return (
//     <div className="flex h-full w-full items-center justify-center overflow-hidden bg-[#f5f4f3]">
//       <Carousel_001 className="" images={images} showPagination loop showNavigation />
//     </div>
//   );
// };

// export { Skiper47 };

// const Carousel_001 = ({
//   images,
//   className = "",
//   showPagination = false,
//   showNavigation = true, // Changé à true par défaut
//   loop = true,
//   autoplay = false,
//   spaceBetween = 40,
// }: {
//   images: { src: string; alt: string }[];
//   className?: string;
//   showPagination?: boolean;
//   showNavigation?: boolean;
//   loop?: boolean;
//   autoplay?: boolean;
//   spaceBetween?: number;
// }) => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [touchStartX, setTouchStartX] = useState(0);
//   const [touchEndX, setTouchEndX] = useState(0);
//   const [isDragging, setIsDragging] = useState(false);
//   const carouselRef = useRef<HTMLDivElement>(null);
//   const visibleSlides = 3;

//   // Calcul des slides à afficher (avec effet coverflow)
//   const getVisibleSlides = () => {
//     const slides = [];
//     const totalImages = images.length;
    
//     // Créer un tableau circulaire des indices
//     for (let i = -1; i <= 1; i++) {
//       let index = currentIndex + i;
//       if (index < 0) {
//         index = loop ? totalImages - 1 : currentIndex;
//       } else if (index >= totalImages) {
//         index = loop ? 0 : currentIndex;
//       }
      
//       if (index >= 0 && index < totalImages) {
//         slides.push({
//           index,
//           image: images[index],
//           position: i, // -1: gauche, 0: centre, 1: droite
//         });
//       }
//     }
    
//     return slides;
//   };

//   const goToNext = useCallback(() => {
//     if (isAnimating) return;
    
//     setIsAnimating(true);
//     setCurrentIndex((prev) => {
//       if (prev === images.length - 1) {
//         return loop ? 0 : prev;
//       }
//       return prev + 1;
//     });
    
//     setTimeout(() => setIsAnimating(false), 300);
//   }, [images.length, loop, isAnimating]);

//   const goToPrev = useCallback(() => {
//     if (isAnimating) return;
    
//     setIsAnimating(true);
//     setCurrentIndex((prev) => {
//       if (prev === 0) {
//         return loop ? images.length - 1 : prev;
//       }
//       return prev - 1;
//     });
    
//     setTimeout(() => setIsAnimating(false), 300);
//   }, [images.length, loop, isAnimating]);

//   const goToSlide = (index: number) => {
//     if (isAnimating) return;
    
//     setIsAnimating(true);
//     setCurrentIndex(index);
//     setTimeout(() => setIsAnimating(false), 300);
//   };

//   // Gestion du touch sliding
//   const handleTouchStart = (e: TouchEvent) => {
//     setTouchStartX(e.touches[0].clientX);
//     setIsDragging(true);
//   };

//   const handleTouchMove = (e: TouchEvent) => {
//     if (!isDragging) return;
//     setTouchEndX(e.touches[0].clientX);
//   };

//   const handleTouchEnd = () => {
//     if (!isDragging) return;
    
//     setIsDragging(false);
//     const swipeThreshold = 50; // Seuil minimal pour déclencher le swipe
    
//     const diff = touchStartX - touchEndX;
    
//     if (Math.abs(diff) > swipeThreshold) {
//       if (diff > 0) {
//         // Swipe vers la gauche = next
//         goToNext();
//       } else {
//         // Swipe vers la droite = prev
//         goToPrev();
//       }
//     }
    
//     setTouchStartX(0);
//     setTouchEndX(0);
//   };

//   // Gestion du drag à la souris
//   const handleMouseDown = (e: React.MouseEvent) => {
//     setTouchStartX(e.clientX);
//     setIsDragging(true);
//   };

//   const handleMouseMove = (e: React.MouseEvent) => {
//     if (!isDragging) return;
//     setTouchEndX(e.clientX);
//   };

//   const handleMouseUp = () => {
//     handleTouchEnd();
//   };

//   // Autoplay
//   useEffect(() => {
//     if (!autoplay) return;
    
//     const interval = setInterval(() => {
//       goToNext();
//     }, 3000);
    
//     return () => clearInterval(interval);
//   }, [autoplay, goToNext]);

//   const visibleSlidesData = getVisibleSlides();

//   return (
//     <motion.div
//       initial={{ opacity: 0, translateY: 20 }}
//       animate={{ opacity: 1, translateY: 0 }}
//       transition={{
//         duration: 0.3,
//         delay: 0.5,
//       }}
//       className={`relative bg-re w-full lg:max-w-4xl mx-auto ${className}`}
//       ref={carouselRef}
//     >
//       <div className="relative h-[400px] flex items-center justify-center">
//         {/* Slides container avec support touch */}
//         <div 
//           className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing"
//           style={{ gap: `${spaceBetween}px` }}
//           onTouchStart={handleTouchStart}
//           onTouchMove={handleTouchMove}
//           onTouchEnd={handleTouchEnd}
//           onMouseDown={handleMouseDown}
//           onMouseMove={handleMouseMove}
//           onMouseUp={handleMouseUp}
//           onMouseLeave={handleMouseUp}
//         >
//           <AnimatePresence mode="wait">
//             {visibleSlidesData.map((slide) => (
//               <motion.div
//                 key={`${slide.index}-${slide.position}`}
//                 className={`absolute h-[320px] rounded-lg overflow-hidden border border-gray-200 shadow-lg ${
//                   slide.position === 0 ? 'z-30' : 'z-20'
//                 } ${isDragging ? 'transition-transform duration-100' : ''}`}
//                 style={{
//                   width: `calc(${100 / visibleSlides}% - ${spaceBetween}px)`,
//                   transform: isDragging && touchEndX !== 0 ? 
//                     `translateX(${touchEndX - touchStartX}px)` : undefined,
//                 }}
//                 initial={{
//                   x: slide.position === -1 ? '-150%' : 
//                      slide.position === 1 ? '150%' : '0%',
//                   scale: slide.position === 0 ? 1 : 0.85,
//                   opacity: slide.position === 0 ? 1 : 0.7,
//                   rotateY: slide.position !== 0 ? 20 * slide.position : 0,
//                 }}
//                 animate={{
//                   x: slide.position === -1 ? `calc(-50% - ${spaceBetween}px)` : 
//                      slide.position === 1 ? `calc(50% + ${spaceBetween}px)` : '0%',
//                   scale: slide.position === 0 ? 1 : 0.85,
//                   opacity: slide.position === 0 ? 1 : 0.7,
//                   rotateY: slide.position !== 0 ? 20 * slide.position : 0,
//                 }}
//                 exit={{
//                   x: slide.position === -1 ? '-150%' : 
//                      slide.position === 1 ? '150%' : '0%',
//                   opacity: 0,
//                 }}
//                 transition={{
//                   type: "spring",
//                   stiffness: 300,
//                   damping: 30,
//                 }}
//               >
//                 <img
//                   className="h-full w-full object-cover select-none"
//                   src={slide.image.src}
//                   alt={slide.image.alt}
//                   draggable="false"
//                 />
//               </motion.div>
//             ))}
//           </AnimatePresence>
//         </div>

//         {/* Navigation buttons améliorées */}
//         {showNavigation && (
//           <>
//             <button
//               onClick={goToPrev}
//               className="absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/80 p-3 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 hover:shadow-xl active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
//               disabled={!loop && currentIndex === 0}
//               aria-label="Previous slide"
//             >
//               <ChevronLeftIcon className="h-6 w-6" />
//             </button>
//             <button
//               onClick={goToNext}
//               className="absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/80 p-3 text-gray-800 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110 hover:shadow-xl active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
//               disabled={!loop && currentIndex === images.length - 1}
//               aria-label="Next slide"
//             >
//               <ChevronRightIcon className="h-6 w-6" />
//             </button>
//           </>
//         )}
//       </div>

//       {/* Pagination dots */}
//       {showPagination && (
//         <div className="mt-8 flex justify-center gap-3">
//           {images.map((_, index) => (
//             <button
//               key={index}
//               onClick={() => goToSlide(index)}
//               className={`h-3 rounded-full transition-all duration-300 ${
//                 index === currentIndex
//                   ? "w-8 bg-black"
//                   : "w-3 bg-gray-300 hover:bg-gray-400 hover:scale-125"
//               }`}
//               aria-label={`Go to slide ${index + 1}`}
//               aria-current={index === currentIndex ? "true" : "false"}
//             />
//           ))}
//         </div>
//       )}

//       {/* Info du slide actuel */}
//       <div className="mt-6 text-center">
//         <div className="text-sm font-medium text-gray-800">
//           {currentIndex + 1} / {images.length}
//         </div>
//         <div className="mt-1 text-xs text-gray-600">
//           {images[currentIndex].alt}
//         </div>
//       </div>

//       {/* Indicateur tactile (visible uniquement sur mobile) */}
//       <div className="mt-4 text-center">
//         <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full">
//           <span className="text-xs text-gray-600 hidden sm:block">
//             ← Drag or use arrows →
//           </span>
//           <span className="text-xs text-gray-600 block sm:hidden">
//             ← Swipe or tap arrows →
//           </span>
//         </div>
//       </div>
//     </motion.div>
//   );
// };

// export { Carousel_001 };
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import React, { useState, useEffect, useCallback, useRef, TouchEvent } from "react";

const Skiper47 = () => {
  const images = [
    {
      src: "/five.jpg",
      alt: "Illustrations by my fav AarzooAly",
      title: "Nature Series 1"
    },
    {
      src: "/five.jpg",
      alt: "Illustrations by my fav AarzooAly",
      title: "Urban Art 2"
    },
    {
      src: "/five.jpg",
      alt: "Illustrations by my fav AarzooAly",
      title: "Abstract Dreams 3"
    },
    {
      src: "/five.jpg",
      alt: "Illustrations by my fav AarzooAly",
      title: "Minimalist Forms 4"
    },
    {
      src: "/five.jpg",
      alt: "Illustrations by my fav AarzooAly",
      title: "Color Explosion 5"
    },
    {
      src: "/five.jpg",
      alt: "Illustrations by my fav AarzooAly",
      title: "Digital Canvas 6"
    },
  ];

  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 md:px-8">
      <Carousel_001 
        className="w-full" 
        images={images} 
        showPagination 
        loop 
        showNavigation 
        autoplay={false}
      />
    </div>
  );
};

export { Skiper47 };

const Carousel_001 = ({
  images,
  className = "",
  showPagination = false,
  showNavigation = true,
  loop = true,
  autoplay = false,
  spaceBetween = 20,
}: {
  images: { src: string; alt: string; title?: string }[];
  className?: string;
  showPagination?: boolean;
  showNavigation?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  spaceBetween?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Nombre de slides visibles selon la taille d'écran
  const [visibleSlides, setVisibleSlides] = useState(3);

  // Détection de la taille d'écran
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setVisibleSlides(mobile ? 1 : 3);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calcul des slides à afficher
  const getVisibleSlides = () => {
    const slides = [];
    const totalImages = images.length;
    
    if (isMobile) {
      // Sur mobile: seulement le slide actuel avec preview des suivants
      for (let i = -1; i <= 1; i++) {
        let index = currentIndex + i;
        if (index < 0) {
          index = loop ? totalImages - 1 : currentIndex;
        } else if (index >= totalImages) {
          index = loop ? 0 : currentIndex;
        }
        
        if (index >= 0 && index < totalImages) {
          slides.push({
            index,
            image: images[index],
            position: i,
          });
        }
      }
    } else {
      // Sur desktop: 3 slides visibles
      for (let i = -1; i <= 1; i++) {
        let index = currentIndex + i;
        if (index < 0) {
          index = loop ? totalImages - 1 : currentIndex;
        } else if (index >= totalImages) {
          index = loop ? 0 : currentIndex;
        }
        
        if (index >= 0 && index < totalImages) {
          slides.push({
            index,
            image: images[index],
            position: i,
          });
        }
      }
    }
    
    return slides;
  };

  const goToNext = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentIndex((prev) => {
      if (prev === images.length - 1) {
        return loop ? 0 : prev;
      }
      return prev + 1;
    });
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [images.length, loop, isAnimating]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return loop ? images.length - 1 : prev;
      }
      return prev - 1;
    });
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [images.length, loop, isAnimating]);

  const goToSlide = (index: number) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Gestion améliorée du touch sliding
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setDragOffset(0);
    setIsDragging(true);
    
    // Annimer l'autoplay pendant le drag
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    setTouchEndX(currentX);
    
    // Calculer l'offset pour l'effet de drag en temps réel
    const offset = currentX - touchStartX;
    setDragOffset(offset);
    
    // Empêcher le scroll de la page pendant le drag
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const swipeThreshold = isMobile ? 40 : 50; // Seuil plus bas sur mobile
    
    const diff = touchStartX - touchEndX;
    
    // Effet de rebond si le swipe n'est pas assez important
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe vers la gauche = next
        goToNext();
      } else {
        // Swipe vers la droite = prev
        goToPrev();
      }
      
      // Ajouter une vibration tactile sur mobile
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(20);
      }
    }
    
    // Reset avec animation
    setTimeout(() => setDragOffset(0), 100);
    setTouchStartX(0);
    setTouchEndX(0);
  };

  // Gestion du drag à la souris
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Désactiver sur mobile
    
    setTouchStartX(e.clientX);
    setDragOffset(0);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMobile) return;
    setTouchEndX(e.clientX);
    const offset = e.clientX - touchStartX;
    setDragOffset(offset);
  };

  const handleMouseUp = () => {
    if (isMobile) return;
    handleTouchEnd();
  };

  // Autoplay
  useEffect(() => {
    if (!autoplay || isDragging) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [autoplay, goToNext, isDragging]);

  const visibleSlidesData = getVisibleSlides();

  // Calcul de la largeur des slides pour mobile
  const getSlideWidth = () => {
    if (isMobile) {
      return `calc(100% - ${spaceBetween * 2}px)`;
    }
    return `calc(${100 / visibleSlides}% - ${spaceBetween}px)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.2,
      }}
      className={`relative w-full max-w-4xl mx-auto ${className}`}
      ref={carouselRef}
    >
      {/* Header avec titre et compteur */}
      <div className="mb-6 flex flex-col items-center px-4 md:px-0">
        <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
          Gallery Showcase
        </h2>
        <div className="mt-2 flex items-center gap-3">
          <span className="rounded-full bg-black px-3 py-1 text-sm font-medium text-white">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="text-sm text-gray-600">
            {images[currentIndex].title || images[currentIndex].alt}
          </span>
        </div>
      </div>

      {/* Zone principale du carousel */}
      <div className={`relative ${isMobile ? 'h-[400px]' : 'h-[420px]'} flex items-center justify-center`}>
        {/* Overlay de gradient pour mobile */}
        {isMobile && (
          <>
            <div className="absolute left-0 top-0 z-20 h-full w-12 bg-gradient-to-r from-gray-50/90 to-transparent" />
            <div className="absolute right-0 top-0 z-20 h-full w-12 bg-gradient-to-l from-gray-50/90 to-transparent" />
          </>
        )}

        {/* Slides container */}
        <div 
          className={`relative flex items-center justify-center w-full h-full ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ gap: `${spaceBetween}px` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <AnimatePresence mode="wait">
            {visibleSlidesData.map((slide) => (
              <motion.div
                key={`${slide.index}-${slide.position}`}
                className={`absolute rounded-2xl overflow-hidden border-2 ${
                  slide.position === 0 
                    ? 'z-30 border-black/20 shadow-2xl' 
                    : 'z-20 border-gray-200/50 shadow-lg'
                } ${
                  isDragging && slide.position === 0 ? 'transition-transform duration-75' : ''
                }`}
                style={{
                  width: getSlideWidth(),
                  height: isMobile ? '340px' : '320px',
                  transform: isDragging && slide.position === 0 ? 
                    `translateX(${dragOffset}px) rotateY(${dragOffset * 0.1}deg)` : undefined,
                }}
                initial={{
                  x: slide.position === -1 ? (isMobile ? '-110%' : '-150%') : 
                     slide.position === 1 ? (isMobile ? '110%' : '150%') : '0%',
                  scale: slide.position === 0 ? 1 : (isMobile ? 0.92 : 0.85),
                  opacity: slide.position === 0 ? 1 : (isMobile ? 0.5 : 0.7),
                  rotateY: isMobile ? 0 : (slide.position !== 0 ? 20 * slide.position : 0),
                }}
                animate={{
                  x: slide.position === -1 ? 
                    (isMobile ? `calc(-50% - ${spaceBetween}px)` : `calc(-50% - ${spaceBetween}px)`) : 
                    slide.position === 1 ? 
                    (isMobile ? `calc(50% + ${spaceBetween}px)` : `calc(50% + ${spaceBetween}px)`) : '0%',
                  scale: slide.position === 0 ? 1 : (isMobile ? 0.92 : 0.85),
                  opacity: slide.position === 0 ? 1 : (isMobile ? 0.5 : 0.7),
                  rotateY: isMobile ? 0 : (slide.position !== 0 ? 20 * slide.position : 0),
                }}
                exit={{
                  x: slide.position === -1 ? (isMobile ? '-110%' : '-150%') : 
                     slide.position === 1 ? (isMobile ? '110%' : '150%') : '0%',
                  opacity: 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: isMobile ? 350 : 300,
                  damping: isMobile ? 35 : 30,
                  mass: isMobile ? 0.8 : 1,
                }}
              >
                <div className="relative h-full w-full">
                  <img
                    className="h-full w-full object-cover select-none"
                    src={slide.image.src}
                    alt={slide.image.alt}
                    draggable="false"
                  />
                  {/* Overlay sur les slides non actifs */}
                  {slide.position !== 0 && (
                    <div className="absolute inset-0 bg-black/10" />
                  )}
                  
                  {/* Badge sur le slide actif */}
                  {slide.position === 0 && (
                    <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                      Active
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Navigation buttons - Version mobile améliorée */}
        {showNavigation && (
          <>
            <button
              onClick={goToPrev}
              className={`absolute z-40 -translate-y-1/2 rounded-full transition-all duration-300 active:scale-90 ${
                isMobile 
                  ? 'left-2 top-1/2 bg-white/95 p-3 shadow-xl' 
                  : 'left-4 top-1/2 bg-white/80 p-3 shadow-lg hover:scale-110'
              }`}
              disabled={!loop && currentIndex === 0}
              aria-label="Previous slide"
            >
              <ChevronLeftIcon className={`${isMobile ? 'h-7 w-7' : 'h-6 w-6'} text-gray-800`} />
            </button>
            <button
              onClick={goToNext}
              className={`absolute z-40 -translate-y-1/2 rounded-full transition-all duration-300 active:scale-90 ${
                isMobile 
                  ? 'right-2 top-1/2 bg-white/95 p-3 shadow-xl' 
                  : 'right-4 top-1/2 bg-white/80 p-3 shadow-lg hover:scale-110'
              }`}
              disabled={!loop && currentIndex === images.length - 1}
              aria-label="Next slide"
            >
              <ChevronRightIcon className={`${isMobile ? 'h-7 w-7' : 'h-6 w-6'} text-gray-800`} />
            </button>
          </>
        )}

        {/* Indicateur de drag pour mobile */}
        {isMobile && isDragging && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm"
          >
            {dragOffset > 0 ? "← Swipe left" : "Swipe right →"}
          </motion.div>
        )}
      </div>

      {/* Pagination dots améliorée */}
      {showPagination && (
        <div className={`mt-8 flex ${isMobile ? 'justify-center gap-1.5' : 'justify-center gap-2'} px-4 md:px-0`}>
          {images.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={`relative rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-black"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              style={{
                width: index === currentIndex ? (isMobile ? '32px' : '40px') : (isMobile ? '10px' : '12px'),
                height: isMobile ? '10px' : '12px',
              }}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? "true" : "false"}
            >
              {index === currentIndex && (
                <motion.div
                  layoutId="activeDot"
                  className="absolute inset-0 rounded-full bg-black"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      )}

      {/* Indicateur tactile (mobile seulement) */}
      {isMobile && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-6 rounded-full bg-gray-300" />
              <div className="h-1 w-8 rounded-full bg-black" />
              <div className="h-1 w-6 rounded-full bg-gray-300" />
            </div>
            <span className="text-xs font-medium text-gray-600">
              Swipe or tap
            </span>
          </div>
          
          {/* Mini tutorial en animation */}
          <div className="relative mt-2 h-1 w-32 overflow-hidden rounded-full bg-gray-200">
            <motion.div
              className="absolute left-0 top-0 h-full w-1/3 rounded-full bg-black"
              animate={{
                x: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Footer avec informations */}
      <div className="mt-6 text-center px-4 md:px-0">
        <p className="text-sm text-gray-600">
          {images[currentIndex].alt}
        </p>
        <div className="mt-2 flex justify-center gap-3">
          <button 
            onClick={goToPrev}
            className="text-xs text-gray-500 hover:text-black"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-400">•</span>
          <button 
            onClick={goToNext}
            className="text-xs text-gray-500 hover:text-black"
          >
            Next →
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export { Carousel_001 };