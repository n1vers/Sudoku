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
  public function countSolutions(array $grid, int $limit = 2): int {
    $solutions = 0;
    $this->countSolutionsRecursive($grid, $limit, $solutions);
    return $solutions;
}

private function countSolutionsRecursive(array &$grid, int $limit, int &$solutions) {
    for ($row = 0; $row < self::GRID_SIZE; $row++) {
        for ($col = 0; $col < self::GRID_SIZE; $col++) {
            if ($grid[$row][$col] === 0) {
                for ($num = 1; $num <= 9; $num++) {
                    if ($this->isSafe($grid, $row, $col, $num)) {
                        $grid[$row][$col] = $num;
                        $this->countSolutionsRecursive($grid, $limit, $solutions);
                        $grid[$row][$col] = 0;
                        if ($solutions >= $limit) return; // оптимизация
                    }
                }
                return;
            }
        }
    }
    $solutions++;
}

}