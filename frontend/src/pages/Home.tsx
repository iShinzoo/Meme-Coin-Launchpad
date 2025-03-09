import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { Navbar } from '../components/Navbar';
import abi from '../constants/TokenLaunchpad.json';
import { MemeToken } from '../types';
import { CONTRACT_ADDRESS, CHAIN_ID } from '../constants/config';

const Home: React.FC = () => {
  const [cards, setCards] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const router = useRouter();
  const { isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    let isMounted = true;
    let provider: ethers.JsonRpcProvider | null = null;
    let contract: ethers.Contract | null = null;

    const fetchCards = async () => {
      try {
        setLoading(true);
        setError(null);

        provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);
        
        const memeTokens = await contract.getAllMemeTokens();
        
        if (isMounted) {
          const formattedTokens = Array.isArray(memeTokens) ? memeTokens.map((token: any) => ({
            name: token.name || '',
            symbol: token.symbol || '',
            imageUrl: token.imageUrl || '',
            description: token.description || '',
            tokenAddress: token.tokenAddress || ''
          })) : [];
          
          setCards(formattedTokens);
        }
      } catch (error: any) {
        console.error('Error fetching cards:', error);
        if (isMounted) {
          setError(error.message || 'Error fetching tokens. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCards();

    return () => {
      isMounted = false;
      provider = null;
      contract = null;
    };
  }, []);

  const handleCreateToken = () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (chainId !== CHAIN_ID) {
      setError('Please switch to Sepolia network');
      return;
    }

    router.push('/token-create');
  };

  const navigateToTokenDetail = (tokenAddress: string) => {
    router.push(`/token-detail/${tokenAddress}`);
  };

  const filteredCards = cards.filter(card =>
    card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-64">
          <div className="error-message mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="w-full max-w-md">
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCreateToken}
            className="ml-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create New Token
          </button>
        </div>

        {filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <div
                key={card.tokenAddress}
                onClick={() => navigateToTokenDetail(card.tokenAddress)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img 
                    src={card.imageUrl} 
                    alt={card.name}
                    className="object-cover w-full h-48"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.png';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{card.name}</h3>
                  <p className="text-gray-600 mb-2">{card.symbol}</p>
                  <p className="text-gray-500 text-sm line-clamp-2">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'No tokens found matching your search.' : 'No tokens available yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;