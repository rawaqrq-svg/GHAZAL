'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export interface HeroSlide {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  eyebrowAr: string | null;
  eyebrowEn: string | null;
  ctaAr: string | null;
  ctaEn: string | null;
  imageDesktopPath: string;
  imageMobilePath: string;
  altAr: string;
  altEn: string;
  destinationType: string;
  productId: string | null;
  collectionId: string | null;
  categoryId: string | null;
  internalPath: string | null;
  externalUrl: string | null;
  displayOrder: number;
  isEnabled: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  openInNewTab: boolean;
  overlayStrength: number;
  textPosition: string;
  product?: { slug: string } | null;
  category?: { slug: string; name: string } | null;
  collection?: { slug: string } | null;
}

export interface CarouselSettings {
  enabled: boolean;
  autoplayEnabled: boolean;
  autoplayIntervalMs: number;
  pauseOnHover: boolean;
  showIndicators: boolean;
  showNavigation: boolean;
  transitionType: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  settings: CarouselSettings;
}

export function HeroCarousel({ slides, settings }: HeroCarouselProps) {
  const { locale = 'ar' } = useParams() as { locale?: string };
  const isAr = locale === 'ar';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // 1. Detect user preference for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Filter slides strictly based on active rules: enabled, not expired/future
  const activeSlides = slides.filter(slide => {
    if (!slide.isEnabled) return false;
    const now = new Date();
    if (slide.startsAt && new Date(slide.startsAt) > now) return false;
    if (slide.endsAt && new Date(slide.endsAt) < now) return false;
    return true;
  });

  // 2. Localized navigation URL resolver
  const resolveSlideUrl = (slide: HeroSlide) => {
    const prefix = `/${locale}`;
    switch (slide.destinationType) {
      case 'COLLECTION':
        return slide.collection ? `${prefix}/collections/${slide.collection.slug}` : '#';
      case 'CATEGORY':
        return slide.category ? `${prefix}/shop?category=${slide.category.slug}` : '#';
      case 'PRODUCT':
        return slide.product ? `${prefix}/products/${slide.product.slug}` : '#';
      case 'INTERNAL_ROUTE':
        return slide.internalPath ? `${prefix}${slide.internalPath.startsWith('/') ? '' : '/'}${slide.internalPath}` : '#';
      case 'EXTERNAL_URL':
        return slide.externalUrl || '#';
      default:
        return '#';
    }
  };

  const isVideo = (path: string) => /\.(mp4|webm|ogg)$/i.test(path || '');

  // 3. Autoplay rotation logic
  const startAutoplay = () => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    if (!settings.autoplayEnabled || isPaused || prefersReducedMotion || activeSlides.length <= 1) {
      return;
    }
    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeSlides.length);
    }, settings.autoplayIntervalMs);
  };

  useEffect(() => {
    startAutoplay();
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isPaused, prefersReducedMotion, activeSlides.length]);

  // Pause autoplay when the browser tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (activeSlides.length === 0) {
    return null; // Fallback handles this inside the page
  }

  // 4. Manual controls
  const handlePrev = () => {
    setIsPaused(true);
    setCurrentIndex(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = () => {
    setIsPaused(true);
    setCurrentIndex(prev => (prev + 1) % activeSlides.length);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      // In RTL, left arrow goes to next slide; in LTR, left arrow goes to previous slide
      if (isAr) handleNext();
      else handlePrev();
    } else if (e.key === 'ArrowRight') {
      if (isAr) handlePrev();
      else handleNext();
    }
  };

  // Touch swipe support (RTL aware!)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    
    // Swipe threshold 50px
    if (Math.abs(diff) > 50) {
      setIsPaused(true);
      if (diff > 0) {
        // Swipe left: next slide in LTR, previous slide in RTL
        if (isAr) handlePrev();
        else handleNext();
      } else {
        // Swipe right: previous slide in LTR, next slide in RTL
        if (isAr) handleNext();
        else handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <div 
      className="relative w-full aspect-[16/7] sm:aspect-[18/7] md:aspect-[21/8] lg:aspect-[24/8] min-h-[170px] sm:min-h-[220px] md:min-h-[300px] overflow-hidden select-none group/carousel rounded-none shadow-none focus:outline-none"
      onMouseEnter={() => settings.pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => settings.pauseOnHover && setIsPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      aria-label="Carousel"
    >
      {/* Slides Viewport */}
      <div className="relative w-full h-full">
        {activeSlides.map((slide, index) => {
          const isActive = index === currentIndex;
          const slideUrl = resolveSlideUrl(slide);
          const hasAction = slide.destinationType !== 'NONE';
          const mediaUrl = slide.imageDesktopPath || slide.imageMobilePath;
          const isVideoMedia = isVideo(mediaUrl);

          // GPU-friendly transitions: absolute positioning, fading opacity, scaling background
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 w-full h-full transition-all duration-[600ms] ease-out-expo flex flex-col justify-end ${
                isActive 
                  ? 'opacity-100 scale-100 pointer-events-auto z-10' 
                  : 'opacity-0 scale-[0.98] pointer-events-none z-0'
              }`}
              style={{ transitionProperty: prefersReducedMotion ? 'opacity' : 'opacity, transform' }}
            >
              {/* Media Delivery (Video or Image) */}
              {mediaUrl ? (
                isVideoMedia ? (
                  <video 
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] ease-out scale-102 group-hover/carousel:scale-105"
                    style={{
                      transitionProperty: prefersReducedMotion ? 'none' : 'transform',
                      contentVisibility: isActive ? 'auto' : 'hidden'
                    }}
                  />
                ) : (
                  <Image
                    src={mediaUrl}
                    alt={slide.altAr || slide.titleAr || 'Banner'}
                    fill
                    priority={index === 0} // Load LCP image eagerly
                    sizes="100vw"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] ease-out scale-102 group-hover/carousel:scale-105"
                    style={{
                      transitionProperty: prefersReducedMotion ? 'none' : 'transform',
                      contentVisibility: isActive ? 'auto' : 'hidden'
                    }}
                  />
                )
              ) : (
                <div className="absolute inset-0 w-full h-full bg-zinc-800 transition-transform duration-[8000ms] ease-out scale-102 group-hover/carousel:scale-105" />
              )}

              {/* Dynamic Gradient Overlay */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-900/35 to-transparent" 
                style={{ opacity: slide.overlayStrength }}
              />

              {/* Text Layer */}
              <div className={`relative z-20 p-4 sm:p-6 md:p-8 w-full text-white space-y-1.5 md:space-y-2 text-right ${
                slide.textPosition === 'LEFT' ? 'text-left lg:text-left rtl:text-right' : 
                slide.textPosition === 'RIGHT' ? 'text-right lg:text-right rtl:text-left' : 'text-center'
              }`}>
                {/* Eyebrow Accent */}
                {slide.eyebrowAr && (
                  <span className="inline-block text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-[var(--color-champagne-400)] bg-white/10 backdrop-blur-xs border border-white/10 px-2 py-0.5 rounded-sm">
                    {slide.eyebrowAr}
                  </span>
                )}

                {/* Banner Title */}
                <h3 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-white drop-shadow-sm font-heading">
                  {slide.titleAr}
                </h3>

                {/* Banner Short description */}
                {slide.descriptionAr && (
                  <p className="text-[11px] sm:text-xs md:text-sm text-zinc-100 line-clamp-2 max-w-lg mx-auto lg:mx-0 drop-shadow-sm">
                    {slide.descriptionAr}
                  </p>
                )}

                {/* Action CTA */}
                {hasAction && (
                  <div className="pt-1 md:pt-2">
                    <Link
                      href={slideUrl}
                      target={slide.openInNewTab ? '_blank' : undefined}
                      rel={slide.openInNewTab ? 'noopener noreferrer' : undefined}
                      className="inline-block bg-[#E6007E] hover:bg-[#C5006C] text-white text-[11px] sm:text-xs font-bold px-4 py-2 rounded-xl transition-all transform active:scale-98 shadow-sm hover:shadow"
                    >
                      {slide.ctaAr || (isAr ? 'عرض التفاصيل' : 'Explore Now')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev / Next controls */}
      {settings.showNavigation && activeSlides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute top-1/2 -translate-y-1/2 end-3 sm:end-6 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-[#E6007E] text-white flex items-center justify-center border border-white/20 backdrop-blur-xs opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 transition-all shadow-lg focus:opacity-100 active:scale-95"
            aria-label={isAr ? 'السابق' : 'Previous slide'}
          >
            {isAr ? '→' : '←'}
          </button>
          <button
            onClick={handleNext}
            className="absolute top-1/2 -translate-y-1/2 start-3 sm:start-6 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-[#E6007E] text-white flex items-center justify-center border border-white/20 backdrop-blur-xs opacity-90 sm:opacity-0 sm:group-hover/carousel:opacity-100 transition-all shadow-lg focus:opacity-100 active:scale-95"
            aria-label={isAr ? 'التالي' : 'Next slide'}
          >
            {isAr ? '←' : '→'}
          </button>
        </>
      )}

      {/* Indicators */}
      {settings.showIndicators && activeSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsPaused(true);
                setCurrentIndex(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-[#E6007E] w-6' 
                  : 'bg-white/50 hover:bg-white/80 w-2'
              }`}
              aria-label={`Slide ${index + 1}`}
              aria-current={index === currentIndex ? 'true' : 'false'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default HeroCarousel;
