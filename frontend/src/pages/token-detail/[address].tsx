import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { Navbar } from '../../components/Navbar';
import abi from '../../constants/TokenLaunchpad.json';
import tokenabi from '../../constants/Token.json';
import { MemeToken } from '../../types';
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
          tokenContract.totalSupply()
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
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTokenData();

    return () => {
      isMounted = false;
      provider = null;
      contract = null;
      tokenContract = null;
    };
  }, [address]);

  const calculateCost = async () => {
    if (!purchaseAmount || isNaN(Number(purchaseAmount)) || Number(purchaseAmount) <= 0) {
      setError('Please enter a valid amount');
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
      setError(error.message || 'Error calculating cost. Please try again.');
    }
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (chainId !== CHAIN_ID) {
      setError('Please switch to Sepolia network');
      return;
    }

    try {
      setError(null);
      setTransactionPending(true);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi.abi,
        signer
      );

      const transaction = await contract.buyMemeToken(address, purchaseAmount, {
        value: ethers.parseUnits(cost, 'ether'),
      });

      await transaction.wait();
      router.push('/');
    } catch (error: any) {
      console.error('Error purchasing tokens:', error);
      if (error.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by user');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        setError('Insufficient funds to purchase tokens');
      } else {
        setError(error.message || 'Error purchasing tokens. Please try again.');
      }
    } finally {
      setTransactionPending(false);
      setIsModalOpen(false);
    }
  };

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
            onClick={() => router.push('/')} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-64">
          <div className="error-message mb-4">Token not found</div>
          <button 
            onClick={() => router.push('/')} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => router.push('/')}
          className="mb-6 text-blue-500 hover:text-blue-600 flex items-center"
        >
          ← Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="aspect-w-16 aspect-h-9 relative">
            <img 
              src={tokenData.imageUrl} 
              alt={tokenData.name} 
              className="object-cover w-full h-64"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.png';
              }}
            />
          </div>

          <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">{tokenData.name}</h1>
            <p className="text-xl text-gray-600 mb-4">{tokenData.symbol}</p>
            <p className="text-gray-700 mb-6">{tokenData.description}</p>
            <p className="text-lg font-semibold mb-8">Available Supply: {totalSupply} tokens</p>

            <div className="space-y-4">
              <input
                type="number"
                value={purchaseAmount}
                onChange={(e) => {
                  setPurchaseAmount(e.target.value);
                  setError(null);
                }}
                placeholder="Amount to purchase"
                className="input-field"
                min="1"
                disabled={loading}
              />
              <button 
                onClick={calculateCost} 
                className="create-button"
                disabled={loading || !purchaseAmount || isNaN(Number(purchaseAmount)) || Number(purchaseAmount) <= 0}
              >
                Calculate Cost
              </button>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h2 className="text-2xl font-bold mb-4">Confirm Purchase</h2>
              <div className="space-y-2 mb-6">
                <p className="text-gray-700">Amount: {purchaseAmount} tokens</p>
                <p className="text-gray-700">Cost: {cost} ETH</p>
              </div>
              <div className="modal-buttons">
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="cancel-button"
                  disabled={transactionPending}
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePurchase} 
                  className="confirm-button"
                  disabled={transactionPending}
                >
                  {transactionPending ? 'Processing...' : 'Confirm Purchase'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenDetail;
