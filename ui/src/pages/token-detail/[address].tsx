"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { ethers } from "ethers"
import { useAccount, useChainId } from "wagmi"
import { motion, AnimatePresence } from "framer-motion"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Navbar } from "../../components/Navbar"
import abi from "../../constants/TokenLaunchpad.json"
import tokenabi from "../../constants/Token.json"
import { CONTRACT_ADDRESS, CHAIN_ID } from "../../constants/config"
import { ArrowLeft, Rocket, X } from "lucide-react"

interface TokenData {
  name: string
  symbol: string
  imageUrl: string
  description: string
  tokenAddress: string
  totalSupply: number
}

const TokenDetail: React.FC = () => {
  const [tokenData, setTokenData] = useState<TokenData | null>(null)
  const [totalSupply, setTotalSupply] = useState<number>(0)
  const [purchaseAmount, setPurchaseAmount] = useState<string>("")
  const [cost, setCost] = useState<string>("0")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactionPending, setTransactionPending] = useState(false)

  const router = useRouter()
  const { address } = router.query
  const { isConnected } = useAccount()
  const chainId = useChainId()

  useEffect(() => {
    let isMounted = true
    let provider: ethers.JsonRpcProvider | null = null
    let contract: ethers.Contract | null = null
    let tokenContract: ethers.Contract | null = null

    const fetchTokenData = async () => {
      if (!address || typeof address !== "string") return

      try {
        setLoading(true)
        setError(null)

        provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
        contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider)
        tokenContract = new ethers.Contract(address, tokenabi.abi, provider)

        const [tokens, totalSupplyResponse] = await Promise.all([
          contract.getAllMemeTokens(),
          tokenContract.totalSupply(),
        ])

        if (!isMounted) return

        const token = tokens.find((t: TokenData) => t.tokenAddress.toLowerCase() === address.toLowerCase())

        if (!token) {
          setError("Token not found")
          return
        }

        setTokenData(token)
        const totalSupplyFormatted = Number.parseInt(ethers.formatUnits(totalSupplyResponse, "ether")) - 200000
        setTotalSupply(totalSupplyFormatted)
      } catch (error: any) {
        console.error("Error fetching token data:", error)
        if (isMounted) {
          setError(error.message || "Error fetching token data. Please try again.")
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchTokenData()

    return () => {
      isMounted = false
    }
  }, [address])

  const calculateCost = async () => {
    if (!purchaseAmount || isNaN(Number(purchaseAmount)) || Number(purchaseAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    try {
      setError(null)
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, provider)

      const costInWei = await contract.calculateCost(totalSupply, purchaseAmount)
      setCost(ethers.formatUnits(costInWei, "ether"))
      setIsModalOpen(true)
    } catch (error: any) {
      console.error("Error calculating cost:", error)
      toast.error(error.message || "Error calculating cost. Please try again.")
    }
  }

  const handlePurchase = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    if (chainId !== CHAIN_ID) {
      toast.error("Please switch to Sepolia network")
      return
    }

    try {
      setTransactionPending(true)
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_ADDRESS, abi.abi, signer)

      const transaction = await contract.buyMemeToken(address, purchaseAmount, {
        value: ethers.parseUnits(cost, "ether"),
      })

      await transaction.wait()
      toast.success("Tokens purchased successfully!")

      setTimeout(() => router.push("/"), 2000)
    } catch (error: any) {
      console.error("Error purchasing tokens:", error)
      toast.error(error.message || "Error purchasing tokens. Please try again.")
    } finally {
      setTransactionPending(false)
      setIsModalOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex justify-center items-center h-[70vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-yellow-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-red-400 bg-red-900/20 p-6 rounded-xl border border-red-800 max-w-md mx-auto">
            {error}
            <motion.button
              onClick={() => router.push("/")}
              className="mt-4 px-6 py-2 bg-yellow-500 text-black rounded-lg shadow hover:bg-yellow-600 transition-colors flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </motion.button>
          </div>
        </div>
      </div>
    )
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
          {/* Back Button */}
          <motion.button
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 text-yellow-500 mb-6 hover:text-yellow-400 transition-colors"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </motion.button>

          {/* Token Info */}
          {tokenData && (
            <motion.div
              className="bg-zinc-900 p-6 rounded-xl shadow-lg border border-zinc-800"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative mb-4">
                <img
                  src={tokenData.imageUrl || "/placeholder.svg"}
                  alt={tokenData.name}
                  className="h-40 w-full object-cover rounded-lg"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.png"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-lg"></div>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold">{tokenData.name}</h2>
                <span className="bg-yellow-500 text-black px-2 py-1 rounded-md text-xs font-semibold">
                  {tokenData.symbol}
                </span>
              </div>

              <p className="text-zinc-400 mb-4">{tokenData.description}</p>

              <div className="bg-zinc-800/50 p-4 rounded-lg mb-6 flex items-center justify-between">
                <span className="text-zinc-300">Total Supply:</span>
                <span className="text-yellow-500 font-bold">{totalSupply.toLocaleString()}</span>
              </div>

              {/* Purchase Form */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Purchase Tokens</h3>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    placeholder="Amount to Purchase"
                    className="flex-1 border border-zinc-700 bg-zinc-800 p-3 rounded-lg text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <motion.button
                    onClick={calculateCost}
                    className="bg-yellow-500 text-black px-6 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2 font-medium"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Rocket className="h-4 w-4" />
                    Calculate Cost
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-zinc-900 rounded-xl p-6 max-w-md w-full border border-zinc-800"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Confirm Purchase</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="font-medium">{purchaseAmount} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Cost:</span>
                  <span className="font-medium text-yellow-500">{cost} ETH</span>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 border border-zinc-700 rounded-lg hover:bg-zinc-800"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handlePurchase}
                  disabled={transactionPending}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    transactionPending
                      ? "bg-zinc-700 cursor-not-allowed"
                      : "bg-yellow-500 hover:bg-yellow-600 text-black"
                  }`}
                  whileHover={{ scale: transactionPending ? 1 : 1.02 }}
                  whileTap={{ scale: transactionPending ? 1 : 0.98 }}
                >
                  {transactionPending ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                      <Rocket className="h-4 w-4" />
                      <span>Confirm Purchase</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TokenDetail

