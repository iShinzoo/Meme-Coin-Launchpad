'use client';

import { useState, useEffect } from 'react';
import MemeReelContainer from '../components/MemeReelContainer';
import { Meme } from '../types';

const Page: React.FC = () => {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchMemes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching memes from API...");
      const res = await fetch('/api/memes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch memes: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log("Memes fetched successfully:", data.memes.length);
      setMemes(data.memes);
    } catch (err: any) {
      console.error('Error fetching memes:', err);
      setError(err.message || 'Failed to fetch memes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemes();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-lg bg-red-900/20 border border-red-800/50 px-6 py-4 rounded-lg backdrop-blur-sm max-w-md text-center">
          {error}
        </div>
        <button 
          onClick={handleRetry}
          className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!memes || memes.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-yellow-400 text-lg bg-yellow-900/20 border border-yellow-800/50 px-6 py-4 rounded-lg backdrop-blur-sm max-w-md text-center">
          No memes found. The server might be empty or experiencing issues.
        </div>
        <button 
          onClick={handleRetry}
          className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black">
      <MemeReelContainer initialMemes={memes} />
    </main>
  );
}

export default Page;