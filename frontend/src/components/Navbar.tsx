import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link href="/" className="nav-brand">
          MemeCoin Launchpad
        </Link>
        <Link href="https://moralis.io" target="_blank" className="nav-link">
          Moralis
        </Link>
        <Link href="https://docs.uniswap.org/" target="_blank" className="nav-link">
          Uniswap Docs
        </Link>
      </div>
      <ConnectButton />
    </nav>
  );
}
