'use client';

import { useState, useEffect } from 'react';
import styles from './bingo.module.css';

type Board = number[]; // 0 = empty, 1 = occupied
type CompletedLine = { type: 'row' | 'col' | 'diag1' | 'diag2'; index: number };

const SIZE = 5;
const MAX_MOVES = 16;
const TARGET_LINES = 4;
const SIMULATIONS = 1000; // больше симуляций для точности

// Получить все возможные линии
const getAllLines = () => {
  const lines = [];
  for (let r = 0; r < SIZE; r++) {
    lines.push({ 
      type: 'row', 
      cells: Array.from({ length: SIZE }, (_, c) => r * SIZE + c) 
    });
  }
  for (let c = 0; c < SIZE; c++) {
    lines.push({ 
      type: 'col', 
      cells: Array.from({ length: SIZE }, (_, r) => r * SIZE + c) 
    });
  }
  lines.push({ 
    type: 'diag1', 
    cells: Array.from({ length: SIZE }, (_, i) => i * SIZE + i) 
  });
  lines.push({ 
    type: 'diag2', 
    cells: Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i)) 
  });
  return lines;
};

// Проверка: завершает ли ход линию
const completesLine = (idx: number, b: Board): boolean => {
  const lines = getAllLines();
  for (const line of lines) {
    if (line.cells.includes(idx)) {
      const filledCount = line.cells.filter(cell => b[cell]).length;
      if (filledCount === 4) {
        return true;
      }
    }
  }
  return false;
};

// Проверка: создает ли ход почти-линию
const createsAlmostLine = (idx: number, b: Board): boolean => {
  const lines = getAllLines();
  for (const line of lines) {
    if (line.cells.includes(idx)) {
      const filledCount = line.cells.filter(cell => b[cell]).length;
      if (filledCount === 3) {
        return true;
      }
    }
  }
  return false;
};

// Оценка количества занятых клеток в линиях
const getLineCompletion = (idx: number, b: Board): number => {
  let score = 0;
  const lines = getAllLines();
  
  for (const line of lines) {
    if (line.cells.includes(idx)) {
      const filledCount = line.cells.filter(cell => b[cell]).length;
      score += filledCount;
    }
  }
  
  return score;
};

// Симуляция случайного завершения игры
const simulateGame = (b: Board, movesLeft: number): number => {
  const newBoard = [...b];
  const empty = newBoard.map((_, i) => i).filter(i => !newBoard[i]);
  const toFill = Math.min(movesLeft, empty.length);
  
  // Заполняем случайно оставшиеся клетки
  for (let i = 0; i < toFill; i++) {
    const idx = empty[Math.floor(Math.random() * empty.length)];
    newBoard[idx] = 1;
    empty.splice(empty.indexOf(idx), 1);
  }
  
  // Считаем линии
  const lines = getAllLines().filter(line => 
    line.cells.every(cell => newBoard[cell])
  );
  return lines.length;
};

// Оценка клетки (динамическая)
const evaluateCell = (idx: number, b: Board, movesLeft: number): number => {
  if (b[idx]) return -Infinity;
  
  // 1. АБСОЛЮТНЫЙ ПРИОРИТЕТ: завершение линии
  if (completesLine(idx, b)) {
    return 10000;
  }
  
  // 2. Высокий приоритет: создание почти-линии
  if (createsAlmostLine(idx, b)) {
    return 5000;
  }
  
  // 3. Динамическая оценка текущего состояния
  let score = 0;
  
  // 3.1. Количество занятых клеток в линиях
  const lineCompletion = getLineCompletion(idx, b);
  score += lineCompletion * 100;
  
  // 3.2. Количество линий, в которых участвует клетка
  const linesCount = getAllLines().filter(line => line.cells.includes(idx)).length;
  score += linesCount * 50;
  
  // 3.3. Адаптивный бонус для ключевых конфигураций
  const diag1 = [0, 6, 12, 18, 24]; // 1,7,13,19,25
  const diag2 = [4, 8, 12, 16, 20]; // 5,9,13,17,21
  
  // Если диагональ 1 частично заполнена → бонус
  const diag1Filled = diag1.filter(cell => b[cell]).length;
  if (diag1.includes(idx) && diag1Filled > 1) {
    score += diag1Filled * 300;
  }
  
  // Если диагональ 2 частично заполнена → бонус
  const diag2Filled = diag2.filter(cell => b[cell]).length;
  if (diag2.includes(idx) && diag2Filled > 1) {
    score += diag2Filled * 300;
  }
  
  // 4. MCTS-симуляции (если нет срочных ходов)
  if (score < 1000) {
    let successCount = 0;
    const testBoard = [...b];
    testBoard[idx] = 1;
    
    for (let i = 0; i < SIMULATIONS; i++) {
      const linesCount = simulateGame(testBoard, movesLeft - 1);
      if (linesCount >= TARGET_LINES) successCount++;
    }
    
    score += successCount;
  }
  
  return score;
};

