export const getValidImageUrl = (url: string | undefined | null): string => {
  if (!url) return '/coin.png';
  
  try {
    new URL(url);
    return url;
  } catch {
    return '/coin.png';
  }
}; 