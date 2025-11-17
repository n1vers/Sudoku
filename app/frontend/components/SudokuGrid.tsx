"use client";

import React, { useState, useEffect } from "react";
import { Card, Divider, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

type Cell = { row: number; col: number } | null;

const GRID_SIZE = 9;
const API_BASE = (process.env.NEXT_PUBLIC_API_URL as string) || "http://localhost:8000";

const emptyGrid = (fill: number | null = null) =>
  Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(fill));

const emptyBoolGrid = (val = false) =>
  Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(val));

export default function SudokuGrid() {
  const [grid, setGrid] = useState<(number | null)[][]>(emptyGrid(null));
  const [fixed, setFixed] = useState<boolean[][]>(emptyBoolGrid());
  const [solution, setSolution] = useState<(number | null)[][] | null>(null);
  const [selectedCell, setSelectedCell] = useState<Cell>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // в секундах
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const [gameSaved, setGameSaved] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const difficultyParam = searchParams.get("difficulty") || "medium";
  const nickname = searchParams.get("nickname") || "Anonymous";

  const difficultyLabel =
    difficultyParam === "easy" ? "Лёгкая" : difficultyParam === "medium" ? "Средняя" : "Сложная";

  async function loadGrid(difficulty = "medium") {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/new_game.php?difficulty=${encodeURIComponent(difficulty)}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        const text = await res.text();
        console.error("Failed to parse JSON. Raw response:", text);
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }

      if (data && data.puzzle) {
        // Start from server puzzle, then adapt density based on difficulty
        const serverPuzzle: (number | null)[][] = data.puzzle.map((r: any) => [...r]);
        const fixedGrid = emptyBoolGrid();
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            fixedGrid[r][c] = serverPuzzle[r][c] !== null;
          }
        }

        // If server provided a solution, we'll use it to add/remove givens for easy/hard
        if (data.solution) {
          const sol: (number | null)[][] = data.solution.map((r: any) => [...r]);
          // desired counts
          const total = GRID_SIZE * GRID_SIZE;
          const desiredForEasy = Math.floor(total * 0.5); // ~50%
          const desiredForHard = Math.floor(total * 0.4); // ~40%

          // current count of givens
          const countGivens = (gridToCheck: (number | null)[][]) =>
            gridToCheck.reduce((acc, row) => acc + row.filter((v) => v !== null).length, 0);

          // copy
          const newGrid = serverPuzzle.map((r) => [...r]);
          const newFixed = fixedGrid.map((r) => [...r]);

          const currentPrefilled = countGivens(newGrid);

          let target: number | null = null;
          if (difficulty === "easy") target = desiredForEasy;
          else if (difficulty === "hard") target = desiredForHard;

          if (target !== null) {
            if (target > currentPrefilled) {
              // add givens from solution into empty cells
              const emptyPos: [number, number][] = [];
              for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                  if (newGrid[r][c] === null && sol[r][c] !== null) emptyPos.push([r, c]);
                }
              }
              // shuffle
              for (let i = emptyPos.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [emptyPos[i], emptyPos[j]] = [emptyPos[j], emptyPos[i]];
              }
              let toAdd = Math.min(target - currentPrefilled, emptyPos.length);
              for (let i = 0; i < toAdd; i++) {
                const [r, c] = emptyPos[i];
                newGrid[r][c] = sol[r][c];
                newFixed[r][c] = true;
              }
            } else if (target < currentPrefilled) {
              // remove some of the server givens
              const prefilledPos: [number, number][] = [];
              for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                  if (serverPuzzle[r][c] !== null) prefilledPos.push([r, c]);
                }
              }
              // shuffle
              for (let i = prefilledPos.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [prefilledPos[i], prefilledPos[j]] = [prefilledPos[j], prefilledPos[i]];
              }
              let toRemove = Math.min(currentPrefilled - target, prefilledPos.length);
              for (let i = 0; i < toRemove; i++) {
                const [r, c] = prefilledPos[i];
                newGrid[r][c] = null;
                newFixed[r][c] = false;
              }
            }
          }

          setGrid(newGrid);
          setFixed(newFixed);
          setSolution(sol);

          // validate prefilled vs solution (should be consistent)
          const errs = new Set<string>();
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              const v = newGrid[r][c];
              if (v !== null && sol[r][c] !== v) errs.add(`${r}-${c}`);
            }
          }
          setErrors(errs);
        } else {
          // no solution provided — use server puzzle as-is
          setGrid(serverPuzzle);
          setFixed(fixedGrid);
          setSolution(null);
          setErrors(new Set());
        }
      } else {
        console.error("Invalid response from server:", data);
        alert(`Ошибка загрузки: некорректный ответ сервера. Сложность: ${difficulty}`);
      }
    } catch (err) {
      console.error("Failed to load puzzle:", err);
      alert(`Ошибка загрузки судоку: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrid(difficultyParam);
  }, [difficultyParam]);

  // Таймер
  useEffect(() => {
    if (loading || isGameComplete) return;
    
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [loading, isGameComplete]);

  // Сохранение результата при завершении игры
  useEffect(() => {
    if (!isGameComplete || gameSaved) return;

    const saveGameResult = async () => {
      try {
        const apiUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
        const payload = {
          nickname: nickname,
          difficulty: difficultyParam,
          time: elapsedTime,
          wasAutoFilled: wasAutoFilled
        };
        
        console.log('Saving game result:', payload);
        console.log('API URL:', `${apiUrl}/save_result.php`);
        
        const response = await fetch(`${apiUrl}/save_result.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        
        if (data.success) {
          setGameSaved(true);
          console.log('Game result saved:', data.resultId);
        } else {
          console.error('Failed to save result:', data.message);
          console.error('Response data:', data);
        }
      } catch (err) {
        console.error('Error saving game result:', err);
        console.error('Error details:', err instanceof Error ? err.message : String(err));
      }
    };

    saveGameResult();
  }, [isGameComplete, gameSaved, nickname, difficultyParam, elapsedTime, wasAutoFilled]);

  const onCellClick = (row: number, col: number) => {
    if (fixed[row][col]) return; // Нельзя выбирать фиксированные ячейки
    setSelectedCell({ row, col });
  };

  const isValidPlacement = (
    gridToCheck: (number | null)[][],
    row: number,
    col: number,
    num: number
  ) => {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (c !== col && gridToCheck[row][c] === num) return false;
    }
    for (let r = 0; r < GRID_SIZE; r++) {
      if (r !== row && gridToCheck[r][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let r = boxRow; r < boxRow + 3; r++) {
      for (let c = boxCol; c < boxCol + 3; c++) {
        if ((r !== row || c !== col) && gridToCheck[r][c] === num) return false;
      }
    }
    return true;
  };

  const onNumberClick = (num: number) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (fixed[row][col]) return;

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = num;

    const newErrors = new Set(errors);

    if (solution) {
      const correct = solution[row][col] === num;
      if (!correct) newErrors.add(`${row}-${col}`);
      else newErrors.delete(`${row}-${col}`);
    } else {
      const ok = isValidPlacement(newGrid, row, col, num);
      if (!ok) newErrors.add(`${row}-${col}`);
      else newErrors.delete(`${row}-${col}`);
    }

    setGrid(newGrid);
    setErrors(newErrors);
    checkGameComplete(newGrid, newErrors);
  };

  const onRemoveClick = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (fixed[row][col]) return;

    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = null;

    const newErrors = new Set(errors);
    newErrors.delete(`${row}-${col}`);

    setGrid(newGrid);
    setErrors(newErrors);
  };

  const checkGameComplete = (gridToCheck: (number | null)[][], errorsToCheck: Set<string>) => {
    // Проверяем, что нет пустых ячеек и нет ошибок
    const isComplete = gridToCheck.every((row) => row.every((cell) => cell !== null));
    const hasNoErrors = errorsToCheck.size === 0;

    if (isComplete && hasNoErrors) {
      setIsGameComplete(true);
    }
  };

  const autoFillSolution = () => {
    if (!solution) return;
    
    const newGrid = grid.map((r) => [...r]);
    const newErrors = new Set<string>();
    
    // Заполняем пустые ячейки решением
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (newGrid[r][c] === null && solution[r][c] !== null) {
          newGrid[r][c] = solution[r][c];
        }
      }
    }
    
    setGrid(newGrid);
    setErrors(newErrors);
    setWasAutoFilled(true);
    checkGameComplete(newGrid, newErrors);
  };

  const selectedValue =
    selectedCell && grid[selectedCell.row][selectedCell.col] !== null
      ? grid[selectedCell.row][selectedCell.col]
      : null;

  if (loading) return <div className="text-xl p-8">Загрузка судоку...</div>;

  const handleBackToMenu = () => {
    router.push("/");
  };

  const reloadWithDifficulty = () => {
    loadGrid(difficultyParam);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4 sm:p-6">
      {/* Header: difficulty badge + controls */}
      <div className="w-full max-w-5xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-800">Уровень: </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            difficultyParam === "easy" ? "bg-green-100 text-green-700" :
            difficultyParam === "medium" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>{difficultyLabel}</span>
          {/* Таймер */}
          <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold font-mono">
            ⏱️ {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
          </div>
          {/* генерация локально, пометка удалена */}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={reloadWithDifficulty}
            className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm hover:shadow"
          >
            ♻️ Новая игра
          </button>
          <button
            onClick={handleBackToMenu}
            className="px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm hover:shadow"
          >
            ← В меню
          </button>
        </div>
      </div>

      <motion.div
        animate={isGameComplete ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0 0 rgba(34, 197, 94, 0.7)", "0 0 0 20px rgba(34, 197, 94, 0)"] } : {}}
        transition={{ repeat: isGameComplete ? 3 : 0, duration: 0.6 }}
      >
        <Card shadow="md" className="p-1 sm:p-2 border-4 border-gray-800 w-max pointer-events-auto bg-white">
          <div className="grid grid-cols-9">
          {grid.map((rowArray, rowIndex) =>
            rowArray.map((cellValue, colIndex) => {
              const isSelected =
                selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
              const isInSelectedRow = selectedCell?.row === rowIndex;
              const isInSelectedCol = selectedCell?.col === colIndex;
              const isSameValue =
                selectedValue !== null && cellValue === selectedValue;

              const borderRight =
                (colIndex + 1) % 3 === 0 && colIndex !== 8
                  ? "border-r-4 border-black"
                  : "border-r border-gray-400";

              const borderBottom =
                (rowIndex + 1) % 3 === 0 && rowIndex !== 8
                  ? "border-b-4 border-black"
                  : "border-b border-gray-400";

              const borderTop =
                rowIndex === 0 ? "border-t-4 border-black" : "border-t border-gray-400";
              const borderLeft =
                colIndex === 0 ? "border-l-4 border-black" : "border-l border-gray-400";

              let bgColor = "#FFFFFF";
              if (errors.has(`${rowIndex}-${colIndex}`)) bgColor = "#FFEBEE";
              else if (isSameValue) bgColor = "#FEF3C7";
              else if (isInSelectedRow || isInSelectedCol) bgColor = "#F3F4F6";
              if (isSelected) bgColor = "#E3F2FD";

              const isFixed = fixed[rowIndex][colIndex];

              const spanClasses = [
                isFixed ? "text-black opacity-90" : "text-green-600",
                errors.has(`${rowIndex}-${colIndex}`) ? "!text-red-500" : "",
                isFixed ? "font-extrabold" : "font-bold"
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                  initial={false}
                  animate={{
                    scale: isSelected ? 1.08 : 1,
                    backgroundColor: bgColor,
                    transition: { type: "spring", stiffness: 300, damping: 25 },
                  }}
                  className={`flex items-center justify-center w-[50px] h-[50px] sm:w-[80px] sm:h-[80px] text-3xl sm:text-5xl select-none ${borderTop} ${borderLeft} ${borderRight} ${borderBottom}`}
                  style={{ cursor: isFixed ? "default" : "pointer" }}
                >
                  <AnimatePresence mode="popLayout">
                    {cellValue !== null && (
                      <motion.span
                        key={`${cellValue}-${rowIndex}-${colIndex}`}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={spanClasses}
                      >
                        {cellValue}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </Card>
      </motion.div>

      <Divider className="my-6 w-64" />

      <Card
        shadow="sm"
        className="p-3 flex flex-wrap justify-center gap-3 bg-transparent border-none"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isActive =
            selectedCell && grid[selectedCell.row][selectedCell.col] === num;
          const disableInput =
            !selectedCell || fixed[selectedCell.row][selectedCell.col];

          return (
            <motion.button
              key={num}
              onClick={() => onNumberClick(num)}
              whileHover={disableInput ? {} : { scale: 1.1 }}
              whileTap={disableInput ? {} : { scale: 0.9 }}
              disabled={disableInput}
              className={`w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] text-2xl sm:text-3xl font-extrabold border-2 border-black rounded-2xl ${
                isActive ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
              } ${disableInput ? "opacity-50 cursor-not-allowed hover:bg-white" : ""}`}
            >
              {num}
            </motion.button>
          );
        })}
        <motion.button
          onClick={onRemoveClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={!selectedCell || (selectedCell && fixed[selectedCell.row][selectedCell.col])}
          className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] text-2xl sm:text-3xl font-extrabold border-2 border-black rounded-2xl bg-white hover:bg-red-100 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✕
        </motion.button>
      </Card>

      {/* Кнопка для автоматического заполнения */}
      <div className="mt-6 flex justify-center gap-4 flex-wrap">
        <motion.button
          onClick={autoFillSolution}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg rounded-lg hover:shadow-lg transition-shadow"
        >
          ⚡ Заполнить все
        </motion.button>

        {/* Кнопка назад в меню (видна только после победы) */}
        <AnimatePresence>
          {isGameComplete && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={handleBackToMenu}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg rounded-lg hover:shadow-lg transition-shadow"
            >
              ← Назад в меню
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Модальное окно завершения игры */}
      <Modal isOpen={isGameComplete} onClose={handleBackToMenu} isDismissable={false} size="lg">
        <ModalContent className="bg-gradient-to-br from-green-50 to-emerald-50">
          {/* Анимированный фон с конфетти */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: -20, x: Math.random() * 300 - 150 }}
                animate={{
                  opacity: 0,
                  y: 400,
                  x: Math.random() * 200 - 100,
                  rotate: Math.random() * 720,
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1,
                  ease: "easeIn",
                }}
                className="absolute w-2 h-2 pointer-events-none"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ["#FFD700", "#FF69B4", "#87CEEB", "#98FB98"][
                      Math.floor(Math.random() * 4)
                    ],
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Основное содержимое */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <ModalHeader className="flex flex-col gap-1 text-center border-b-2 border-green-200">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                className="text-6xl inline-block"
              >
                🎉
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
              >
                Поздравляем!
              </motion.h1>
            </ModalHeader>

            <ModalBody className="py-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center space-y-4"
              >
                <p className="text-2xl font-bold text-gray-800">
                  🏆 Вы успешно решили судоку!
                </p>
                <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                  <p className="text-gray-700">
                    Отличная работа! Вы продемонстрировали отличные навыки логического мышления.
                  </p>
                </div>
                
                {/* Показываем статистику игры */}
                <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200 space-y-2">
                  <div className="text-lg font-semibold text-gray-800">
                    ⏱️ Время: {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
                  </div>
                  <div className="text-lg font-semibold text-gray-800">
                    📊 Уровень: {difficultyLabel}
                  </div>
                  {wasAutoFilled && (
                    <div className="text-lg font-semibold text-blue-600 bg-blue-100 px-3 py-2 rounded">
                      ✓ Заполнено автоматически
                    </div>
                  )}
                  {gameSaved && (
                    <div className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-1 rounded">
                      ✓ Результат сохранен в базу
                    </div>
                  )}
                </div>
                
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-5xl"
                >
                  ⭐
                </motion.div>
              </motion.div>
            </ModalBody>

            <ModalFooter className="flex flex-col gap-3 border-t-2 border-green-200">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full"
              >
                <Button
                  onPress={handleBackToMenu}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg py-3 rounded-lg hover:shadow-lg transition-all"
                >
                  🚀 Вернуться на главный экран
                </Button>
              </motion.div>
            </ModalFooter>
          </motion.div>
        </ModalContent>
      </Modal>
    </div>
  );
}