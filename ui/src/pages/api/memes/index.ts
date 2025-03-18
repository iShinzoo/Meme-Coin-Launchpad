import { NextApiRequest, NextApiResponse } from 'next';
import { Meme } from '../../../types';

const SUBREDDITS = [
  'memes',
  'dankmemes',
  'wholesomememes',
  'funny',
  'me_irl',
  'ProgrammerHumor',
  'memeeconomy',
  'PrequelMemes'
];

const cache = new Map<string, { memes: Meme[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchSubredditMemes(subreddit: string): Promise<Meme[]> {
  try {
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=50`, {
      headers: {
        'User-Agent': 'MyMemeApp/1.0 (contact@example.com)' // Replace with your contact info
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.data.children
      .filter((post: any) => {
        const url = post.data.url.toLowerCase();
        return (
          !post.data.over_18 &&
          (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.gif'))
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
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get random subreddits (3 at a time)
    const selectedSubreddits = Array.from({ length: 3 }, () => 
      SUBREDDITS[Math.floor(Math.random() * SUBREDDITS.length)]
    );

    const allMemes: Meme[] = [];

    await Promise.all(
      selectedSubreddits.map(async (subreddit) => {
        const cacheKey = `memes_${subreddit}`;
        const cached = cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          allMemes.push(...cached.memes);
        } else {
          const memes = await fetchSubredditMemes(subreddit);
          cache.set(cacheKey, { memes, timestamp: Date.now() });
          allMemes.push(...memes);
        }
      })
    );

    // Shuffle memes
    const shuffledMemes = allMemes
      .sort(() => Math.random() - 0.5)
      .slice(0, 50);

    return res.status(200).json({ memes: shuffledMemes });
  } catch (error) {
    console.error('Error fetching memes:', error);
    return res.status(500).json({ error: 'Failed to fetch memes' });
  }
} 