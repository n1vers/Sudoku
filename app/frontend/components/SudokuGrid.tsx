"use client";

import React, { useState, useEffect } from "react";
import { Card, Divider } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";

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

  async function loadGrid(difficulty = "medium") {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/new_game.php?difficulty=${encodeURIComponent(difficulty)}`);
      const data = await res.json();

      if (data && data.puzzle) {
        setGrid(data.puzzle);
        const fixedGrid = emptyBoolGrid();
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            fixedGrid[r][c] = data.puzzle[r][c] !== null;
          }
        }
        setFixed(fixedGrid);

        if (data.solution) {
          setSolution(data.solution);
          // validate prefilled vs solution
          const errs = new Set<string>();
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              const v = data.puzzle[r][c];
              if (v !== null && data.solution[r][c] !== v) errs.add(`${r}-${c}`);
            }
          }
          setErrors(errs);
        } else {
          setSolution(null);
          setErrors(new Set());
        }
      } else {
        console.error("Invalid response from server:", data);
      }
    } catch (err) {
      console.error("Failed to load puzzle:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrid();
  }, []);

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

  const selectedValue =
    selectedCell && grid[selectedCell.row][selectedCell.col] !== null
      ? grid[selectedCell.row][selectedCell.col]
      : null;

  if (loading) return <div className="text-xl p-8">Загрузка судоку...</div>;

  return (
    <div className="flex flex-col items-center min-h-screen bg-content2 p-4 sm:p-6">
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
              if (errors.has(`${rowIndex}-${colIndex}`)) bgColor = "#FFEBEE";
              else if (isSameValue) bgColor = "#FEF3C7";
              else if (isInSelectedRow || isInSelectedCol) bgColor = "#F3F4F6";
              if (isSelected) bgColor = "#E3F2FD";

              const isFixed = fixed[rowIndex][colIndex];

              const spanClasses = [
                isFixed ? "text-black opacity-90" : "text-blue-500",
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
    </div>
  );
}