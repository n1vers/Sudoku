"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function MenuPage() {
  const [difficulty, setDifficulty] = useState("medium");
  const router = useRouter();

  const startGame = () => {
    router.push("/game");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full text-white bg-gradient-to-br from-[#05010f] via-[#0a0018] to-[#10002b] overflow-hidden">
      {/* 🔮 Анимированный неоновый фон */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,255,255,0.15),_transparent_70%)] blur-3xl"
      />
      <motion.div
        animate={{
          background:
            "radial-gradient(circle at bottom right, rgba(255,0,255,0.2), transparent 70%)",
        }}
        transition={{ repeat: Infinity, duration: 6, repeatType: 'mirror' }}
        className="absolute inset-0 blur-3xl"
      />

      {/* ⚡ Главный заголовок */}
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="text-6xl md:text-8xl font-extrabold mb-10 neon-text text-center tracking-widest drop-shadow-[0_0_25px_rgba(0,255,255,0.8)]"
      >
        ⚡ CYBER SUDOKU ⚡
      </motion.h1>

      {/* 🎮 Панель с настройками и кнопкой */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2 }}
        className="relative z-10 bg-[#0a0018]/70 border border-cyan-400/60 backdrop-blur-xl rounded-3xl p-10 w-[90%] max-w-[600px] shadow-[0_0_40px_rgba(0,255,255,0.4)]"
      >
        <h2 className="text-2xl text-center text-cyan-300 mb-6">
          🧩 Выбери уровень сложности
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full md:w-1/2 bg-black/60 border border-cyan-400 text-cyan-200 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-400 hover:bg-cyan-950/30 transition"
          >
            <option value="easy">Лёгкая</option>
            <option value="medium">Средняя</option>
            <option value="hard">Сложная</option>
          </select>

          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 0px 25px rgba(0,255,255,0.8)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="w-full md:w-1/2 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-cyan-500 text-white text-lg font-bold tracking-wide hover:shadow-[0_0_25px_rgba(255,0,255,0.6)] transition-all"
          >
            🚀 Начать игру
          </motion.button>
        </div>

        {/* 🏆 Таблица лидеров */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-8 border-t border-cyan-800/50 pt-4"
        >
          <h3 className="text-pink-400 text-center text-xl mb-3">🏆 Лидеры</h3>
          <table className="w-full text-center border-collapse">
            <thead className="text-pink-300 border-b border-pink-700/30">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Игрок</th>
                <th className="p-2">Время</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="hover:bg-pink-900/20 transition">
                <td className="p-2">1</td>
                <td className="p-2">Neo</td>
                <td className="p-2">02:15</td>
              </tr>
              <tr className="hover:bg-pink-900/20 transition">
                <td className="p-2">2</td>
                <td className="p-2">Trinity</td>
                <td className="p-2">02:43</td>
              </tr>
              <tr className="hover:bg-pink-900/20 transition">
                <td className="p-2">3</td>
                <td className="p-2">Deckard</td>
                <td className="p-2">03:01</td>
              </tr>
            </tbody>
          </table>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .neon-text {
          text-shadow: 0 0 10px #00ffff, 0 0 25px #00ffff, 0 0 45px #ff00ff,
            0 0 70px #ff00ff;
        }
      `}</style>
    </div>
  );
}
