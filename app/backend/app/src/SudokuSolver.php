<?php

namespace SudokuApp\Backend;

class SudokuSolver {

    private const GRID_SIZE = 9;

    /**
     * Проверяет, можно ли безопасно поместить число в ячейку.
     * Аналогична isSafe из SudokuGenerator, но приватна для этого класса.
     */
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

    /**
     * Решает судоку и подсчитывает количество возможных решений.
     * * @param array $grid Ссылка на сетку для решения
     * @param int $limit Максимальное количество решений для поиска (обычно 2)
     * @return int Фактическое количество найденных решений (0, 1 или 2)
     */
    public function countSolutions(array &$grid, int $limit = 2): int {
        static $solutions = 0;
        
        if ($solutions >= $limit) {
            return $solutions;
        }

        // Находим следующую пустую ячейку
        $row = -1;
        $col = -1;
        $isEmpty = true;
        for ($i = 0; $i < self::GRID_SIZE; $i++) {
            for ($j = 0; $j < self::GRID_SIZE; $j++) {
                if ($grid[$i][$j] < 1) {
                    $row = $i;
                    $col = $j;
                    $isEmpty = false;
                    break 2;
                }
            }
        }

        // Базовый случай: сетка решена
        if ($isEmpty) {
            return ++$solutions;
        }

        // Перебор чисел
        for ($num = 1; $num <= 9; $num++) {
            if ($this->isSafe($grid, $row, $col, $num)) {
                $grid[$row][$col] = $num;
                
                $this->countSolutions($grid, $limit);

                $grid[$row][$col] = 0; // Возврат
            }
        }

        return $solutions;
    }
}