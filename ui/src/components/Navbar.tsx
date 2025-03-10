import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function Navbar() {
  return (
    <motion.nav 
      className="bg-gradient-to-r from-blue-600 to-purple-600 py-6 px-8 shadow-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-white font-bold text-3xl"
            >
              🚀 MemeCoin Launchpad
            </motion.div>
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link 
              href="https://moralis.io" 
              target="_blank" 
              className="text-white hover:text-yellow-200 transition-colors duration-200 text-lg"
            >
              Moralis
            </Link>
            <Link 
              href="https://docs.uniswap.org/" 
              target="_blank" 
              className="text-white hover:text-yellow-200 transition-colors duration-200 text-lg"
            >
              Uniswap Docs
            </Link>
          </div>
        </div>
        
        <ConnectButton />
      </div>
    </motion.nav>
  );
}