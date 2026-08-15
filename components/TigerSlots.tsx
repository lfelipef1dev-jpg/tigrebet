'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface TigerSlotsProps {
  balance: number
  onWin: (amount: number) => void
  onPlay: (cost: number) => void
}

const SYMBOLS = ["🐯", "💰", "🍀", "💎", "7️⃣"]

export default function TigerSlots({ balance, onWin, onPlay }: TigerSlotsProps) {
  const [isSpinning, setIsSpinning] = useState(false)
  const [reels, setReels] = useState<string[]>(['🐯', '💰', '🍀', '💎', '7️⃣', '🐯', '💰', '🍀', '💎'])
  const [winAmount, setWinAmount] = useState(0)
  const [betAmount, setBetAmount] = useState(10)
  const [showWin, setShowWin] = useState(false)
  const [winningCells, setWinningCells] = useState<number[]>([])

  const triggerConfetti = () => {
    const duration = 2000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) {
        return clearInterval(interval)
      }
      const particleCount = 50 * (timeLeft / duration)
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)
  }

  const spin = () => {
    if (balance < betAmount) {
      alert('Sem saldo!')
      return
    }
    
    onPlay(betAmount)
    setIsSpinning(true)
    setShowWin(false)
    setWinAmount(0)
    setWinningCells([])
    
    // Animação de spin
    let spinCount = 0
    const maxSpins = 20
    const spinInterval = setInterval(() => {
      const newReels = reels.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
      setReels(newReels)
      spinCount++
      
      if (spinCount >= maxSpins) {
        clearInterval(spinInterval)
        finalizeSpin()
      }
    }, 100)
  }

  const finalizeSpin = () => {
    setIsSpinning(false)
    
    // Verificar vitória
    const newReels = reels.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)])
    setReels(newReels)
    
    // Verificar linhas de vitória
    const winningIndices: number[] = []
    
    // Linha horizontal 1
    if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) {
      winningIndices.push(0, 1, 2)
    }
    // Linha horizontal 2
    if (newReels[3] === newReels[4] && newReels[4] === newReels[5]) {
      winningIndices.push(3, 4, 5)
    }
    // Linha horizontal 3
    if (newReels[6] === newReels[7] && newReels[7] === newReels[8]) {
      winningIndices.push(6, 7, 8)
    }
    // Linha vertical 1
    if (newReels[0] === newReels[3] && newReels[3] === newReels[6]) {
      winningIndices.push(0, 3, 6)
    }
    // Linha vertical 2
    if (newReels[1] === newReels[4] && newReels[4] === newReels[7]) {
      winningIndices.push(1, 4, 7)
    }
    // Linha vertical 3
    if (newReels[2] === newReels[5] && newReels[5] === newReels[8]) {
      winningIndices.push(2, 5, 8)
    }
    // Diagonal 1
    if (newReels[0] === newReels[4] && newReels[4] === newReels[8]) {
      winningIndices.push(0, 4, 8)
    }
    // Diagonal 2
    if (newReels[2] === newReels[4] && newReels[4] === newReels[6]) {
      winningIndices.push(2, 4, 6)
    }
    
    if (winningIndices.length > 0) {
      const uniqueWinningIndices = [...new Set(winningIndices)]
      setWinningCells(uniqueWinningIndices)
      const multiplier = Math.floor(uniqueWinningIndices.length / 3)
      const win = betAmount * (multiplier + 1)
      setWinAmount(win)
      setShowWin(true)
      onWin(win)
      triggerConfetti()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto p-4">
      {/* TOPO */}
      <div className="w-full flex justify-between items-center bg-gradient-to-r from-red-900 to-red-950 rounded-xl p-4 border-2 border-yellow-500">
        <div className="text-white font-bold">
          Saldo: <span className="text-yellow-400">R$ {balance}</span>
        </div>
        <div className="text-white font-bold">
          Ganho: <span className="text-green-400">R$ {winAmount}</span>
        </div>
      </div>

      {/* REELS 3x3 */}
      <div className="w-full bg-gradient-to-br from-red-950 to-black rounded-xl p-3 border-4 border-yellow-500 shadow-2xl">
        <div className="grid grid-cols-3 gap-2">
          {reels.map((symbol, index) => (
            <motion.div
              key={index}
              className={`aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center text-4xl border-2 ${
                winningCells.includes(index) ? 'border-yellow-400 win-glow' : 'border-yellow-600'
              } ${isSpinning ? 'spinning' : ''}`}
              animate={{
                rotateY: isSpinning ? 360 : 0,
              }}
              transition={{
                duration: 0.1,
                repeat: isSpinning ? Infinity : 0,
                ease: "linear"
              }}
            >
              {symbol}
            </motion.div>
          ))}
        </div>
      </div>

      {/* CONTROLES DE APOSTA */}
      <div className="w-full flex items-center justify-center gap-4 bg-gradient-to-r from-red-900 to-red-950 rounded-xl p-4 border-2 border-yellow-500">
        <button
          onClick={() => setBetAmount(Math.max(10, betAmount - 10))}
          className="w-12 h-12 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl text-2xl border-2 border-yellow-400"
        >
          -
        </button>
        <div className="bg-black px-6 py-3 rounded-xl border-2 border-yellow-500 text-center min-w-24">
          <div className="text-yellow-400 text-xs font-bold">APOSTA</div>
          <div className="text-white font-bold text-xl">R$ {betAmount}</div>
        </div>
        <button
          onClick={() => setBetAmount(betAmount + 10)}
          className="w-12 h-12 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl text-2xl border-2 border-yellow-400"
        >
          +
        </button>
      </div>

      {/* BOTÃO SPIN */}
      <motion.button
        onClick={spin}
        disabled={isSpinning || balance < betAmount}
        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-2xl rounded-xl border-4 border-yellow-500 shadow-lg"
        whileHover={{ scale: isSpinning ? 1 : 1.02 }}
        whileTap={{ scale: isSpinning ? 1 : 0.98 }}
        animate={{
          boxShadow: isSpinning 
            ? ['0 0 20px rgba(255, 0, 0, 0.5)', '0 0 40px rgba(255, 0, 0, 0.8)', '0 0 20px rgba(255, 0, 0, 0.5)']
            : '0 0 20px rgba(255, 215, 0, 0.5)'
        }}
        transition={{
          duration: 0.5,
          repeat: isSpinning ? Infinity : 0
        }}
      >
        {isSpinning ? 'GIRANDO...' : 'SPIN'}
      </motion.button>

      {/* RESULTADO */}
      <AnimatePresence>
        {showWin && winAmount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-8 text-center border-4 border-yellow-300 shadow-2xl"
              style={{
                boxShadow: '0 0 50px rgba(255, 215, 0, 0.5)',
              }}
            >
              <p className="text-4xl font-black text-white mb-2">GANHOU!</p>
              <p className="text-5xl font-black text-white">R$ {winAmount}</p>
              <button
                onClick={() => setShowWin(false)}
                className="mt-4 px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200"
              >
                CONTINUAR
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .win-glow {
          animation: glow 0.5s infinite alternate;
        }
        
        @keyframes glow {
          from { 
            box-shadow: 0 0 10px gold, 0 0 20px orange;
            transform: scale(1);
          }
          to { 
            box-shadow: 0 0 30px yellow, 0 0 40px gold;
            transform: scale(1.05);
          }
        }
        
        .spinning {
          filter: blur(2px);
        }
      `}</style>
    </div>
  )
}
