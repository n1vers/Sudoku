"use client";

import React, { useState } from "react";
import { Card, Input, Button, Tabs, Tab } from "@heroui/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async () => {
    if (!nickname || !password) return alert("Заполни все поля!");
    setLoading(true);

    const action = isLogin ? "login" : "register";
    try {

      const res = await fetch(`http://localhost:8000/auth.php?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, password }),
      });
      const data = await res.json();

      if (data.success) {

        router.push(`/?nickname=${nickname}`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Ошибка подключения к серверу. Проверь, запущен ли PHP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="w-[350px] p-6 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-black mb-6 text-center">SUDOKU CORE</h1>
          
          <div className="flex flex-col gap-4">
            <div className="flex border-2 border-black rounded-lg overflow-hidden">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 font-bold ${isLogin ? 'bg-black text-white' : 'bg-white'}`}
              >Вход</button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 font-bold ${!isLogin ? 'bg-black text-white' : 'bg-white'}`}
              >Регистрация</button>
            </div>

            <Input 
              label="Никнейм" 
              placeholder="Введите ник" 
              variant="bordered"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              classNames={{ inputWrapper: "border-2 border-black" }}
            />
            <Input 
              label="Пароль" 
              type="password" 
              placeholder="********" 
              variant="bordered"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              classNames={{ inputWrapper: "border-2 border-black" }}
            />
            
            <Button 
              isLoading={loading}
              onPress={handleAuth}
              className="bg-blue-600 text-white font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              {isLogin ? "ВОЙТИ" : "СОЗДАТЬ АККАУНТ"}
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}