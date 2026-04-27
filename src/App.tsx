import { useState, useEffect, useCallback } from 'react';
import {
  GameState,
  Difficulty,
  generateSudoku,
  createEmptyGame,
  findErrors,
  isBoardComplete,
  checkValue,
  isFixedCell
} from './utils/sudoku';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难'
};

export default function App() {
  const [game, setGame] = useState<GameState>(() => {
    const { puzzle, solution } = generateSudoku('easy');
    return {
      ...createEmptyGame(),
      board: puzzle,
      solution
    };
  });

  const [notesMode, setNotesMode] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [isPaused, setIsPaused] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);

  useEffect(() => {
    if (isPaused || game.isWon || game.isComplete) return;

    const timer = setInterval(() => {
      setGame(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, game.isWon, game.isComplete]);

  useEffect(() => {
    if (game.isWon) {
      setShowWinModal(true);
    }
  }, [game.isWon]);

  const newGame = useCallback((difficulty: Difficulty) => {
    const { puzzle, solution } = generateSudoku(difficulty);
    setGame({
      ...createEmptyGame(),
      board: puzzle,
      solution,
      difficulty,
      elapsedTime: 0
    });
    setErrors(new Set());
    setShowWinModal(false);
    setNotesMode(false);
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    setGame(prev => ({ ...prev, selectedCell: [row, col] }));
  }, []);

  const placeNumber = useCallback((num: number | null) => {
    if (!game.selectedCell || game.isComplete || game.isWon || isPaused) return;

    const [row, col] = game.selectedCell;

    if (isFixedCell(game.board, game.solution, row, col)) {
      return;
    }

    const originalBoard = game.board;
    const originalNotes = game.notes;

    if (num === null) {
      const newBoard = originalBoard.map(r => [...r]);
      newBoard[row][col] = null;
      const newNotes = originalNotes.map(layer => layer.map(r => [...r]));
      newNotes[row][col] = Array(9).fill(false);

      setGame(prev => ({
        ...prev,
        board: newBoard,
        notes: newNotes
      }));

      setErrors(findErrors(newBoard, game.solution));
      return;
    }

    if (notesMode) {
      const newNotes = originalNotes.map(layer => layer.map(r => [...r]));
      newNotes[row][col][num - 1] = !newNotes[row][col][num - 1];
      setGame(prev => ({ ...prev, notes: newNotes }));
    } else {
      const newBoard = originalBoard.map(r => [...r]);
      newBoard[row][col] = num;

      const newNotes = originalNotes.map(layer => layer.map(r => [...r]));
      newNotes[row][col] = Array(9).fill(false);

      const isCorrect = checkValue(newBoard, game.solution, row, col, num);

      if (!isCorrect) {
        setGame(prev => ({
          ...prev,
          board: newBoard,
          notes: newNotes,
          mistakes: prev.mistakes + 1
        }));
        setErrors(prev => {
          const newErrors = new Set(prev);
          newErrors.add(`${row}-${col}`);
          return newErrors;
        });
      } else {
        setGame(prev => ({
          ...prev,
          board: newBoard,
          notes: newNotes
        }));

        setErrors(findErrors(newBoard, game.solution));

        if (isBoardComplete(newBoard)) {
          setGame(prev => ({ ...prev, isWon: true, isComplete: true }));
        }
      }
    }
  }, [game.selectedCell, game.board, game.notes, game.solution, notesMode, isPaused]);

  const useHint = useCallback(() => {
    if (game.hints <= 0 || game.isComplete || game.isWon || isPaused) return;

    const emptyCells: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (game.board[r][c] === null) {
          emptyCells.push([r, c]);
        }
      }
    }

    if (emptyCells.length === 0) return;

    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const solutionValue = game.solution[row][col];

    const newBoard = game.board.map(r => [...r]);
    newBoard[row][col] = solutionValue;

    const newNotes = game.notes.map(layer => layer.map(r => [...r]));
    newNotes[row][col] = Array(9).fill(false);

    setGame(prev => ({
      ...prev,
      board: newBoard,
      notes: newNotes,
      hints: prev.hints - 1,
      selectedCell: [row, col]
    }));

    setErrors(findErrors(newBoard, game.solution));

    if (isBoardComplete(newBoard)) {
      setGame(prev => ({ ...prev, isWon: true, isComplete: true }));
    }
  }, [game.hints, game.board, game.notes, game.solution, game.isComplete, game.isWon, isPaused]);

  const validateBoard = useCallback(() => {
    const newErrors = findErrors(game.board, game.solution);
    setErrors(newErrors);
  }, [game.board, game.solution]);

  const clearBoard = useCallback(() => {
    setGame(prev => ({
      ...prev,
      board: prev.board.map((row, rowIdx) =>
        row.map((_, colIdx) => {
          const isFixed = isFixedCell(prev.board, prev.solution, rowIdx, colIdx);
          return isFixed ? prev.solution[rowIdx][colIdx] : null;
        })
      ),
      notes: prev.notes.map(layer => layer.map(() => Array(9).fill(false)))
    }));
    setErrors(new Set());
  }, []);

  const eraseCell = useCallback(() => {
    if (!game.selectedCell || game.isComplete || game.isWon || isPaused) return;

    const [row, col] = game.selectedCell;
    if (isFixedCell(game.board, game.solution, row, col)) return;

    const newBoard = game.board.map(r => [...r]);
    newBoard[row][col] = null;

    const newNotes = game.notes.map(layer => layer.map(r => [...r]));
    newNotes[row][col] = Array(9).fill(false);

    setGame(prev => ({
      ...prev,
      board: newBoard,
      notes: newNotes
    }));

    setErrors(findErrors(newBoard, game.solution));
  }, [game.selectedCell, game.board, game.notes, game.solution, game.isComplete, game.isWon, isPaused]);

  const getCellDisplay = (row: number, col: number) => {
    const value = game.board[row][col];
    const notes = game.notes[row][col];

    if (value !== null) {
      return <span className="cell-value">{value}</span>;
    }

    const activeNotes = notes.map((active, idx) => active ? idx + 1 : null).filter(Boolean);
    if (activeNotes.length > 0) {
      return (
        <div className="notes-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <span key={n} className={notes[n - 1] ? 'note-active' : 'note-empty'}>{notes[n - 1] ? n : ''}</span>
          ))}
        </div>
      );
    }

    return null;
  };

  const getCellClasses = (row: number, col: number) => {
    const classes = ['cell'];
    const isFixed = isFixedCell(game.board, game.solution, row, col);

    if (isFixed) classes.push('fixed');

    if (game.selectedCell) {
      const [selRow, selCol] = game.selectedCell;
      const isSelected = selRow === row && selCol === col;

      if (isSelected) {
        classes.push('selected');
      } else if (row === selRow || col === selCol) {
        classes.push('related');
      } else {
        const blockRow = Math.floor(selRow / 3) * 3;
        const blockCol = Math.floor(selCol / 3) * 3;
        if (row >= blockRow && row < blockRow + 3 && col >= blockCol && col < blockCol + 3) {
          classes.push('related');
        }
      }

      if (highlightMode && game.board[selRow][selCol] !== null) {
        if (game.board[row][col] === game.board[selRow][selCol] && !isSelected) {
          classes.push('highlight');
        }
      }

      if (errors.has(`${row}-${col}`)) {
        classes.push('error');
      }
    }

    return classes.join(' ');
  };

  const selectedValue = game.selectedCell ? game.board[game.selectedCell[0]][game.selectedCell[1]] : null;

  return (
    <div className="app-container">
      <header className="header">
        <h1>数独</h1>
        <p>挑战智慧，享受乐趣</p>
      </header>

      <div className="game-info">
        <div className="info-item">
          <span className="info-label">时间</span>
          <span className="info-value">{formatTime(game.elapsedTime)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">难度</span>
          <span className="info-value">{DIFFICULTY_LABELS[game.difficulty]}</span>
        </div>
        <div className="info-item">
          <span className="info-label">提示</span>
          <span className="info-value">{game.hints}</span>
        </div>
        <div className="info-item">
          <span className="info-label">错误</span>
          <span className="info-value" style={{ color: game.mistakes > 0 ? 'var(--error)' : 'inherit' }}>
            {game.mistakes}
          </span>
        </div>
      </div>

      <div className="difficulty-selector">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map(diff => (
          <button
            key={diff}
            className={`difficulty-btn ${game.difficulty === diff ? 'active' : ''}`}
            onClick={() => newGame(diff)}
          >
            {DIFFICULTY_LABELS[diff]}
          </button>
        ))}
      </div>

      <div className="controls-row">
        <div className={`toggle-control ${notesMode ? 'active' : ''}`} onClick={() => setNotesMode(!notesMode)}>
          <div className="toggle-icon">✏️</div>
          <span>笔记</span>
        </div>
        <div className={`toggle-control ${highlightMode ? 'active' : ''}`} onClick={() => setHighlightMode(!highlightMode)}>
          <div className="toggle-icon">🔍</div>
          <span>高亮</span>
        </div>
        <div className="toggle-control" onClick={togglePause}>
          <div className="toggle-icon">{isPaused ? '▶️' : '⏸️'}</div>
          <span>{isPaused ? '继续' : '暂停'}</span>
        </div>
      </div>

      <div className="board-wrapper">
        {isPaused && (
          <div className="pause-overlay">
            <div className="pause-content">
              <h2>已暂停</h2>
              <button onClick={togglePause}>继续游戏</button>
            </div>
          </div>
        )}
        <div className="sudoku-board">
          {game.board.map((row, rowIdx) =>
            row.map((_, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={getCellClasses(rowIdx, colIdx)}
                onClick={() => selectCell(rowIdx, colIdx)}
              >
                {getCellDisplay(rowIdx, colIdx)}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="number-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            className={`number-btn ${selectedValue === num ? 'highlighted' : ''}`}
            onClick={() => placeNumber(num)}
          >
            {num}
          </button>
        ))}
        <button className="number-btn eraser" onClick={eraseCell}>
          ✕
        </button>
      </div>

      <div className="action-buttons">
        <button className="action-btn secondary" onClick={validateBoard}>
          验证
        </button>
        <button className="action-btn secondary" onClick={clearBoard}>
          重置
        </button>
        <button className="action-btn primary" onClick={useHint} disabled={game.hints <= 0 || isPaused}>
          提示 ({game.hints})
        </button>
        <button className="action-btn success" onClick={() => newGame(game.difficulty)}>
          新游戏
        </button>
      </div>

      {showWinModal && (
        <div className="win-modal" onClick={() => setShowWinModal(false)}>
          <div className="win-modal-content" onClick={e => e.stopPropagation()}>
            <div className="win-icon">🎉</div>
            <h2>恭喜通关!</h2>
            <p>你完成了 {DIFFICULTY_LABELS[game.difficulty]} 难度的数独</p>
            <p className="win-time">用时: {formatTime(game.elapsedTime)}</p>
            <div className="win-stats">
              <div className="stat">
                <span className="stat-label">错误次数</span>
                <span className="stat-value">{game.mistakes}</span>
              </div>
              <div className="stat">
                <span className="stat-label">剩余提示</span>
                <span className="stat-value">{game.hints}</span>
              </div>
            </div>
            <button
              className="action-btn success"
              style={{ marginTop: '20px', width: '100%' }}
              onClick={() => newGame(game.difficulty)}
            >
              再玩一局
            </button>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>点击格子后点击数字填入 · 笔记模式可标注候选数字</p>
      </footer>
    </div>
  );
}
