'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Coins, Sparkles, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'

interface ScratchCardProps {
  balance: number
  onWin: (amount: number) => void
  onPlay: (cost: number) => void
}

const PLAY_COST = 5

export default function ScratchCard({ balance, onWin, onPlay }: ScratchCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [prize, setPrize] = useState<number | null>(null)
  const [prizeText, setPrizeText] = useState('')
  const [gridSymbols, setGridSymbols] = useState<string[]>([])
  const [revealedCells, setRevealedCells] = useState<boolean[]>([])

  const triggerConfetti = () => {
    const duration = 3000
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
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }

  const generateGrid = () => {
    const symbols = ['💰', '💵', '💎', '⭐', '🎯', '🎲', '🎪', '🎭', '🔔']
    const prizeSymbols = ['💰', '💵', '💎']
    
    const hasWinningCombo = Math.random() < 0.33
    
    let grid: string[] = []
    
    if (hasWinningCombo) {
      const prizeIndex = Math.floor(Math.random() * 3)
      const winningSymbol = prizeSymbols[prizeIndex]
      
      const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8]
      const winningPositions = positions.sort(() => Math.random() - 0.5).slice(0, 3)
      
      for (let i = 0; i < 9; i++) {
        if (winningPositions.includes(i)) {
          grid.push(winningSymbol)
        } else {
          grid.push(symbols[Math.floor(Math.random() * symbols.length)])
        }
      }
    } else {
      for (let i = 0; i < 9; i++) {
        grid.push(symbols[Math.floor(Math.random() * symbols.length)])
      }
    }
    
    setGridSymbols(grid)
    setRevealedCells(new Array(9).fill(false))
  }

  const handlePlay = () => {
    if (balance < PLAY_COST) {
      alert('Saldo insuficiente! Faça um depósito.')
      return
    }
    onPlay(PLAY_COST)
    setIsPlaying(true)
    setIsRevealed(false)
    setPrize(null)
    setPrizeText('')
    generateGrid()
  }

  const checkWin = () => {
    // Contar símbolos revelados
    const symbolCounts: { [key: string]: number } = {}
    gridSymbols.forEach((symbol, index) => {
      if (revealedCells[index]) {
        symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1
      }
    })
    
    // Verificar se tem 3 símbolos iguais
    for (const [symbol, count] of Object.entries(symbolCounts)) {
      if (count >= 3) {
        const prizeMap: { [key: string]: number } = { '💰': 50, '💵': 10, '💎': 2 }
        const prizeAmount = prizeMap[symbol] || 0
        if (prizeAmount > 0) {
          setPrize(prizeAmount)
          setPrizeText(`R$ ${prizeAmount},00`)
          onWin(prizeAmount)
          triggerConfetti()
          setIsRevealed(true)
          setIsPlaying(false)
          return
        }
      }
    }
    
    // Se todas as células foram reveladas e não ganhou
    if (revealedCells.every(cell => cell)) {
      setPrize(0)
      setPrizeText('Tente novamente!')
      setIsRevealed(true)
      setIsPlaying(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {!isPlaying && !isRevealed && (
          <motion.button
            key="play-button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={handlePlay}
            disabled={balance < PLAY_COST}
            className="mb-6 px-10 py-5 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white font-bold text-2xl rounded-full shadow-2xl hover:shadow-yellow-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 relative overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Coins className="w-7 h-7" />
            </motion.span>
            Jogar (R$ {PLAY_COST.toFixed(2)})
            <Zap className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-md">
        {/* Grid 3x3 - Match 3 */}
        {isPlaying && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-4 border-4 border-white/30 shadow-2xl"
          >
            <div className="grid grid-cols-3 gap-2">
              {gridSymbols.map((symbol, index) => (
                <motion.div
                  key={index}
                  className={`relative aspect-square rounded-xl overflow-hidden ${
                    revealedCells[index] ? 'bg-gradient-to-br from-yellow-400 to-orange-400' : 'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {revealedCells[index] ? (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center text-4xl"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.5 }}
                    >
                      {symbol}
                    </motion.div>
                  ) : (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center text-2xl text-white/50 cursor-pointer"
                      whileHover={{ scale: 1.1 }}
                      onClick={() => {
                        const newRevealed = [...revealedCells]
                        newRevealed[index] = true
                        setRevealedCells(newRevealed)
                        checkWin()
                      }}
                    >
                      ❓
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Result Display */}
            {isRevealed && (
              <motion.div
                className="mt-4 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <motion.p
                  className="text-3xl font-black text-white mb-2"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: prize && prize > 0 ? 2 : 0 }}
                >
                  {prizeText}
                </motion.p>
                {prize && prize > 0 && (
                  <motion.p
                    className="text-xl text-white/90 font-bold bg-black/30 px-4 py-2 rounded-full inline-block"
                  >
                    +R$ {prize.toFixed(2)}
                  </motion.p>
                )}
                <motion.button
                  onClick={() => {
                    setIsPlaying(false)
                    setIsRevealed(false)
                    setPrize(null)
                    setPrizeText('')
                  }}
                  className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Jogar Novamente
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Result Display when not playing */}
        {!isPlaying && isRevealed && (
          <motion.div
            className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-3xl p-8 border-4 border-yellow-300 shadow-2xl text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: prize && prize > 0 ? 2 : 0 }}
            >
              <Sparkles className="w-20 h-20 mx-auto mb-4 text-white drop-shadow-lg" />
            </motion.div>
            <motion.p
              className="text-4xl font-black text-white drop-shadow-lg mb-2"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: prize && prize > 0 ? Infinity : 0 }}
            >
              {prizeText}
            </motion.p>
            {prize && prize > 0 && (
              <motion.p
                className="text-2xl text-white/95 font-bold mt-3 bg-black/30 px-4 py-2 rounded-full"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                +R$ {prize.toFixed(2)} adicionados!
              </motion.p>
            )}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isPlaying && !isRevealed && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 text-white/90 text-center text-xl font-semibold"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block mr-2"
            >
              👆
            </motion.span>
            Clique nas células para revelar! Combine 3 iguais para ganhar!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
