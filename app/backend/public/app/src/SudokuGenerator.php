<?php

namespace SudokuApp\Backend;

require_once __DIR__ . '/SudokuSolver.php'; 

class SudokuGenerator {

    private const GRID_SIZE = 9;
    private $solver;

    public function __construct() {
        $this->solver = new SudokuSolver();
    }
    

    private function isSafe(array $grid, int $row, int $col, int $num): bool {
        for ($i = 0; $i < self::GRID_SIZE; $i++) {
            if ($grid[$row][$i] === $num || $grid[$i][$col] === $num) {
                return false;
            }
        }

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

    
    public function generateFullSudoku(array &$grid): bool {

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
                $grid[$row][$col] = 0; 
            }
        }
        return false;
    }

  
   public function createPuzzle(array $fullGrid, int $targetClues): array {
    $puzzleGrid = $fullGrid;
    $solutionGrid = $fullGrid;

    $positions = [];
    for ($r = 0; $r < 9; $r++) {
        for ($c = 0; $c < 9; $c++) {
            $positions[] = ['r' => $r, 'c' => $c];
        }
    }

    $currentFilled = 81;

    $maxAttempts = 1000; 
    $attempts = 0;

    while ($currentFilled > $targetClues && $attempts < $maxAttempts) {
        shuffle($positions);

        foreach ($positions as $cell) {
            $r = $cell['r'];
            $c = $cell['c'];

            if ($puzzleGrid[$r][$c] === 0) continue;

            $backup = $puzzleGrid[$r][$c];
            $puzzleGrid[$r][$c] = 0;

            $tempGrid = $puzzleGrid;
            $solutionCount = $this->solver->countSolutions($tempGrid, 2);
            if ($solutionCount === 1) {
                $currentFilled--;
            } else {
                $puzzleGrid[$r][$c] = $backup; 
            }

            if ($currentFilled <= $targetClues) break;
        }

        $attempts++;
    }

    $finalPuzzle = array_map(function($row) {
        return array_map(fn($cell) => $cell === 0 ? null : $cell, $row);
    }, $puzzleGrid);

    return [
        'puzzle' => $finalPuzzle,
        'solution' => $solutionGrid
    ];
}

    
   
    public function generateNewGame(string $difficulty = 'medium'): array {
        $fullGrid = $this->createEmptyGrid();
        $this->generateFullSudoku($fullGrid);
        
      
        switch (strtolower($difficulty)) {
            case 'easy':
                $cluesToKeep = 40; 
                break;
            case 'hard':
               
                $cluesToKeep = 32; 
                break;
            case 'medium':
            default:
                $cluesToKeep = 32; 
                break;
        }
        
        if (strtolower($difficulty) === 'hard') {
            return $this->createPuzzleFast($fullGrid, $cluesToKeep);
        }
        
        return $this->createPuzzle($fullGrid, $cluesToKeep);
    }


    private function createPuzzleFast(array $fullGrid, int $targetClues): array {
        $puzzleGrid = $fullGrid;
        $positions = [];
        for ($r = 0; $r < 9; $r++) {
            for ($c = 0; $c < 9; $c++) {
                $positions[] = ['r' => $r, 'c' => $c];
            }
        }
        
        shuffle($positions);
        $toRemove = 81 - $targetClues;
        $removed = 0;
        
        foreach ($positions as $cell) {
            if ($removed >= $toRemove) break;
            $r = $cell['r'];
            $c = $cell['c'];
            if ($puzzleGrid[$r][$c] !== 0) {
                $puzzleGrid[$r][$c] = 0;
                $removed++;
            }
        }
        
        $finalPuzzle = array_map(function($row) {
            return array_map(fn($cell) => $cell === 0 ? null : $cell, $row);
        }, $puzzleGrid);
        
        return [
            'puzzle' => $finalPuzzle,
            'solution' => $fullGrid
        ];
    }
}