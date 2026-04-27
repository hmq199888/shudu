export type CellValue = number | null;
export type Board = CellValue[][];
export type Notes = boolean[][][];
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  board: Board;
  solution: Board;
  notes: Notes;
  selectedCell: [number, number] | null;
  difficulty: Difficulty;
  mistakes: number;
  hints: number;
  isComplete: boolean;
  isWon: boolean;
  elapsedTime: number;
}

const EMPTY_BOARD: Board = Array(9).fill(null).map(() => Array(9).fill(null));
const EMPTY_NOTES: Notes = Array(9).fill(null).map(() =>
  Array(9).fill(null).map(() => Array(9).fill(false))
);

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isValidPlacement(board: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }

  const blockRow = Math.floor(row / 3) * 3;
  const blockCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[blockRow + i][blockCol + j] === num) return false;
    }
  }

  return true;
}

function solveSudoku(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) {
        const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValidPlacement(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(board: Board): number {
  let count = 0;
  const boardCopy = board.map(row => [...row]);

  function solve(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (boardCopy[row][col] === null) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(boardCopy, row, col, num)) {
              boardCopy[row][col] = num;
              if (solve()) {
                count++;
                if (count > 1) return false;
              }
              boardCopy[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve();
  return count;
}

function createFullBoard(): Board {
  const board: Board = Array(9).fill(null).map(() => Array(9).fill(null));

  const nums = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  for (let i = 0; i < 9; i++) {
    board[0][i] = nums[i];
  }

  for (let row = 1; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const baseRow = Math.floor(row / 3) * 3;
      const baseCol = (col + Math.floor(row / 3) * 3) % 9;
      board[row][col] = board[baseRow][baseCol];
    }
  }

  for (let i = 0; i < 5; i++) {
    const boardCopy = board.map(row => [...row]);
    if (solveSudoku(boardCopy)) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          board[r][c] = boardCopy[r][c];
        }
      }
    }
  }

  return board;
}

function removeNumbers(board: Board, solution: Board, count: number): Board {
  const puzzle = board.map(row => [...row]);
  const positions: [number, number][] = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }

  const shuffledPositions = shuffleArray(positions);
  let removed = 0;

  for (const [row, col] of shuffledPositions) {
    if (removed >= count) break;

    const backup = puzzle[row][col];
    puzzle[row][col] = null;

    const testBoard = puzzle.map(r => [...r]);
    if (countSolutions(testBoard) === 1) {
      removed++;
    } else {
      puzzle[row][col] = backup;
    }
  }

  return puzzle;
}

export function generateSudoku(difficulty: Difficulty): { puzzle: Board; solution: Board } {
  const fullBoard = createFullBoard();
  const solution = fullBoard.map(row => [...row]);

  const cellsToRemove: Record<Difficulty, number> = {
    easy: 35,
    medium: 45,
    hard: 55
  };

  const puzzle = removeNumbers(fullBoard, solution, cellsToRemove[difficulty]);

  return { puzzle, solution };
}

export function checkValue(
  board: Board,
  solution: Board,
  row: number,
  col: number,
  value: number
): boolean {
  return solution[row][col] === value;
}

export function findErrors(board: Board, solution: Board): Set<string> {
  const errors = new Set<string>();

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== null && board[row][col] !== solution[row][col]) {
        errors.add(`${row}-${col}`);
      }
    }
  }

  return errors;
}

export function isBoardComplete(board: Board): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) return false;
    }
  }
  return true;
}

export function isValidMove(board: Board, row: number, col: number, num: number): boolean {
  return isValidPlacement(board, row, col, num);
}

export function createEmptyGame(): GameState {
  return {
    board: EMPTY_BOARD.map(row => [...row]),
    solution: EMPTY_BOARD.map(row => [...row]),
    notes: EMPTY_NOTES.map(layer => layer.map(row => [...row])),
    selectedCell: null,
    difficulty: 'easy',
    mistakes: 0,
    hints: 3,
    isComplete: false,
    isWon: false,
    elapsedTime: 0
  };
}

export function getRelatedCells(row: number, col: number): Set<string> {
  const related = new Set<string>();

  for (let i = 0; i < 9; i++) {
    if (i !== col) related.add(`${row}-${i}`);
    if (i !== row) related.add(`${i}-${col}`);
  }

  const blockRow = Math.floor(row / 3) * 3;
  const blockCol = Math.floor(col / 3) * 3;
  for (let r = blockRow; r < blockRow + 3; r++) {
    for (let c = blockCol; c < blockCol + 3; c++) {
      if (r !== row || c !== col) related.add(`${r}-${c}`);
    }
  }

  return related;
}
