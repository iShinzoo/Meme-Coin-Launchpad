import { NextApiRequest, NextApiResponse } from 'next';

const SUBREDDITS = [
  'memes',
  'dankmemes',
  'wholesomememes',
  'funny',
  'me_irl',
  'ProgrammerHumor',
  'memeeconomy'
];

interface Meme {
  id: string;
  title: string;
  url: string;
  author: string;
  subreddit: string;
  score: number;
}

const cache = new Map<string, { memes: Meme[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Add these environment variables in your Vercel dashboard and .env.local file
const CLIENT_ID = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_REDDIT_CLIENT_SECRET;
const REDDIT_USERNAME = process.env.NEXT_PUBLIC_REDDIT_USERNAME;
const REDDIT_PASSWORD = process.env.NEXT_PUBLIC_REDDIT_PASSWORD;

async function getRedditAccessToken() {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  try {
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'MyMemeApp/1.0 by iShinzoo_krsna'
      },
      body: `grant_type=password&username=${REDDIT_USERNAME}&password=${REDDIT_PASSWORD}`
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Reddit access token:', error);
    return null;
  }
}

async function fetchSubredditMemes(subreddit: string): Promise<Meme[]> {
  try {
    // Try direct Reddit API first
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=50`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      next: {
        revalidate: 300 // Cache for 5 minutes
      }
    });

    if (!response.ok) {
      throw new Error(`Reddit API failed with status: ${response.status}`);
    }

    // Verify we're getting JSON, not HTML
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Invalid content type received');
    }

    const data = await response.json();
    
    if (!data?.data?.children) {
      console.error(`Unexpected response structure from ${subreddit}`);
      return [];
    }

    const memes = data.data.children
      .filter((post: any) => {
        const url = post.data.url.toLowerCase();
        return (
          !post.data.over_18 &&
          (url.endsWith('.jpg') || 
           url.endsWith('.png') || 
           url.endsWith('.gif') ||
           url.includes('imgur.com') ||
           url.includes('i.redd.it'))
        );
      })
      .map((post: any) => ({
        id: post.data.id,
        title: post.data.title,
        url: post.data.url,
        author: post.data.author,
        subreddit: post.data.subreddit,
        score: post.data.score
      }));

    // Verify we have valid image URLs
    return memes.filter((meme: Meme) => {
      try {
        new URL(meme.url);
        return true;
      } catch {
        return false;
      }
    });

  } catch (error) {
    console.error(`Error fetching memes from ${subreddit}:`, error);
    
    // Fallback to using Reddit's JSON endpoint
    try {
      const jsonResponse = await fetch(`https://www.reddit.com/r/${subreddit}/hot/.json?limit=50`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!jsonResponse.ok) {
        return [];
      }

      const data = await jsonResponse.json();
      
      if (!data?.data?.children) {
        return [];
      }

      return data.data.children
        .filter((post: any) => {
          const url = post.data.url.toLowerCase();
          return (
            !post.data.over_18 &&
            (url.endsWith('.jpg') || 
             url.endsWith('.png') || 
             url.endsWith('.gif') ||
             url.includes('imgur.com') ||
             url.includes('i.redd.it'))
          );
        })
        .map((post: any) => ({
          id: post.data.id,
          title: post.data.title,
          url: post.data.url,
          author: post.data.author,
          subreddit: post.data.subreddit,
          score: post.data.score
        }))
        .filter((meme: Meme) => {
          try {
            new URL(meme.url);
            return true;
          } catch {
            return false;
          }
        });
    } catch (fallbackError) {
      console.error(`Fallback fetch failed for ${subreddit}:`, fallbackError);
      return [];
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  try {
    // Check cache
    const cached = cache.get('memes');
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (cached.memes.length > 0) {
        return res.status(200).json({ memes: cached.memes });
      }
      // If cached but empty, continue to fetch new memes
    }

    // Try up to 3 times to get memes
    let attempts = 0;
    let allMemes: Meme[] = [];

    while (attempts < 3 && allMemes.length === 0) {
      const selectedSubreddits = [...new Set(
        Array.from({ length: 3 }, () => 
          SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)]
        )
      )];

      allMemes = (await Promise.all(
        selectedSubreddits.map(subreddit => fetchSubredditMemes(subreddit))
      )).flat();

      attempts++;
      
      if (allMemes.length === 0 && attempts < 3) {
        // Wait a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (allMemes.length === 0) {
      return res.status(503).json({ 
        error: 'Unable to fetch memes at this time. Please try again later.',
        details: 'No memes could be fetched after multiple attempts'
      });
    }

    const shuffledMemes = allMemes
      .sort(() => Math.random() - 0.5)
      .slice(0, 50);
    
    // Cache the results only if we have memes
    if (shuffledMemes.length > 0) {
      cache.set('memes', { memes: shuffledMemes, timestamp: Date.now() });
    }

    return res.status(200).json({ memes: shuffledMemes });
  } catch (error) {
    console.error('Error fetching memes:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch memes. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}