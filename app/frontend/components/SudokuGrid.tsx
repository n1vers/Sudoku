"use client";

import { useState } from "react";
import { Button, Card, Divider } from "@heroui/react";

type Cell = { row: number; col: number } | null;

export default function SudokuGrid() {
  const GRID_SIZE = 9;

  // Инициализация сетки: числа 1–9 циклически, ячейки могут быть null
  const initialGrid: (number | null)[][] = Array(GRID_SIZE)
    .fill(null)
    .map((_, rowIndex) =>
      Array(GRID_SIZE)
        .fill(null)
        .map((_, colIndex) => ((colIndex + rowIndex) % 9) + 1)
    );

  const [grid, setGrid] = useState<(number | null)[][]>(initialGrid);
  const [selectedCell, setSelectedCell] = useState<Cell>(null);

  const onCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

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

  return (
    <div className="flex flex-col items-center min-h-screen bg-content2 p-6">
      {/* Sudoku Board */}
      <Card
        shadow="sm"
        className="p-4 border-4 border-black w-[360px] h-[360px] flex items-center justify-center"
      >
        <div className="grid grid-cols-9 w-full h-full">
          {grid.flatMap((_, i) => {
            const row = Math.floor(i / GRID_SIZE);
            const col = i % GRID_SIZE;
            const isSelected =
              selectedCell?.row === row && selectedCell?.col === col;

            const borderRight =
              (col + 1) % 3 === 0 && col !== 8 ? "border-r-4 border-black" : "";
            const borderBottom =
              (row + 1) % 3 === 0 && row !== 8 ? "border-b-4 border-black" : "";

            return (
              <div
                key={i}
                onClick={() => onCellClick(row, col)}
                className={`flex items-center justify-center border border-default-300 cursor-pointer transition-all duration-200
                  ${borderRight} ${borderBottom}
                  ${isSelected ? "bg-primary-200" : "bg-content1"} hover:bg-default-100`}
              >
                {grid[row][col] ?? ""}
              </div>
            );
          })}
        </div>
      </Card>

      <Divider className="my-4 w-64" />

      {/* Number Pad */}
      <Card shadow="sm" className="p-3 flex space-x-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            color="primary"
            variant="flat"
            onPress={() => onNumberClick(num)}
            className="w-10 h-10"
          >
            {num}
          </Button>
        ))}
        <Button
          color="danger"
          variant="flat"
          onPress={onRemoveClick}
          className="w-10 h-10"
        >
          ✕
        </Button>
      </Card>
    </div>
  );
}
