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
  const nickname = searchParams.get("nickname") ?? "";

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
        const serverPuzzle: (number | null)[][] = data.puzzle.map((r: any) => [...r]);
        const fixedGrid = emptyBoolGrid();
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            fixedGrid[r][c] = serverPuzzle[r][c] !== null;
          }
        }

        if (data.solution) {
          const sol: (number | null)[][] = data.solution.map((r: any) => [...r]);
          const total = GRID_SIZE * GRID_SIZE;
          const desiredForEasy = Math.floor(total * 0.5); 
          const desiredForHard = Math.floor(total * 0.4); 

          const countGivens = (gridToCheck: (number | null)[][]) =>
            gridToCheck.reduce((acc, row) => acc + row.filter((v) => v !== null).length, 0);
          const newGrid = serverPuzzle.map((r) => [...r]);
          const newFixed = fixedGrid.map((r) => [...r]);

          const currentPrefilled = countGivens(newGrid);

          let target: number | null = null;
          if (difficulty === "easy") target = desiredForEasy;
          else if (difficulty === "hard") target = desiredForHard;

          if (target !== null) {
            if (target > currentPrefilled) {
              const emptyPos: [number, number][] = [];
              for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                  if (newGrid[r][c] === null && sol[r][c] !== null) emptyPos.push([r, c]);
                }
              }
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
              const prefilledPos: [number, number][] = [];
              for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                  if (serverPuzzle[r][c] !== null) prefilledPos.push([r, c]);
                }
              }
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

          const errs = new Set<string>();
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              const v = newGrid[r][c];
              if (v !== null && sol[r][c] !== v) errs.add(`${r}-${c}`);
            }
          }
          setErrors(errs);
        } else {
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

  useEffect(() => {
    if (loading || isGameComplete) return;
    
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [loading, isGameComplete]);

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

  const digitCounts = Array(10).fill(0);
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const v = grid[r][c];
      if (v !== null && v >= 1 && v <= 9) digitCounts[v]++;
    }
  }

  if (loading) return <div className="text-xl p-8">Загрузка судоку...</div>;

  const handleBackToMenu = () => {
    router.push("/");
  };

  const reloadWithDifficulty = () => {
    loadGrid(difficultyParam);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="w-full max-w-5xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-800">Уровень: </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            difficultyParam === "easy" ? "bg-green-100 text-green-700" :
            difficultyParam === "medium" ? "bg-yellow-100 text-yellow-700" :
            "bg-red-100 text-red-700"
          }`}>{difficultyLabel}</span>
          <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold font-mono">
            ⏱️ {String(Math.floor(elapsedTime / 60)).padStart(2, '0')}:{String(elapsedTime % 60).padStart(2, '0')}
          </div>
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

      <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-4 w-full max-w-2xl">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isActive = selectedCell && grid[selectedCell.row][selectedCell.col] === num;
          const buttonDisabled = !selectedCell || fixed[selectedCell.row][selectedCell.col] || digitCounts[num] >= 9;

          return (
            <motion.button
              key={num}
              onClick={() => onNumberClick(num)}
              whileHover={buttonDisabled ? {} : { scale: 1.1 }}
              whileTap={buttonDisabled ? {} : { scale: 0.9 }}
              disabled={buttonDisabled}
              className={`w-10 h-12 sm:w-16 sm:h-20 text-xl sm:text-3xl font-extrabold border-2 border-black rounded-xl transition-colors ${
                isActive ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
              } ${buttonDisabled ? "opacity-30 cursor-not-allowed" : "shadow-sm"}`}
            >
              {num}
            </motion.button>
          );
        })}

        <motion.button
          onClick={onRemoveClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={!selectedCell || fixed[selectedCell.row][selectedCell.col]}
          className="w-10 h-12 sm:w-16 sm:h-20 text-xl sm:text-3xl font-extrabold border-2 border-red-500 text-red-600 rounded-xl bg-white disabled:opacity-30"
        >
          ✕
        </motion.button>
      </div>

      <div className="mt-8">
        <Button 
          color="success" 
          size="lg"
          className="font-bold text-white shadow-lg px-8" 
          onPress={autoFillSolution}
        >
          ⚡ Заполнить всё
        </Button>
      </div>

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

      
  );
}