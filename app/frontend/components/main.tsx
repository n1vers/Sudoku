"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Tab, Tabs } from "@heroui/react";

interface GameResult {
  nickname: string;
  time: string;
  difficulty: string;
  was_auto_filled?: boolean;
}

const API_BASE = "http://localhost:8000";

export default function MenuPage() {
  const [difficulty, setDifficulty] = useState("medium");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [gameResults, setGameResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = localStorage.getItem("sudoku_nickname");
    if (saved) { setIsAuth(true); setNickname(saved); }
  }, []);

  // Исправленная загрузка результатов
  useEffect(() => {
    if (!isAuth) return;
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/get_results.php?difficulty=${difficulty}&limit=8`);
        const data = await res.json();
        // Проверяем структуру данных
        if (data.results) setGameResults(data.results);
        else setGameResults([]);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [difficulty, isAuth]);

  const handleAuth = async () => {
    if (!nickname || !password) return;
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("sudoku_nickname", nickname);
        setIsAuth(true);
      } else alert(data.message);
    } catch (e) { alert("Сервер недоступен"); }
    finally { setAuthLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-500/30">
      {/* Живой фон */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      <motion.h1 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="text-6xl font-black tracking-tighter mb-12 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent z-10"
      >
        SUDOKU<span className="text-blue-500">.</span>CORE
      </motion.h1>

      <div className="w-full max-w-5xl z-10">
        <AnimatePresence mode="wait">
          {!isAuth ? (
            <motion.div key="auth" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-center">
              <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
                <Tabs fullWidth variant="underlined" onSelectionChange={(k) => setAuthMode(k as string)} classNames={{ cursor: "bg-blue-500", tabContent: "group-data-[selected=true]:text-blue-500 font-bold" }}>
                  <Tab key="login" title="ВХОД" />
                  <Tab key="register" title="РЕГИСТРАЦИЯ" />
                </Tabs>
                <div className="mt-6 space-y-4">
                  <Input label="Никнейм" variant="bordered" className="text-white" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                  <Input label="Пароль" type="password" variant="bordered" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <Button size="lg" fullWidth className="bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20" isLoading={authLoading} onClick={handleAuth}>
                    ПОДТВЕРДИТЬ
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Левая панель: Лидерборд */}
              <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 shadow-2xl overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-blue-500">🏆</span> ТОР ИГРОКОВ
                </h3>
                
                <div className="space-y-2 min-h-[320px]">
                  {loading ? (
                    <div className="flex justify-center items-center h-48 opacity-50">Загрузка...</div>
                  ) : gameResults.length > 0 ? (
                    gameResults.map((r, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-gray-500">0{i+1}</span>
                          <span className="font-bold">{r.nickname}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-blue-400 font-mono">{r.time}</span>
                          {r.was_auto_filled && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">AUTO</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 mt-20">Пока нет результатов</div>
                  )}
                </div>
              </Card>

              {/* Правая панель: Старт */}
              <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 shadow-2xl relative">
                <div className="absolute top-0 right-0 w-1 h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Агент</p>
                    <h2 className="text-2xl font-black">{nickname}</h2>
                  </div>
                  <Button size="sm" variant="flat" color="danger" className="min-w-0 px-2 h-7 opacity-50 hover:opacity-100" onClick={() => { localStorage.clear(); window.location.reload(); }}>ВЫЙТИ</Button>
                </div>

                <div className="space-y-3 mb-10">
                  <p className="text-xs font-bold text-gray-500 mb-4">ВЫБЕРИТЕ СЛОЖНОСТЬ</p>
                  {["easy", "medium", "hard"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`w-full py-4 px-6 rounded-xl border-2 transition-all text-left flex justify-between items-center ${
                        difficulty === lvl ? "border-blue-500 bg-blue-500/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]" : "border-white/5 bg-white/5 text-gray-400 hover:border-white/20"
                      }`}
                    >
                      <span className="font-bold uppercase tracking-wider">{lvl}</span>
                      <div className={`w-2 h-2 rounded-full ${lvl === 'easy' ? 'bg-green-500' : lvl === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    </button>
                  ))}
                </div>

                <Button 
                  size="lg" 
                  fullWidth 
                  className="h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  onClick={() => router.push(`/game?difficulty=${difficulty}&nickname=${nickname}`)}
                >
                  ЗАПУСТИТЬ ЯДРО
                </Button>
              </Card>
              
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}