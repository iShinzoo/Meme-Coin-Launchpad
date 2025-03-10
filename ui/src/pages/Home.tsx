import 'react-toastify/dist/ReactToastify.css';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
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
      toast.error('Please connect your wallet first');
      setError('Please connect your wallet first');
      return;
    }

    if (chainId !== CHAIN_ID) {
      toast.error('Please switch to Sepolia network');
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full md:w-2/3 lg:w-1/2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span>Search</span>
              </div>
              <input
                type="text"
                placeholder="Search by name or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
              />
            </div>
          </div>
          
          <motion.button
            onClick={handleCreateToken}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Create New Token</span>
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
          </div>
        ) : error ? (
          <motion.div 
            className="flex flex-col items-center justify-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-red-500 text-lg mb-4 bg-red-50 px-6 py-4 rounded-lg shadow-sm">
              {error}
            </div>
            <motion.button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-primary-600 text-white rounded-lg shadow hover:bg-primary-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Retry
            </motion.button>
          </motion.div>
        ) : filteredCards.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            {filteredCards.map((card, index) => (
              <motion.div
                key={card.tokenAddress}
                onClick={() => navigateToTokenDetail(card.tokenAddress)}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative aspect-w-16 aspect-h-9">
                  <img 
                    src={card.imageUrl} 
                    alt={card.name}
                    className="object-cover w-full h-48"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <span className="bg-primary-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
                      {card.symbol}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{card.name}</h3>
                  <p className="text-gray-500 text-sm line-clamp-2">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <motion.p 
              className="text-gray-500 text-lg bg-white px-8 py-6 rounded-xl shadow-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {searchTerm ? 'No tokens found matching your search.' : 'No tokens available yet.'}
            </motion.p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;