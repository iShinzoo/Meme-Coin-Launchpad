'use client';

import React, { useEffect, useRef } from 'react';
import { Meme } from '../types';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MemeReelProps {
  meme: Meme;
}

export default function MemeReel({ meme }: MemeReelProps) {
  const [isLiked, setIsLiked] = React.useState(false);
  const [isDisliked, setIsDisliked] = React.useState(false);
  const [score, setScore] = React.useState(meme.score);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current) {
      const img = new Image();
      img.src = meme.url;
      img.onload = () => {
        if (imgRef.current) {
          imgRef.current.src = meme.url;
        }
      };
    }
  }, [meme.url]);

  const handleLike = () => {
    if (isLiked) {
      setScore(score - 1);
      setIsLiked(false);
    } else {
      if (isDisliked) {
        setScore(score + 2);
        setIsDisliked(false);
      } else {
        setScore(score + 1);
      }
      setIsLiked(true);
    }
  };

  const handleDislike = () => {
    if (isDisliked) {
      setScore(score + 1);
      setIsDisliked(false);
    } else {
      if (isLiked) {
        setScore(score - 2);
        setIsLiked(false);
      } else {
        setScore(score - 1);
      }
      setIsDisliked(true);
    }
  };

  return (
    <div className="relative h-screen w-full bg-black flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center">
        <img
          ref={imgRef}
          src={meme.url}
          alt={meme.title}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          loading="lazy"
        />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-white">{meme.title}</h2>
          <p className="text-sm text-gray-300">Posted by u/{meme.author} in r/{meme.subreddit}</p>
        </div>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 bg-black/30 p-3 rounded-full backdrop-blur-sm">
        <button
          onClick={handleLike}
          className="p-2 rounded-full hover:bg-white/10 transition-all transform hover:scale-110"
        >
          <ArrowUp
            className={cn(
              "w-8 h-8 transition-colors",
              isLiked ? "text-red-500" : "text-white"
            )}
          />
        </button>
        <span className="text-white font-medium">{score}</span>
        <button
          onClick={handleDislike}
          className="p-2 rounded-full hover:bg-white/10 transition-all transform hover:scale-110"
        >
          <ArrowDown
            className={cn(
              "w-8 h-8 transition-colors",
              isDisliked ? "text-blue-500" : "text-white"
            )}
          />
        </button>
      </div>
    </div>
  );
}