'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Meme } from '../types';
import MemeReel from './MemeReel';
import { useSwipeable } from 'react-swipeable';

interface MemeReelContainerProps {
  initialMemes: Meme[];
}

export default function MemeReelContainer({ initialMemes }: MemeReelContainerProps) {
  const [memes, setMemes] = useState<Meme[]>(initialMemes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const lastScrollTime = useRef(Date.now());
  const scrollLockTimer = useRef<NodeJS.Timeout | null>(null);
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  const loadMoreMemes = useCallback(async () => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      const res = await fetch('/api/memes');
      const data = await res.json();
      setMemes(prevMemes => [...prevMemes, ...data.memes]);
    } catch (error) {
      console.error('Error loading more memes:', error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (isScrollLocked) return;

    const now = Date.now();
    if (now - lastScrollTime.current < 300) return; // Increased debounce time
    lastScrollTime.current = now;

    setIsScrollLocked(true);
    if (scrollLockTimer.current) {
      clearTimeout(scrollLockTimer.current);
    }
    scrollLockTimer.current = setTimeout(() => setIsScrollLocked(false), 800);

    if (direction === 'up' && currentIndex < memes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (direction === 'down' && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex, memes.length, isScrollLocked]);

  useEffect(() => {
    if (currentIndex > memes.length - 5 && !isLoading) {
      loadMoreMemes();
    }
  }, [currentIndex, memes.length, loadMoreMemes, isLoading]);

  const handlers = useSwipeable({
    onSwipedUp: () => handleScroll('up'),
    onSwipedDown: () => handleScroll('down'),
    trackMouse: true,
    delta: 100,
    swipeDuration: 700,
    touchEventOptions: { passive: false }
  });

  const handleWheel = useCallback((e: WheelEvent) => {
    const direction = e.deltaY > 0 ? 'up' : 'down';
    handleScroll(direction);
  }, [handleScroll]);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel, { passive: false });
      return () => element.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      handleScroll('down');
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      handleScroll('up');
      e.preventDefault();
    }
  }, [handleScroll]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div 
      {...handlers} 
      ref={containerRef}
      className="h-screen w-full overflow-hidden bg-black"
    >
      <div 
        className="relative w-full h-full transition-transform duration-500 ease-out"
        style={{
          transform: `translateY(-${currentIndex * 100}vh)`,
        }}
      >
        {memes.map((meme, index) => (
          <div
            key={meme.id}
            className="absolute top-0 left-0 w-full h-screen"
            style={{
              transform: `translateY(${index * 100}vh)`,
            }}
          >
            <MemeReel meme={meme} />
          </div>
        ))}
      </div>
    </div>
  );
}