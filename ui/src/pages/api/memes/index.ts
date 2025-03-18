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

const alternativeProxies = [
  'https://api.allorigins.win/raw',
  'https://proxy.cors.sh',
  'https://api.codetabs.com/v1/proxy',
  'https://corsproxy.io'
];

async function fetchSubredditMemes(subreddit: string): Promise<Meme[]> {
  const proxyUrls = [
    // Try direct Reddit JSON endpoint first
    `https://www.reddit.com/r/${subreddit}/hot.json`,
    // Then try different proxies
    `https://corsproxy.io/?${encodeURIComponent(`https://www.reddit.com/r/${subreddit}/hot.json`)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.reddit.com/r/${subreddit}/hot.json`)}`,
    `https://api.codetabs.com/v1/proxy?quest=https://www.reddit.com/r/${subreddit}/hot.json`
  ];

  for (const url of proxyUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.warn(`Failed to fetch from ${url.split('?')[0]}, status: ${response.status}`);
        continue;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.warn(`Invalid content type from ${url.split('?')[0]}: ${contentType}`);
        continue;
      }

      const rawData = await response.json();
      
      // Handle different proxy response structures
      let data;
      if (url.includes('allorigins.win')) {
        data = JSON.parse(rawData.contents); // allorigins wraps content in .contents
      } else {
        data = rawData;
      }

      if (!data?.data?.children) {
        console.warn(`Invalid data structure from ${url.split('?')[0]}`);
        continue;
      }

      const memes = processRedditData(data, subreddit);
      if (memes.length > 0) {
        return memes;
      }

    } catch (error) {
      console.error(`Error with ${url.split('?')[0]}:`, error);
      continue;
    }

    // Add delay before trying next proxy
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return []; // Return empty array if all attempts fail
}

// Helper function to process Reddit data
function processRedditData(data: any, subreddit: string): Meme[] {
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

// Update the handler function to use longer delays and better error handling
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

    let allMemes: Meme[] = [];
    const maxAttempts = 3;
    let attempts = 0;

    while (attempts < maxAttempts && allMemes.length === 0) {
      // Get random subreddits
      const selectedSubreddits = [...new Set(
        Array.from({ length: 2 }, () => // Reduced to 2 subreddits per attempt
          SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)]
        )
      )];

      // Sequential requests with longer delays
      for (const subreddit of selectedSubreddits) {
        if (allMemes.length >= 50) break;

        // Longer delay between subreddit requests
        if (allMemes.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        const memes = await fetchSubredditMemes(subreddit);
        allMemes = [...allMemes, ...memes];
      }

      attempts++;
      
      if (allMemes.length === 0 && attempts < maxAttempts) {
        // Longer delay between attempts
        await new Promise(resolve => setTimeout(resolve, 3000));
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