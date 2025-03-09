import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { ethers } from 'ethers';
import { Navbar } from '../components/Navbar';
import { useWalletCheck } from '../hooks/useWalletCheck';
import abi from '../constants/TokenLaunchpad.json';

const TokenCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const router = useRouter();
  const { error } = useWalletCheck();
  const CONTRACT_TLABI = abi.abi;

  const handleCreate = async () => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        CONTRACT_TLABI,
        signer
      );

      const transaction = await contract.createMemeToken(name, ticker, imageUrl, description, {
        value: ethers.parseEther("0.0001"),
      });
      
      const receipt = await transaction.wait();
      alert(`Transaction successful! Hash: ${receipt.hash}`);
      router.push('/');
    } catch (error) {
      console.error('Error creating token:', error);
      alert('Error creating token. Please check console for details.');
    }
  };

  return (
    <div className="app">
      <Navbar />
      <div className="content">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
        <div className="token-create-container">
          <h3 className="start-new-coin" onClick={() => router.push('/')}>Back to Home</h3>
          <div className="info-box">
            <p className="info-text">MemeCoin creation fee: 0.0001 ETH</p>
            <p className="info-text">Max supply: 1 million tokens. Initial mint: 200k tokens.</p>
            <p className="info-text">If funding target of 24 ETH is met, a liquidity pool will be created on Uniswap.</p>
          </div>
          <div className="input-container">
            <input
              type="text"
              placeholder="Token Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Ticker Symbol"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="input-field"
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input-field"
            />
            <button className="create-button" onClick={handleCreate}>
              Create MemeToken
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenCreate;
