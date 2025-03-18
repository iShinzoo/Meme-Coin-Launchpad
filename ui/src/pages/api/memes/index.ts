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

async function fetchSubredditMemes(subreddit: string): Promise<Meme[]> {
  try {
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=50`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MyMemeApp/1.0;)'
      },
      next: { revalidate: 60 } // Cache for 1 minute
    });

    if (!response.ok) {
      console.error(`Error fetching memes from ${subreddit}: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    
    if (!data?.data?.children) {
      console.error(`Unexpected response structure from ${subreddit}`);
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
      }));
  } catch (error) {
    console.error(`Error fetching memes from ${subreddit}:`, error);
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check cache
    const cached = cache.get('memes');
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.status(200).json({ memes: cached.memes });
    }

    // Get unique random subreddits
    const selectedSubreddits = [...new Set(
      Array.from({ length: 3 }, () => 
        SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)]
      )
    )];

    const allMemes: Meme[] = [];
    await Promise.all(
      selectedSubreddits.map(async (subreddit) => {
        const memes = await fetchSubredditMemes(subreddit);
        if (memes.length > 0) {
          allMemes.push(...memes);
        }
      })
    );

    if (allMemes.length === 0) {
      return res.status(503).json({ 
        error: 'Unable to fetch memes at this time. Please try again later.' 
      });
    }

    const shuffledMemes = allMemes
      .sort(() => Math.random() - 0.5)
      .slice(0, 50);
    
    // Cache the results
    cache.set('memes', { memes: shuffledMemes, timestamp: Date.now() });

    return res.status(200).json({ memes: shuffledMemes });
  } catch (error) {
    console.error('Error fetching memes:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch memes. Please try again later.'
    });
  }
}