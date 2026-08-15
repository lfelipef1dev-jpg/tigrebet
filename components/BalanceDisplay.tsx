'use client'

import { motion } from 'framer-motion'
import { Wallet, TrendingUp } from 'lucide-react'

interface BalanceDisplayProps {
  balance: number
}

export default function BalanceDisplay({ balance }: BalanceDisplayProps) {
  return (
    <motion.div
      className="flex items-center gap-3 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 backdrop-blur-xl rounded-full px-6 py-3 border-2 border-yellow-400/50 shadow-2xl"
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0, x: 50 }}
      animate={{ scale: 1, x: 0 }}
      transition={{ type: "spring" }}
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Wallet className="w-6 h-6 text-yellow-400" />
      </motion.div>
      <div className="flex flex-col">
        <span className="text-white/70 text-xs font-semibold">SALDO</span>
        <motion.span
          className="text-white font-black text-xl"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          R$ {balance.toFixed(2)}
        </motion.span>
      </div>
      {balance > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-green-500 rounded-full p-1"
        >
          <TrendingUp className="w-4 h-4 text-white" />
        </motion.div>
      )}
    </motion.div>
  )
}
