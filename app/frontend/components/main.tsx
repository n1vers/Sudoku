"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface GameResult {
  nickname: string;
  time: string;
  difficulty: string;
  was_auto_filled?: boolean;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL as string) || "http://localhost:8000";

export default function MenuPage() {
  const [difficulty, setDifficulty] = useState("medium");
  const [nickname, setNickname] = useState("");
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Загрузка результатов из базы данных
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const apiUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
        const response = await fetch(
          `${apiUrl}/get_results.php?difficulty=${difficulty}&limit=5`
        );
        const data = await response.json();
        
        if (data.success && Array.isArray(data.results)) {
          setGameResults(data.results);
        } else {
          setGameResults([]);
        }
      } catch (err) {
        console.error('Failed to fetch results:', err);
        setGameResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    
    // Обновляем результаты каждые 3 секунды (чтобы видеть новые результаты сразу при возврате в меню)
    const interval = setInterval(fetchResults, 3000);
    return () => clearInterval(interval);
  }, [difficulty]);

  // Фильтруем результаты по текущей сложности (уже фильтруется на сервере)
  const difficultyMap: { [key: string]: string } = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  };

  const filteredResults = gameResults;

  const startGame = () => {
    // Передаём сложность и ник в URL параметре
    const encodedNickname = encodeURIComponent(nickname || "Anonymous");
    router.push(`/game?difficulty=${difficulty}&nickname=${encodedNickname}`);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full text-gray-800 bg-gradient-to-br from-white via-gray-50 to-gray-100 overflow-hidden p-4">
      {/* 🔮 Светлые декоративные элементы */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.08),_transparent_70%)] blur-3xl"
      />
      <motion.div
        animate={{
          background:
            "radial-gradient(circle at bottom right, rgba(147,51,234,0.08), transparent 70%)",
        }}
        transition={{ repeat: Infinity, duration: 6, repeatType: 'mirror' }}
        className="absolute inset-0 blur-3xl"
      />

      {/* ⚡ Главный заголовок */}
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="text-5xl md:text-7xl font-extrabold mb-12 text-center tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 relative z-10"
      >
        🧩 SUDOKU 🧩
      </motion.h1>

  {/* Двухколоночный макет (2 колонки уже с md) */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-7xl relative z-10">
        {/* ЛЕВАЯ КОЛОНКА - Таблица результатов */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="bg-white border-2 border-gray-300 rounded-3xl p-6 shadow-lg"
        >
          <h2 className="text-2xl text-center text-blue-600 mb-2 font-bold">
            🏆 Результаты
          </h2>
          <p className="text-center text-purple-600 text-sm mb-6 font-semibold">
            {difficulty === "easy" ? "🟢" : difficulty === "medium" ? "🟡" : "🔴"} Уровень:{" "}
            {difficulty === "easy" ? "Лёгкая" : difficulty === "medium" ? "Средняя" : "Сложная"}
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead className="text-blue-700 border-b-2 border-blue-300 bg-blue-50">
                <tr>
                  <th className="p-3 text-sm font-bold">№</th>
                  <th className="p-3 text-sm font-bold">Ник</th>
                  <th className="p-3 text-sm font-bold">Время</th>
                  <th className="p-3 text-sm font-bold">Отметка</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        Загрузка...
                      </div>
                    </td>
                  </tr>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((result, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="hover:bg-blue-50 transition border-b border-gray-200"
                    >
                      <td className="p-3">
                        <span className="font-bold text-blue-600">{index + 1}</span>
                      </td>
                      <td className="p-3">{result.nickname}</td>
                      <td className="p-3 font-mono font-semibold">{result.time}</td>
                      <td className="p-3">
                        {result.was_auto_filled ? (
                          <span className="inline-block px-2 py-1 bg-blue-200 text-blue-700 text-xs font-bold rounded" title="Заполнено автоматически">
                            ⚙️
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-green-200 text-green-700 text-xs font-bold rounded" title="Решено вручную">
                            ✓
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-3 text-gray-500 italic">
                      Нет результатов для этого уровня
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Кнопка обновления результатов */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setLoading(true);
              const fetchResults = async () => {
                try {
                  const apiUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
                  const response = await fetch(
                    `${apiUrl}/get_results.php?difficulty=${difficulty}&limit=5`
                  );
                  const data = await response.json();
                  
                  if (data.success && Array.isArray(data.results)) {
                    setGameResults(data.results);
                  }
                } catch (err) {
                  console.error('Failed to fetch results:', err);
                } finally {
                  setLoading(false);
                }
              };
              fetchResults();
            }}
            className="w-full mt-4 py-2 px-4 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg transition-all"
          >
            🔄 Обновить
          </motion.button>
        </motion.div>

        {/* ПРАВАЯ КОЛОНКА - Начало игры */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="bg-white border-2 border-gray-300 rounded-3xl p-8 shadow-lg"
        >
          <h2 className="text-2xl text-center text-blue-600 mb-8 font-bold">
            🚀 Начать игру
          </h2>

          {/* Поле для ввода ника */}
          <div className="mb-6">
            <label className="block text-blue-600 text-sm font-bold mb-2">
              👤 Твой ник
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Введи свой ник..."
              maxLength={20}
              className="w-full bg-gray-50 border-2 border-gray-300 text-gray-800 placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent hover:border-gray-400 transition"
            />
            <p className="text-gray-500 text-xs mt-1">{nickname.length}/20</p>
          </div>

          {/* Выбор сложности */}
          <div className="mb-8">
            <label className="block text-blue-600 text-sm font-bold mb-3">
              ⚙️ Уровень сложности
            </label>
            <div className="space-y-2">
              {[
                { value: "easy", label: "🟢 Лёгкая", description: "Идеально для начинающих" },
                { value: "medium", label: "🟡 Средняя", description: "Стандартная сложность" },
                { value: "hard", label: "🔴 Сложная", description: "Вызов для профи" },
              ].map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDifficulty(option.value)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    difficulty === option.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                      : "border-gray-300 bg-gray-50 text-gray-700 hover:border-blue-400"
                  }`}
                >
                  <div className="font-bold">{option.label}</div>
                  <div className="text-xs opacity-75">{option.description}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Кнопка старт */}
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0px 0px 20px rgba(37,99,235,0.4)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-bold tracking-wide hover:shadow-lg transition-all"
          >
            ▶️ Начать игру
          </motion.button>
        </motion.div>
      </div>

      <style jsx>{`
        .neon-text {
          background: linear-gradient(135deg, #2563eb, #9333ea);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