export default function BingoHelper() {
  const [board, setBoard] = useState<Board>(Array(25).fill(0));
  const [completedLines, setCompletedLines] = useState<CompletedLine[]>([]);
  const [hint, setHint] = useState<string>('');
  const [bestMove, setBestMove] = useState<number | null>(null);
  const [moveHistory, setMoveHistory] = useState<number[]>([]);
  const [phase, setPhase] = useState<'yours' | 'random'>('yours');

  // Получить завершённые линии
  const getLines = (b: Board): CompletedLine[] => {
    const lines: CompletedLine[] = [];
    for (let r = 0; r < SIZE; r++) {
      if (b.slice(r * SIZE, r * SIZE + SIZE).every(x => x)) {
        lines.push({ type: 'row', index: r });
      }
    }
    for (let c = 0; c < SIZE; c++) {
      if (Array.from({ length: SIZE }, (_, r) => b[r * SIZE + c]).every(x => x)) {
        lines.push({ type: 'col', index: c });
      }
    }
    if (Array.from({ length: SIZE }, (_, i) => b[i * SIZE + i]).every(x => x)) {
      lines.push({ type: 'diag1', index: -1 });
    }
    if (Array.from({ length: SIZE }, (_, i) => b[i * SIZE + (SIZE - 1 - i)]).every(x => x)) {
      lines.push({ type: 'diag2', index: -1 });
    }
    return lines;
  };

  const getLineIndices = (line: CompletedLine): number[] => {
    if (line.type === 'row') {
      return Array.from({ length: SIZE }, (_, c) => line.index * SIZE + c);
    }
    if (line.type === 'col') {
      return Array.from({ length: SIZE }, (_, r) => r * SIZE + line.index);
    }
    if (line.type === 'diag1') {
      return Array.from({ length: SIZE }, (_, i) => i * SIZE + i);
    }
    if (line.type === 'diag2') {
      return Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i));
    }
    return [];
  };

  const completedIndices = completedLines.flatMap(getLineIndices);

  const calculateHint = (b: Board) => {
    const empty = b.map((_, i) => i).filter(i => !b[i]);
    if (empty.length === 0) {
      setBestMove(null);
      setHint('Все клетки заняты.');
      return;
    }

    const movesLeft = MAX_MOVES - moveHistory.length;
    
    // 1. Ищем клетки, завершающие линии
    const completingMoves = empty.filter(idx => completesLine(idx, b));
    if (completingMoves.length > 0) {
      setBestMove(completingMoves[0]);
      const cellNumber = completingMoves[0] + 1;
      setHint(`🔥 Завершите линию! ${cellNumber}`);
      return;
    }
    
    // 2. Ищем клетки, создающие почти-линии
    const almostMoves = empty.filter(idx => createsAlmostLine(idx, b));
    if (almostMoves.length > 0) {
      const best = almostMoves[0];
      setBestMove(best);
      const cellNumber = best + 1;
      setHint(`⚠️ Создайте почти-линию: ${cellNumber}`);
      return;
    }
    
    // 3. Оценка всех свободных клеток
    const scores = empty.map(idx => ({
      idx,
      score: evaluateCell(idx, b, movesLeft)
    }));

    const best = scores.reduce((a, b) => a.score > b.score ? a : b);
    setBestMove(best.idx);
    const cellNumber = best.idx + 1;
    setHint(`🎯 Оптимальный ход: ${cellNumber}`);
  };

  const handleClick = (idx: number) => {
    if (board[idx] || moveHistory.length >= MAX_MOVES) return;

    const newBoard = [...board];
    newBoard[idx] = 1;
    const newHistory = [...moveHistory, idx];
    const newPhase = phase === 'yours' ? 'random' : 'yours';

    setBoard(newBoard);
    setMoveHistory(newHistory);
    setPhase(newPhase);

    const lines = getLines(newBoard);
    setCompletedLines(lines);

    if (newPhase === 'random') {
      setBestMove(null);
      setHint('🔢 Отметьте выпавшее число');
    } else {
      calculateHint(newBoard);
    }

    if (newHistory.length === MAX_MOVES) {
      const linesCount = lines.length;
      setHint(`🎉 Готово! Линий: ${linesCount}/${TARGET_LINES}`);
      setBestMove(null);
      setTimeout(reset, 2000);
    }
  };

  const undo = () => {
    if (moveHistory.length === 0) return;
    const newHistory = moveHistory.slice(0, -1);
    const newBoard = Array(25).fill(0);
    newHistory.forEach(i => newBoard[i] = 1);
    const newPhase = newHistory.length % 2 === 0 ? 'yours' : 'random';

    setBoard(newBoard);
    setMoveHistory(newHistory);
    setPhase(newPhase);

    const lines = getLines(newBoard);
    setCompletedLines(lines);

    if (newPhase === 'yours') {
      calculateHint(newBoard);
    } else {
      setBestMove(null);
      setHint('🔢 Отметьте выпавшее число');
    }
  };

  const reset = () => {
    setBoard(Array(25).fill(0));
    setMoveHistory([]);
    setPhase('yours');
    setCompletedLines([]);
    calculateHint(Array(25).fill(0));
  };

  useEffect(() => {
    reset();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎯 Бинго — Slime Castle (26% - на 4 линии)</h1>
      
      <div className={styles.info}>
        <p><strong>Ходы:</strong> {moveHistory.length} / {MAX_MOVES}</p>
        <p><strong>Линии:</strong> {completedLines.length} / {TARGET_LINES}</p>
        <div className={styles.hint}>{hint}</div>
      </div>

      <div className={styles.grid}>
        {board.map((val, idx) => {
          const inLine = completedIndices.includes(idx);
          const isBest = phase === 'yours' && bestMove === idx;
          return (
            <div
              key={idx}
              className={`${styles.cell} ${
                val ? inLine ? styles.lineCell : styles.occupiedCell : ''
              } ${isBest ? styles.bestMove : ''}`}
              onClick={() => handleClick(idx)}
            >
              {val ? '✓' : idx + 1}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
        <button onClick={undo} className={styles.undoBtn}>↩️ Отменить</button>
        <button onClick={reset} className={styles.resetBtn}>🔄 Сброс</button>
      </div>
    </div>
  );
}