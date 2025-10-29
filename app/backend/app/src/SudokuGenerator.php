<?php

namespace SudokuApp\Backend;

// Импортируем решатель для проверки уникальности
require_once __DIR__ . '/SudokuSolver.php'; 

class SudokuGenerator {

    private const GRID_SIZE = 9;

    /**
     * @var SudokuSolver 
     */
    private $solver;

    public function __construct() {
        $this->solver = new SudokuSolver();
    }
    
    // --- Вспомогательные функции ---

    private function isSafe(array $grid, int $row, int $col, int $num): bool {
        // Проверка строки и столбца
        for ($i = 0; $i < self::GRID_SIZE; $i++) {
            if ($grid[$row][$i] === $num || $grid[$i][$col] === $num) {
                return false;
            }
        }

        // Проверка 3x3 блока
        $startRow = floor($row / 3) * 3;
        $startCol = floor($col / 3) * 3;

        for ($i = 0; $i < 3; $i++) {
            for ($j = 0; $j < 3; $j++) {
                if ($grid[$startRow + $i][$startCol + $j] === $num) {
                    return false;
                }
            }
        }
        return true;
    }

    private function createEmptyGrid(): array {
        return array_fill(0, self::GRID_SIZE, array_fill(0, self::GRID_SIZE, 0));
    }

    // --- Логика Генерации Полной Сетки ---
    
    public function generateFullSudoku(array &$grid): bool {
        // ... (Код функции generateFullSudoku без изменений) ...
        // Использует Backtracking для заполнения сетки.
        
        $row = -1; $col = -1; $isEmpty = true;
        for ($i = 0; $i < self::GRID_SIZE; $i++) {
            for ($j = 0; $j < self::GRID_SIZE; $j++) {
                if ($grid[$i][$j] < 1) {
                    $row = $i; $col = $j; $isEmpty = false; break 2;
                }
            }
        }

        if ($isEmpty) return true;

        $numbers = range(1, 9);
        shuffle($numbers);

        foreach ($numbers as $num) {
            if ($this->isSafe($grid, $row, $col, $num)) {
                $grid[$row][$col] = $num;
                if ($this->generateFullSudoku($grid)) return true;
                $grid[$row][$col] = 0; // ВОЗВРАТ
            }
        }
        return false;
    }

    // --- Логика Создания Загадки ---
    
    /**
     * Создает загадку путем удаления цифр, гарантируя единственность решения.
     * @param array $fullGrid Полностью заполненная сетка
     * @param int $cluesToKeep Количество подсказок, которое нужно оставить (сложность)
     * @return array [puzzle, solution]
     */
    public function createPuzzle(array $fullGrid, int $cluesToKeep): array {
        $puzzleGrid = $fullGrid; 
        $solutionGrid = $fullGrid; // Сохраняем решение
        $cellsLeft = self::GRID_SIZE * self::GRID_SIZE;
        
        $positions = [];
        for ($r = 0; $r < 9; $r++) {
            for ($c = 0; $c < 9; $c++) {
                $positions[] = ['r' => $r, 'c' => $c];
            }
        }
        shuffle($positions); // Случайный порядок удаления

        // Удаляем, пока не достигнем нужного количества подсказок
        while ($cellsLeft > $cluesToKeep && !empty($positions)) {
            $cell = array_pop($positions);
            $r = $cell['r'];
            $c = $cell['c'];

            $originalValue = $puzzleGrid[$r][$c];
            $puzzleGrid[$r][$c] = 0; // Пробуем удалить

            // Проверка уникальности решения после удаления
            $tempGrid = $puzzleGrid;
            $solutionCount = $this->solver->countSolutions($tempGrid, 2);

            if ($solutionCount !== 1) {
                // Если решение не уникально (0 или > 1), возвращаем цифру
                $puzzleGrid[$r][$c] = $originalValue;
            } else {
                // Если уникально, цифра остается удаленной
                $cellsLeft--;
            }
        }
        
        // Преобразуем 0 в null для соответствия формату JSON (как ожидается на React)
        $finalPuzzle = array_map(function($row) {
            return array_map(function($cell) {
                return $cell === 0 ? null : $cell;
            }, $row);
        }, $puzzleGrid);

        return [
            'puzzle' => $finalPuzzle,
            'solution' => $solutionGrid
        ];
    }
    
    /**
     * Основной публичный метод для генерации новой загадки.
     * @param string $difficulty Уровень сложности ('easy', 'medium', 'hard')
     * @return array [puzzle, solution]
     */
    public function generateNewGame(string $difficulty = 'medium'): array {
        $fullGrid = $this->createEmptyGrid();
        $this->generateFullSudoku($fullGrid);
        
        // Установка количества подсказок в зависимости от сложности
        switch (strtolower($difficulty)) {
            case 'easy':
                $cluesToKeep = 35; // Легкая: много подсказок
                break;
            case 'hard':
                $cluesToKeep = 20; // Сложная: мало подсказок
                break;
            case 'medium':
            default:
                $cluesToKeep = 28; // Средняя
                break;
        }
        
        return $this->createPuzzle($fullGrid, $cluesToKeep);
    }
}