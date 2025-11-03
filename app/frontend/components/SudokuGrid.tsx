"use client";

import { useState, useEffect } from "react";
import { Card, Divider } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";

type Cell = { row: number; col: number } | null;

export default function SudokuGrid() {
  const GRID_SIZE = 9;

  const [grid, setGrid] = useState<(number | null)[][]>(
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null))
  );
  const [selectedCell, setSelectedCell] = useState<Cell>(null);
  const [loading, setLoading] = useState(true);

  // 📥 Загрузка новой сетки с PHP
  async function loadGrid() {
    try {
      const res = await fetch("http://localhost:8000/new_game.php");
      const data = await res.json();

      if (data && data.puzzle) {
        setGrid(data.puzzle);
      } else {
        console.error("Неверный ответ от сервера:", data);
      }
    } catch (err) {
      console.error("Ошибка при загрузке сетки:", err);
    } finally {
      setLoading(false);
    }
  }

  // Загружаем при первом рендере
  useEffect(() => {
    loadGrid();
  }, []);

  const onCellClick = (row: number, col: number) => setSelectedCell({ row, col });

  const onNumberClick = (num: number) => {
    if (!selectedCell) return;
    const newGrid = grid.map((r) => [...r]);
    newGrid[selectedCell.row][selectedCell.col] = num;
    setGrid(newGrid);
  };

  const onRemoveClick = () => {
    if (!selectedCell) return;
    const newGrid = grid.map((r) => [...r]);
    newGrid[selectedCell.row][selectedCell.col] = null;
    setGrid(newGrid);
  };

  const selectedValue =
    selectedCell && grid[selectedCell.row][selectedCell.col] !== null
      ? grid[selectedCell.row][selectedCell.col]
      : null;

  if (loading) return <div className="text-xl p-8">Загрузка судоку...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-content2 p-4 sm:p-6">
      {/* Sudoku grid */}
      <Card shadow="sm" className="p-1 sm:p-2 border-4 border-black w-max pointer-events-auto">
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
              if (isSameValue) bgColor = "#FEF3C7";
              if (isInSelectedRow || isInSelectedCol) bgColor = "#E5E7EB";
              if (isSelected) bgColor = "#BFDBFE";

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
                  className={`flex items-center justify-center w-[50px] h-[50px] sm:w-[80px] sm:h-[80px] text-3xl sm:text-5xl font-extrabold cursor-pointer select-none ${borderTop} ${borderLeft} ${borderRight} ${borderBottom}`}
                >
                  <AnimatePresence mode="popLayout">
                    {cellValue !== null && (
                      <motion.span
                        key={cellValue + "-" + rowIndex + "-" + colIndex}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.2 }}
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

      <Divider className="my-6 w-64" />

      {/* Панель чисел */}
      <Card
        shadow="sm"
        className="p-3 flex flex-wrap justify-center gap-3 bg-transparent border-none"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isActive =
            selectedCell && grid[selectedCell.row][selectedCell.col] === num;
          return (
            <motion.button
              key={num}
              onClick={() => onNumberClick(num)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] text-2xl sm:text-3xl font-extrabold border-2 border-black rounded-2xl ${
                isActive ? "bg-blue-500 text-white" : "bg-white hover:bg-gray-100"
              }`}
            >
              {num}
            </motion.button>
          );
        })}
        <motion.button
          onClick={onRemoveClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] text-2xl sm:text-3xl font-extrabold border-2 border-black rounded-2xl bg-white hover:bg-red-100 text-red-600"
        >
          ✕
        </motion.button>
      </Card>
    </div>
  );
}
