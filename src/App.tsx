import { useState } from 'react'
import './index.css'

const App = () => {
  let board: number[] = [], solution: number[] = [], fixed: boolean[] = [];
  let notes: Set<number>[] = [];
  let wrongCells = new Set<number>();
  let [selected, setSelected] = useState<number | null>(null);
  let [noteMode, setNoteMode] = useState(false);
  let [lives, setLives] = useState(3);
  let [won, setWon] = useState(false);
  let [screen, setScreen] = useState<'menu' | 'game' | 'result'>('menu');
  let [boardState, setBoardState] = useState<number[]>([]);
  let [notesState, setNotesState] = useState<Set<number>[]>([]);
  let [wrongState, setWrongState] = useState<Set<number>>(new Set());

  const difficultyHoles: Record<number, number> = { 1: 35, 2: 45, 3: 55, 4: 60, 5: 65 };

  function generateSolved(b: number[], sol: number[], idx: number): boolean {
    if (idx === 81) { sol.push(...b); return true; }
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    for (let n of nums) {
      b[idx] = n;
      if (isValid(b, idx)) {
        if (generateSolved(b, sol, idx + 1)) return true;
      }
      b[idx] = 0;
    }
    return false;
  }

  function isValid(b: number[], idx: number): boolean {
    const row = Math.floor(idx / 9), col = idx % 9;
    for (let i = 0; i < 9; i++) {
      if (i !== col && b[row * 9 + i] === b[idx]) return false;
      if (i !== row && b[i * 9 + col] === b[idx]) return false;
    }
    const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const ni = (br + i) * 9 + (bc + j);
      if (ni !== idx && b[ni] === b[idx]) return false;
    }
    return true;
  }

  function isNoteValid(b: number[], idx: number, n: number): boolean {
    const row = Math.floor(idx / 9), col = idx % 9;
    const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
    for (let i = 0; i < 9; i++) {
      if (b[row * 9 + i] === n) return false;
      if (b[i * 9 + col] === n) return false;
    }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      if (b[(br + i) * 9 + (bc + j)] === n) return false;
    }
    return true;
  }

  function getBoxIdx(idx: number): number {
    const row = Math.floor(idx / 9), col = idx % 9;
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
  }

  function startGame(difficulty: number) {
    board = Array(81).fill(0);
    solution = [];
    fixed = Array(81).fill(false);
    notes = Array(81).fill(null).map(() => new Set());
    wrongCells = new Set();
    generateSolved(board, solution, 0);
    const holes = difficultyHoles[difficulty] || 45;
    const positions = [...Array(81).keys()].sort(() => Math.random() - 0.5);
    for (let i = 0; i < holes; i++) board[positions[i]] = 0;
    for (let i = 0; i < 81; i++) fixed[i] = solution[i] !== 0 && board[i] === solution[i];
    setSelected(null);
    setNoteMode(false);
    setLives(3);
    setWon(false);
    setBoardState([...board]);
    setNotesState(notes.map(n => new Set(n)));
    setWrongState(new Set());
    setScreen('game');
  }

  function handleInput(n: number) {
    if (selected === null || fixed[selected]) return;

    if (noteMode) {
      if (board[selected] !== 0) return;
      if (notes[selected].has(n)) {
        notes[selected].delete(n);
      } else {
        if (!isNoteValid(board, selected, n)) return;
        notes[selected].add(n);
      }
      setNotesState(notes.map(ns => new Set(ns)));
      return;
    }

    board[selected] = n;
    if (n !== 0) {
      notes[selected].clear();
      if (n !== solution[selected]) {
        wrongCells.add(selected);
        setLives(l => {
          const nl = l - 1;
          if (nl <= 0) {
            setTimeout(() => setScreen('result'), 500);
          }
          return nl;
        });
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 400);
      } else {
        wrongCells.delete(selected);
      }
    }
    setBoardState([...board]);
    setWrongState(new Set(wrongCells));
    setNotesState(notes.map(ns => new Set(ns)));

    if (board.every((v, i) => v === solution[i])) {
      setWon(true);
      setTimeout(() => setScreen('result'), 500);
    }
  }

  function selectCell(idx: number) {
    setSelected(idx);
  }

  const selRow = selected !== null ? Math.floor(selected / 9) : -1;
  const selCol = selected !== null ? selected % 9 : -1;
  const selBox = selected !== null ? getBoxIdx(selected) : -1;
  const selNum = selected !== null ? boardState[selected] : 0;

  if (screen === 'menu') {
    return (
      <div className="screen active">
        <h1>数独游戏</h1>
        <div className="difficulty-grid">
          {[1,2,3,4,5].map(d => (
            <button key={d} className={`diff-btn ${['easy','medium','hard','expert','demon'][d-1]}`} onClick={() => startGame(d)}>
              {['简单','中等','困难','专家','魔鬼'][d-1]}
              <div className="diff-desc">{difficultyHoles[d]}个空格</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen === 'result') {
    return (
      <div className="screen active">
        <div className="result-icon">{won ? '🎉' : '💔'}</div>
        <div className="result-text" style={{ color: won ? '#4ecca3' : '#e74c3c' }}>
          {won ? '恭喜通关！' : '游戏结束'}
        </div>
        <button className="btn btn-back" onClick={() => setScreen('menu')}>返回选难度</button>
      </div>
    );
  }

  return (
    <div className="screen active">
      <button className="btn btn-back" onClick={() => setScreen('menu')}>← 返回</button>
      <div className="controls">
        {[1,2,3,4,5].map(d => (
          <button key={d} className={`btn btn-${['easy','medium','hard','expert','demon'][d-1]}`} onClick={() => startGame(d)}>
            {['简单','中等','困难','专家','魔鬼'][d-1]}
          </button>
        ))}
      </div>
      <div className="sudoku-grid">
        {boardState.map((v, i) => {
          const row = Math.floor(i / 9), col = i % 9, box = getBoxIdx(i);
          let cls = 'cell';
          if (fixed[i]) cls += ' fixed';
          if (selected === i) cls += ' selected';
          if (wrongState.has(i)) cls += ' error';
          if (selected !== null) {
            if (row === selRow && i !== selected) cls += ' same-row';
            if (col === selCol && i !== selected) cls += ' same-col';
            if (box === selBox && i !== selected) cls += ' same-box';
            if (boardState[i] === selNum && selNum !== 0 && i !== selected) cls += ' same-number';
          }
          return (
            <div key={i} className={cls} onClick={() => selectCell(i)}>
              {v !== 0 && <div className="cell-content">{v}</div>}
              {v === 0 && notesState[i]?.size > 0 && (
                <div className="notes-grid">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <span key={n} className={`note-num ${!isNoteValid(boardState, i, n) && notesState[i]?.has(n) ? 'disabled' : ''} ${selNum !== 0 && notesState[i]?.has(selNum) && n === selNum ? 'highlight' : ''}`}>
                      {notesState[i]?.has(n) ? n : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="bottom-controls">
        <button className={`btn btn-note ${noteMode ? 'active' : ''}`} onClick={() => setNoteMode(!noteMode)}>📝 备注</button>
        <div className="lives">
          {[0,1,2].map(i => <span key={i} className={`life ${i >= lives ? 'lost' : ''}`}>❤️</span>)}
        </div>
      </div>
      <div className="numpad">
        {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} onClick={() => handleInput(n)}>{n}</button>)}
        <button onClick={() => handleInput(0)}>×</button>
      </div>
    </div>
  );
};

export default App;
