import { useState, useEffect, useCallback } from 'react';
import {
  GameState,
  Difficulty,
  generateSudoku,
  createEmptyGame,
  getRelatedCells,
  findErrors,
  isBoardComplete,
  checkValue
} from './utils/sudoku';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

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

  useEffect(() => {
    const timer = setInterval(() => {
      if (!game.isWon && !game.isComplete) {
        setGame(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [game.isWon, game.isComplete]);

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
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    setGame(prev => ({ ...prev, selectedCell: [row, col] }));
  }, []);

  const placeNumber = useCallback((num: number | null) => {
    if (!game.selectedCell || game.isComplete || game.isWon) return;

    const [row, col] = game.selectedCell;
    if (game.board[row][col] !== null && !game.board[row][col] === null) {
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
      const oldValue = newBoard[row][col];
      newBoard[row][col] = num;

      if (oldValue !== num) {
        const isCorrect = checkValue(newBoard, game.solution, row, col, num);

        if (!isCorrect) {
          setGame(prev => {
            const newErrors = new Set(prev.mistakes > 0 ? errors : errors);
            newErrors.add(`${row}-${col}`);
            return {
              ...prev,
              board: newBoard,
              mistakes: prev.mistakes + 1,
              notes: originalNotes.map(layer => layer.map(r => [...r]))
            };
          });
        } else {
          setGame(prev => ({
            ...prev,
            board: newBoard,
            notes: originalNotes.map(layer => layer.map(r => [...r]))
          }));

          setErrors(findErrors(newBoard, game.solution));

          if (isBoardComplete(newBoard)) {
            setGame(prev => ({ ...prev, isWon: true, isComplete: true }));
          }
        }
      }
    }
  }, [game.selectedCell, game.board, game.notes, game.solution, notesMode, errors]);

  const useHint = useCallback(() => {
    if (game.hints <= 0 || game.isComplete || game.isWon) return;

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
  }, [game.hints, game.board, game.notes, game.solution, game.isComplete, game.isWon]);

  const validateBoard = useCallback(() => {
    const newErrors = findErrors(game.board, game.solution);
    setErrors(newErrors);
  }, [game.board, game.solution]);

  const clearBoard = useCallback(() => {
    setGame(prev => ({
      ...prev,
      board: prev.board.map(row =>
        row.map((cell, idx) => {
          const col = idx % 9;
          const rowIdx = Math.floor(idx / 9);
          const isFixed = prev.solution[rowIdx][col] !== null &&
                         prev.board[rowIdx][col] === prev.solution[rowIdx][col];
          return isFixed ? prev.solution[rowIdx][col] : null;
        })
      ),
      notes: prev.notes.map(layer => layer.map(row => Array(9).fill(false)))
    }));
    setErrors(new Set());
  }, []);

  const getCellDisplay = (row: number, col: number) => {
    const value = game.board[row][col];
    const notes = game.notes[row][col];

    if (value !== null) {
      return <span>{value}</span>;
    }

    if (notesMode) {
      return (
        <div className="notes-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <span key={n}>{notes[n - 1] ? n : ''}</span>
          ))}
        </div>
      );
    }

    const activeNotes = notes.map((active, idx) => active ? idx + 1 : null).filter(Boolean);
    if (activeNotes.length > 0) {
      return (
        <div className="notes-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <span key={n}>{notes[n - 1] ? n : ''}</span>
          ))}
        </div>
      );
    }

    return null;
  };

  const getCellClasses = (row: number, col: number) => {
    const classes = ['cell'];
    const isFixed = game.solution[row][col] !== null && game.board[row][col] === game.solution[row][col];

    if (isFixed) classes.push('fixed');

    if (game.selectedCell) {
      const [selRow, selCol] = game.selectedCell;
      if (selRow === row && selCol === col) {
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

      if (game.board[selRow][selCol] !== null && game.board[row][col] === game.board[selRow][selCol]) {
        classes.push('same-value');
      }
    }

    if (errors.has(`${row}-${col}`)) {
      classes.push('error');
    }

    return classes.join(' ');
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>数独游戏</h1>
        <p>挑战智慧，享受乐趣</p>
      </header>

      <div className="game-info">
        <div className="info-item">
          <span className="info-label">时间</span>
          <span className="info-value">{formatTime(game.elapsedTime)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">难度</span>
          <span className="info-value" style={{ textTransform: 'capitalize' }}>{game.difficulty}</span>
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
            {diff === 'easy' ? '简单' : diff === 'medium' ? '中等' : '困难'}
          </button>
        ))}
      </div>

      <div className="notes-toggle">
        <div
          className={`toggle-switch ${notesMode ? 'active' : ''}`}
          onClick={() => setNotesMode(!notesMode)}
        />
        <span className="notes-mode">笔记模式 {notesMode ? '开启' : '关闭'}</span>
      </div>

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

      <div className="number-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            className="number-btn"
            onClick={() => placeNumber(num)}
          >
            {num}
          </button>
        ))}
        <button
          className="number-btn eraser"
          onClick={() => placeNumber(null)}
        >
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
        <button className="action-btn primary" onClick={useHint} disabled={game.hints <= 0}>
          提示 ({game.hints})
        </button>
        <button className="action-btn success" onClick={() => newGame(game.difficulty)}>
          新游戏
        </button>
      </div>

      {showWinModal && (
        <div className="win-modal" onClick={() => setShowWinModal(false)}>
          <div className="win-modal-content" onClick={e => e.stopPropagation()}>
            <h2>恭喜通关!</h2>
            <p>你完成了 {game.difficulty === 'easy' ? '简单' : game.difficulty === 'medium' ? '中等' : '困难'} 难度的数独</p>
            <p>用时: {formatTime(game.elapsedTime)}</p>
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
        <p>点击格子后点击数字填入 · 点击 ✕ 清除</p>
      </footer>
    </div>
  );
}
