"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import Link from "next/link"
import { motion } from "framer-motion"
import { Rocket } from "lucide-react"

export function Navbar() {
  return (
    <motion.nav
      className="bg-black border-b border-zinc-800 py-4 px-8"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
    >
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center">
            <motion.div whileHover={{ scale: 1.05 }} className="text-white font-bold text-2xl flex items-center gap-2">
              <Rocket className="h-6 w-6 text-yellow-500" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
                Pump.flawk
              </span>
            </motion.div>
          </Link>

          <div className="hidden md:flex space-x-6">
            <Link href="#" className="text-zinc-400 hover:text-yellow-500 transition-colors duration-200">
              Home
            </Link>
            <Link href="#about" className="text-zinc-400 hover:text-yellow-500 transition-colors duration-200">
              About
            </Link>
            <Link href="#features" className="text-zinc-400 hover:text-yellow-500 transition-colors duration-200">
              Features
            </Link>
          </div>
        </div>

        <ConnectButton />
      </div>
    </motion.nav>
  )
}

