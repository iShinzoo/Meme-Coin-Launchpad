export interface MemeToken {
  name: string;
  symbol: string;
  imageUrl: string;
  description: string;
  tokenAddress: string;
}

export interface TokenLaunchpadContract {
  createMemeToken: (name: string, symbol: string, imageUrl: string, description: string, options: { value: bigint }) => Promise<any>;
  buyMemeToken: (tokenAddress: string, amount: number, options: { value: bigint }) => Promise<any>;
  getAllMemeTokens: () => Promise<MemeToken[]>;
}
