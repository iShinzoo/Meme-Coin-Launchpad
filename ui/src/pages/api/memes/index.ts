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
  try {
    // Use a more reliable proxy service
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.reddit.com/r/${subreddit}/hot.json`)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyMemeApp/1.0;)',
      },
    });

    if (!response.ok) {
      // Try alternative proxy if first one fails
      const backupProxyUrl = `https://proxy.cors.sh/${encodeURIComponent(`https://www.reddit.com/r/${subreddit}/hot.json`)}`;
      const backupResponse = await fetch(backupProxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MyMemeApp/1.0;)',
          'x-cors-api-key': 'temp_' + Math.random().toString(36).substr(2, 9),
        },
      });

      if (!backupResponse.ok) {
        throw new Error(`Both proxy attempts failed for ${subreddit}`);
      }

      const data = await backupResponse.json();
      return processRedditData(data, subreddit);
    }

    const data = await response.json();
    return processRedditData(data, subreddit);

  } catch (error) {
    console.error(`Error fetching memes from ${subreddit}:`, error);
    
    // Last resort: try direct fetch with minimal headers
    try {
      const directResponse = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json`, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        }
      });

      if (!directResponse.ok) {
        return [];
      }

      const data = await directResponse.json();
      return processRedditData(data, subreddit);
    } catch (directError) {
      console.error(`Direct fetch failed for ${subreddit}:`, directError);
      return [];
    }
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

// Update the handler to use sequential requests instead of parallel
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
        Array.from({ length: 3 }, () => 
          SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)]
        )
      )];

      // Sequential requests instead of parallel
      for (const subreddit of selectedSubreddits) {
        if (allMemes.length >= 50) break; // Stop if we have enough memes

        // Add delay between requests
        if (allMemes.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const memes = await fetchSubredditMemes(subreddit);
        allMemes = [...allMemes, ...memes];
      }

      attempts++;
      
      if (allMemes.length === 0 && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
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