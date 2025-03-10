import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Navbar } from '../../components/Navbar';
import abi from '../../constants/TokenLaunchpad.json';
import tokenabi from '../../constants/Token.json';
import { CONTRACT_ADDRESS, CHAIN_ID } from '../../constants/config';

interface TokenData {
  name: string;
  symbol: string;
  imageUrl: string;
  description: string;
  tokenAddress: string;
  totalSupply: number;
}

const TokenDetail: React.FC = () => {
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [cost, setCost] = useState<string>('0');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionPending, setTransactionPending] = useState(false);

  const router = useRouter();
  const { address } = router.query;
  const { isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    let isMounted = true;
    let provider: ethers.JsonRpcProvider | null = null;
    let contract: ethers.Contract | null = null;
    let tokenContract: ethers.Contract | null = null;

    const fetchTokenData = async () => {
      if (!address || typeof address !== 'string') return;

      try {
        setLoading(true);
        setError(null);

        provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
        contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);
        tokenContract = new ethers.Contract(address, tokenabi.abi, provider);

        const [tokens, totalSupplyResponse] = await Promise.all([
          contract.getAllMemeTokens(),
          tokenContract.totalSupply(),
        ]);

        if (!isMounted) return;

        const token = tokens.find((t: TokenData) =>
          t.tokenAddress.toLowerCase() === address.toLowerCase()
        );

        if (!token) {
          setError('Token not found');
          return;
        }

        setTokenData(token);
        const totalSupplyFormatted = parseInt(ethers.formatUnits(totalSupplyResponse, 'ether')) - 200000;
        setTotalSupply(totalSupplyFormatted);
      } catch (error: any) {
        console.error('Error fetching token data:', error);
        if (isMounted) {
          setError(error.message || 'Error fetching token data. Please try again.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTokenData();

    return () => {
      isMounted = false;
    };
  }, [address]);

  const calculateCost = async () => {
    if (!purchaseAmount || isNaN(Number(purchaseAmount)) || Number(purchaseAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setError(null);
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider);

      const costInWei = await contract.calculateCost(totalSupply, purchaseAmount);
      setCost(ethers.formatUnits(costInWei, 'ether'));
      setIsModalOpen(true);
    } catch (error: any) {
      console.error('Error calculating cost:', error);
      toast.error(error.message || 'Error calculating cost. Please try again.');
    }
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (chainId !== CHAIN_ID) {
      toast.error('Please switch to Sepolia network');
      return;
    }

    try {
      setTransactionPending(true);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer);

      const transaction = await contract.buyMemeToken(address, purchaseAmount, {
        value: ethers.parseUnits(cost, 'ether'),
      });

      await transaction.wait();
      toast.success('Tokens purchased successfully!');

      setTimeout(() => router.push('/'), 2000);
    } catch (error: any) {
      console.error('Error purchasing tokens:', error);
      toast.error(error.message || 'Error purchasing tokens. Please try again.');
    } finally {
      setTransactionPending(false);
      setIsModalOpen(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  if (error) return <div className="text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="max-w-2xl mx-auto p-6">
        {/* Back Button */}
        <button onClick={() => router.push('/')} className="flex items-center space-x-2 text-blue-600">
          <span>Back</span>
        </button>

        {/* Token Info */}
        {tokenData && (
          <div className="mt-6 bg-white p-6 rounded-lg shadow">
            <img src={tokenData.imageUrl} alt={tokenData.name} className="h-40 w-full object-cover rounded-md" />
            <h2 className="text-2xl font-bold mt-4">{tokenData.name} ({tokenData.symbol})</h2>
            <p className="text-gray-600 mt-2">{tokenData.description}</p>
            <p className="mt-4">Total Supply: {totalSupply.toLocaleString()}</p>

            {/* Purchase Form */}
            <div className="mt-6">
              <input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="Amount to Purchase"
                className="border p-3 rounded-md w-full"
              />
              <button
                onClick={calculateCost}
                className="bg-blue-600 text-white px-6 py-2 mt-4 rounded-md hover:bg-blue-700"
              >
                Calculate Cost
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetail;
