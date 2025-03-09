import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { useAccount, useChainId } from 'wagmi';
import { Navbar } from '../components/Navbar';
import abi from '../constants/TokenLaunchpad.json';
import { CONTRACT_ADDRESS, CHAIN_ID } from '../constants/config';

const TokenCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const validateInputs = () => {
    if (!name.trim()) {
      setError('Token name is required');
      return false;
    }
    if (!ticker.trim()) {
      setError('Ticker symbol is required');
      return false;
    }
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    if (!imageUrl.trim()) {
      setError('Image URL is required');
      return false;
    }
    if (ticker.length > 5) {
      setError('Ticker symbol must be 5 characters or less');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (chainId !== CHAIN_ID) {
      setError('Please switch to Sepolia network');
      return;
    }

    if (!validateInputs()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi.abi,
        signer
      );

      const transaction = await contract.createMemeToken(
        name.trim(), 
        ticker.trim().toUpperCase(), 
        imageUrl.trim(), 
        description.trim(), 
        {
          value: ethers.parseUnits("0.0001", 'ether'),
        }
      );

      await transaction.wait();
      router.push('/');
    } catch (error: any) {
      console.error('Error creating token:', error);
      if (error.code === 'ACTION_REJECTED') {
        setError('Transaction was rejected by user');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        setError('Insufficient funds to create token');
      } else {
        setError(error.message || 'Error creating token. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="mb-6 text-blue-500 hover:text-blue-600 flex items-center"
          >
            ← Back to Home
          </button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Create New Meme Token</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Important Information</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Creation fee: 0.0001 ETH</li>
                  <li>• Max supply: 1 million tokens</li>
                  <li>• Initial mint: 200k tokens</li>
                  <li>• Liquidity pool will be created on Uniswap if funding target (24 ETH) is met</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Token Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  className="input-field"
                  disabled={loading}
                  maxLength={50}
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Ticker Symbol (max 5 characters)"
                  value={ticker}
                  onChange={(e) => {
                    setTicker(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  className="input-field"
                  disabled={loading}
                  maxLength={5}
                />
              </div>

              <div>
                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setError(null);
                  }}
                  className="input-field min-h-[100px]"
                  disabled={loading}
                  maxLength={500}
                />
              </div>

              <div>
                <input
                  type="url"
                  placeholder="Image URL (https://...)"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setError(null);
                  }}
                  className="input-field"
                  disabled={loading}
                  pattern="https?://.+"
                  title="Please enter a valid HTTP/HTTPS URL"
                />
              </div>

              <button 
                className="create-button"
                onClick={handleCreate}
                disabled={loading || !name || !ticker || !description || !imageUrl}
              >
                {loading ? 'Creating...' : 'Create MemeToken'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenCreate;