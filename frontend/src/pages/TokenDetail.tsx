import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { Navbar } from '../components/Navbar';
import { useWalletCheck } from '../hooks/useWalletCheck';
import abi from '../constants/TokenLaunchpad.json';
import tokenabi from '../constants/Token.json';

interface Owner {
  owner_address: string;
  token_amount: number;
}

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
  const [owners, setOwners] = useState<Owner[]>([]);
  const [totalSupply, setTotalSupply] = useState<number>(0);
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [cost, setCost] = useState<string>('0');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { tokenAddress } = router.query;
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const CONTRACT_TLABI = abi.abi;
  const CONTRACT_TABI = tokenabi.abi;

  const providerRef = useRef<ethers.JsonRpcProvider | null>(null);
  const contractRef = useRef<ethers.Contract | null>(null);
  const tokenContractRef = useRef<ethers.Contract | null>(null);

  const setupContracts = useCallback(() => {
    if (!providerRef.current) {
      providerRef.current = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
    }
    if (!contractRef.current) {
      contractRef.current = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        CONTRACT_TLABI,
        providerRef.current
      );
    }
    if (tokenAddress && !tokenContractRef.current) {
      tokenContractRef.current = new ethers.Contract(
        tokenAddress as string,
        CONTRACT_TABI,
        providerRef.current
      );
    }
  }, [tokenAddress, CONTRACT_TLABI, CONTRACT_TABI]);

  const fetchTokenData = useCallback(async () => {
    if (!tokenAddress || typeof tokenAddress !== 'string') return;

    try {
      setLoading(true);
      setError(null);
      
      setupContracts();
      
      if (!contractRef.current || !tokenContractRef.current) {
        throw new Error('Contracts not initialized');
      }

      const tokens = await contractRef.current.getAllMemeTokens();
      const token = tokens.find((t: TokenData) => t.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
      
      if (!token) {
        setError('Token not found');
        return;
      }

      setTokenData(token);

      const totalSupplyResponse = await tokenContractRef.current.totalSupply();
      const totalSupplyFormatted = parseInt(ethers.formatUnits(totalSupplyResponse, 'ether')) - 200000;
      setTotalSupply(totalSupplyFormatted);
    } catch (error) {
      console.error('Error fetching token data:', error);
      setError('Error fetching token data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, setupContracts]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (mounted) {
        await fetchTokenData();
      }
    };

    init();

    return () => {
      mounted = false;
      // Cleanup references
      providerRef.current = null;
      contractRef.current = null;
      tokenContractRef.current = null;
    };
  }, [fetchTokenData]);

  const calculateCost = useCallback(async () => {
    if (!purchaseAmount || isNaN(Number(purchaseAmount)) || Number(purchaseAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setError(null);
      setupContracts();
      
      if (!contractRef.current) {
        throw new Error('Contract not initialized');
      }

      const costInWei = await contractRef.current.calculateCost(totalSupply, purchaseAmount);
      setCost(ethers.formatUnits(costInWei, 'ether'));
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error calculating cost:', error);
      setError('Error calculating cost. Please try again.');
    }
  }, [purchaseAmount, totalSupply, setupContracts]);

  const handlePurchase = useCallback(async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (chainId !== 11155111) { // Sepolia chainId
      alert('Please switch to Sepolia network');
      return;
    }

    try {
      setError(null);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        CONTRACT_TLABI,
        signer
      );

      const transaction = await contract.buyMemeToken(tokenAddress, purchaseAmount, {
        value: ethers.parseUnits(cost, 'ether'),
      });

      await transaction.wait();
      alert('Purchase successful!');
      setIsModalOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      setError('Error purchasing tokens. Please try again.');
    }
  }, [isConnected, chainId, tokenAddress, purchaseAmount, cost, CONTRACT_TLABI, router]);

  if (loading) {
    return (
      <div className="token-detail">
        <Navbar />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="token-detail">
        <Navbar />
        <div className="error-message">{error}</div>
        <button onClick={() => router.push('/')} className="back-button">
          Back to Home
        </button>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="token-detail">
        <Navbar />
        <div className="error-message">Token not found</div>
        <button onClick={() => router.push('/')} className="back-button">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="token-detail">
      <Navbar />
      <button onClick={() => router.push('/')} className="back-button">
        Back to Home
      </button>
      <div className="token-info">
        <img 
          src={tokenData.imageUrl} 
          alt={tokenData.name} 
          className="token-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.png';
          }}
        />
        <h1>{tokenData.name}</h1>
        <p className="symbol">{tokenData.symbol}</p>
        <p className="description">{tokenData.description}</p>
        <p className="supply">Total Supply: {totalSupply}</p>
      </div>

      <div className="purchase-section">
        <input
          type="number"
          value={purchaseAmount}
          onChange={(e) => setPurchaseAmount(e.target.value)}
          placeholder="Amount to purchase"
          className="purchase-input"
          min="1"
          disabled={loading}
        />
        <button 
          onClick={calculateCost} 
          className="calculate-button"
          disabled={loading || !purchaseAmount || isNaN(Number(purchaseAmount)) || Number(purchaseAmount) <= 0}
        >
          Calculate Cost
        </button>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Purchase</h2>
            <p>Amount: {purchaseAmount} tokens</p>
            <p>Cost: {cost} ETH</p>
            <div className="modal-buttons">
              <button 
                onClick={handlePurchase} 
                className="confirm-button"
                disabled={loading}
              >
                Confirm
              </button>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="cancel-button"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenDetail;