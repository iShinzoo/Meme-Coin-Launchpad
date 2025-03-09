import { useAccount, useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useEffect, useState } from 'react';

export function useWalletCheck() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }

    if (chainId !== sepolia.id) {
      setError('Please switch to Sepolia network');
      return;
    }

    setError(null);
  }, [isConnected, chainId]);

  return {
    address,
    isConnected,
    isCorrectNetwork: chainId === sepolia.id,
    error
  };
}
