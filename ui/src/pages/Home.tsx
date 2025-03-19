import 'react-toastify/dist/ReactToastify.css';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import { Navbar } from '../components/Navbar';
import { Search, Sparkles, ChevronLeft, Rocket, Zap } from 'lucide-react';
import abi from '../constants/TokenLaunchpad.json';
import { MemeToken } from '../types';
import { CONTRACT_ADDRESS, CHAIN_ID } from '../constants/config';
import Image from 'next/image';

const Home: React.FC = () => {
  const [cards, setCards] = useState<MemeToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [tokenImage, setTokenImage] = useState<string>('');
  const [tokenImages, setTokenImages] = useState<Map<string, string>>(new Map());
  
  const router = useRouter();
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

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

  useEffect(() => {
    // Check for token image in localStorage
    const savedTokenImage = localStorage.getItem('tokenImage');
    if (savedTokenImage) {
      setTokenImage(savedTokenImage);
    }
  }, []);

  useEffect(() => {
    // Load created tokens from localStorage
    const loadCreatedTokens = () => {
      try {
        const savedTokens = JSON.parse(localStorage.getItem('createdTokens') || '[]');
        const imageMap = new Map();
        savedTokens.forEach((token: { address: string; imageUrl: string }) => {
          imageMap.set(token.address, token.imageUrl);
        });
        setTokenImages(imageMap);
      } catch (error) {
        console.error('Error loading token images:', error);
      }
    };

    loadCreatedTokens();
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

  const getTokenImage = (tokenAddress: string): string => {
    return tokenImages.get(tokenAddress) || '/coin.png';
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black"></div>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-yellow-500/20 blur-3xl"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              opacity: Math.random() * 0.5,
              transform: `translate(-50%, -50%)`,
              animation: `float ${Math.random() * 10 + 20}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Mouse follower */}
      <div
        className="fixed w-40 h-40 rounded-full bg-yellow-500/10 blur-xl pointer-events-none z-0"
        style={{
          left: mousePosition.x,
          top: mousePosition.y,
          transform: "translate(-50%, -50%)",
        }}
      />

      <Navbar />
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full md:w-2/3 lg:w-1/2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-yellow-500" />
              </div>
              <input
                type="text"
                placeholder="Search by name or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800 focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/30 text-white placeholder-zinc-500 shadow-sm backdrop-blur-sm"
              />
            </div>
          </div>
          
          <motion.button
            onClick={handleCreateToken}
            className="w-full md:w-auto px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="h-5 w-5" />
            <span>Create New Token</span>
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
          </div>
        ) : error ? (
          <motion.div 
            className="flex flex-col items-center justify-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-red-400 text-lg mb-4 bg-red-900/20 border border-red-800/50 px-6 py-4 rounded-lg backdrop-blur-sm">
              {error}
            </div>
            <motion.button 
              onClick={() => window.location.reload()} 
              className="px-6 py-2 bg-yellow-500 text-black font-bold rounded-full shadow hover:bg-yellow-600 transition-colors"
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
                className="bg-zinc-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-zinc-800 hover:border-yellow-500/50 shadow-md hover:shadow-yellow-500/10 transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative aspect-w-16 aspect-h-9">
                  <Image
                    src={card.imageUrl || '/coin.png'}
                    alt={card.name}
                    width={400}
                    height={300}
                    className="object-cover w-full h-48"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/coin.png';
                    }}
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-4">
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                      {card.symbol}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2 text-white">{card.name}</h3>
                  <p className="text-zinc-400 text-sm line-clamp-2">{card.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <motion.div 
              className="text-zinc-400 text-lg bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 px-8 py-6 rounded-xl shadow-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {searchTerm ? 'No tokens found matching your search.' : 'No tokens available yet. Be the first to create one!'}
            </motion.div>
          </div>
        )}

        {/* Show token image if available */}
        {tokenImage && (
          <div className="mt-4">
            <h2>Your Token Image</h2>
            <Image
              src={tokenImage || '/coin-placeholder.png'}
              alt="Token Image"
              width={300}
              height={300}
              className="rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/coin-placeholder.png';
              }}
              unoptimized
            />
          </div>
        )}

        {/* Show recently created token section */}
        {tokenImages.size > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Your Recently Created Tokens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from(tokenImages).map(([address, imageUrl], index) => {
                const token = cards.find(card => card.tokenAddress === address);
                if (!token) return null;

                return (
                  <motion.div
                    key={address}
                    className="bg-zinc-900/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Image
                      src={imageUrl}
                      alt={token.name}
                      width={200}
                      height={200}
                      className="rounded-lg mb-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/coin.png';
                      }}
                      unoptimized
                    />
                    <h3 className="text-lg font-semibold">{token.name}</h3>
                    <p className="text-sm text-zinc-400">{token.symbol}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;