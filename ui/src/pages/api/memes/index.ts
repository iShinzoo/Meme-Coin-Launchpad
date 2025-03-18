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
    // Use Reddit's public JSON API with a more browser-like request
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot/.json?limit=50`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });

    // If we get a 403, try with a delay and different user agent
    if (response.status === 403) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retryResponse = await fetch(`https://www.reddit.com/r/${subreddit}/hot/.json?limit=50`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
          'Accept': 'application/json',
        }
      });
      
      if (!retryResponse.ok) {
        throw new Error(`Retry failed with status: ${retryResponse.status}`);
      }
      
      const data = await retryResponse.json();
      return processRedditData(data, subreddit);
    }

    if (!response.ok) {
      throw new Error(`Initial request failed with status: ${response.status}`);
    }

    const data = await response.json();
    return processRedditData(data, subreddit);

  } catch (error) {
    console.error(`Error fetching memes from ${subreddit}:`, error);
    return [];
  }
}

// Helper function to process Reddit data
function processRedditData(data: any, subreddit: string): Meme[] {
  if (!data?.data?.children) {
    console.error(`Unexpected response structure from ${subreddit}`);
    return [];
  }

  try {
    return data.data.children
      .filter((post: any) => {
        if (!post?.data?.url) return false;
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
  } catch (error) {
    console.error(`Error processing data from ${subreddit}:`, error);
    return [];
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
    }

    let attempts = 0;
    let allMemes: Meme[] = [];
    const maxAttempts = 5; // Increase max attempts

    while (attempts < maxAttempts && allMemes.length === 0) {
      // Get different subreddits each attempt
      const selectedSubreddits = [...new Set(
        Array.from({ length: 3 }, () => 
          SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)]
        )
      )];

      // Add delay between attempts
      if (attempts > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const results = await Promise.all(
        selectedSubreddits.map(async subreddit => {
          // Add small delay between subreddit requests
          await new Promise(resolve => setTimeout(resolve, 500));
          return fetchSubredditMemes(subreddit);
        })
      );

      allMemes = results.flat();
      attempts++;
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