"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/router"
import { ethers } from "ethers"
import { motion } from "framer-motion"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { AlertCircle, ArrowLeft, Rocket } from "lucide-react"
import { Navbar } from "../components/Navbar"
import { useWalletCheck } from "../hooks/useWalletCheck"
import abi from "../constants/TokenLaunchpad.json"

const TokenCreate: React.FC = () => {
  const [name, setName] = useState("")
  const [ticker, setTicker] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { error } = useWalletCheck()
  const CONTRACT_TLABI = abi.abi

  const handleCreate = async () => {
    if (!name || !ticker) {
      toast.error("Name and ticker are required fields")
      return
    }

    try {
      setIsSubmitting(true)
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!, CONTRACT_TLABI, signer)

      toast.info("Please confirm the transaction in your wallet")

      const transaction = await contract.createMemeToken(name, ticker, imageUrl, description, {
        value: ethers.parseEther("0.0001"),
      })

      toast.info("Transaction submitted, waiting for confirmation...")

      const receipt = await transaction.wait()
      toast.success("Token created successfully!")
      router.push("/")
    } catch (error: any) {
      console.error("Error creating token:", error)
      if (error.code === "ACTION_REJECTED") {
        toast.error("Transaction was rejected by user")
      } else {
        toast.error("Error creating token. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <motion.button
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 text-yellow-500 mb-6 hover:text-yellow-400 transition-colors"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </motion.button>

          <div className="bg-zinc-900 rounded-xl shadow-lg overflow-hidden border border-zinc-800">
            <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 py-6 px-8 border-b border-zinc-800">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Rocket className="h-5 w-5 text-yellow-500" />
                Create New MemeToken
              </h1>
            </div>

            <div className="p-8">
              <div className="bg-zinc-800/50 rounded-lg p-4 mb-6 border border-zinc-700">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-zinc-300 space-y-1">
                    <p>MemeCoin creation fee: 0.0001 ETH</p>
                    <p>Max supply: 1 million tokens. Initial mint: 200k tokens.</p>
                    <p>If funding target of 24 ETH is met, a liquidity pool will be created on Uniswap.</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1">
                    Token Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="e.g. Doge Coin"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border-zinc-700 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label htmlFor="ticker" className="block text-sm font-medium text-zinc-300 mb-1">
                    Ticker Symbol
                  </label>
                  <input
                    id="ticker"
                    type="text"
                    placeholder="e.g. DOGE"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border-zinc-700 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    placeholder="Tell us about your meme coin..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg bg-zinc-800 border-zinc-700 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-zinc-300 mb-1">
                    Image URL
                  </label>
                  <input
                    id="imageUrl"
                    type="text"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border-zinc-700 text-white shadow-sm focus:border-yellow-500 focus:ring-yellow-500"
                  />
                </div>

                <motion.button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-black font-medium ${
                    isSubmitting
                      ? "bg-zinc-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
                  } shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all`}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="h-5 w-5 mr-2" />
                      <span>Create MemeToken</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default TokenCreate

