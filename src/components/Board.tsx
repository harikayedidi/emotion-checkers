import React, { useMemo, useState } from "react";

// Initial layout for the star-shaped Chinese Checkers board
const initialLayout = [
  [
    null,
    null,
    null,
    null,
    null,
    null,
    "T4",
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  [null, null, null, null, null, "T4", "T4", null, null, null, null, null],
  [
    null,
    null,
    null,
    null,
    null,
    "T4",
    "T4",
    "T4",
    null,
    null,
    null,
    null,
    null,
  ],
  [null, null, null, null, "T4", "T4", "T4", "T4", null, null, null, null],
  ["T1", "T1", "T1", "T1", "C", "C", "C", "C", "C", "T6", "T6", "T6", "T6"],
  ["T1", "T1", "T1", "C", "C", "C", "C", "C", "C", "T6", "T6", "T6"],
  [null, "T1", "T1", "C", "C", "C", "C", "C", "C", "C", "T6", "T6", null],
  [null, "T1", "C", "C", "C", "C", "C", "C", "C", "C", "T6", null],
  [null, null, "C", "C", "C", "C", "C", "C", "C", "C", "C", null, null],
  [null, "T5", "C", "C", "C", "C", "C", "C", "C", "C", "T3", null],
  [null, "T5", "T5", "C", "C", "C", "C", "C", "C", "C", "T3", "T3", null],
  ["T5", "T5", "T5", "C", "C", "C", "C", "C", "C", "T3", "T3", "T3"],
  ["T5", "T5", "T5", "T5", "C", "C", "C", "C", "C", "T3", "T3", "T3", "T3"],
  [null, null, null, null, "T2", "T2", "T2", "T2", null, null, null, null],
  [
    null,
    null,
    null,
    null,
    null,
    "T2",
    "T2",
    "T2",
    null,
    null,
    null,
    null,
    null,
  ],
  [null, null, null, null, null, "T2", "T2", null, null, null, null, null],
  [
    null,
    null,
    null,
    null,
    null,
    null,
    "T2",
    null,
    null,
    null,
    null,
    null,
    null,
  ],
];

// Colors for the six triangles and center
const colors = {
  T1: "#000000", // teal
  T2: "#32CD32", // Green
  T3: "#1E90FF", // Blue
  T4: "#FF4500", // Red
  T5: "#ff1493", // White
  T6: "#FFD700", // Yellow
  C: "#ffffff", // Neutral center
};

const players = [
  { name: "Player 1", color: "T1", backgroundColor: "#000000" },
  { name: "Player 4", color: "T4", backgroundColor: "#FF4500" },
  { name: "Player 6", color: "T6", backgroundColor: "#FFD700" },
  { name: "Player 3", color: "T3", backgroundColor: "#1E90FF" },
  { name: "Player 2", color: "T2", backgroundColor: "#32CD32" },
  { name: "Player 5", color: "T5", backgroundColor: "#ff1493" },
];

const CELL_SIZE = 50;

interface Piece {
  id: number;
  row: number;
  col: number;
  color: keyof typeof colors;
}

const initialPieces: Piece[] = [];
let pid = 0;
initialLayout.forEach((row, r) => {
  row.forEach((cell, c) => {
    if (cell && cell !== "C") {
      initialPieces.push({ id: pid++, row: r, col: c, color: cell as keyof typeof colors });
    }
  });
});

const boardColors = initialLayout.map((row) => row.map((cell) => (cell ? (cell as keyof typeof colors) : null)));

const Board: React.FC = () => {
  const [pieces, setPieces] = useState<Piece[]>(initialPieces);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const pieceAt = (r: number, c: number) =>
    pieces.find((p) => p.row === r && p.col === c);

  const isValidMove = (piece: Piece, r: number, c: number) => {
    if (r < 0 || r >= boardColors.length) return false;
    if (c < 0 || c >= boardColors[r].length) return false;
    if (boardColors[r][c] === null) return false;
    if (pieceAt(r, c)) return false;

    const dr = r - piece.row;
    const dc = c - piece.col;

    if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) return true;
    if (
      (Math.abs(dr) === 2 && Math.abs(dc) === 0) ||
      (Math.abs(dc) === 2 && Math.abs(dr) === 0) ||
      (Math.abs(dr) === 2 && Math.abs(dc) === 2)
    ) {
      const midRow = piece.row + dr / 2;
      const midCol = piece.col + dc / 2;
      return !!pieceAt(midRow, midCol);
    }
    return false;
  };

  const validMoves = useMemo(() => {
    if (selectedPieceId === null) return [] as [number, number][];
    const piece = pieces.find((p) => p.id === selectedPieceId);
    if (!piece) return [] as [number, number][];
    const moves: [number, number][] = [];
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const r = piece.row + dr;
        const c = piece.col + dc;
        if (isValidMove(piece, r, c)) moves.push([r, c]);
      }
    }
    return moves;
  }, [selectedPieceId, pieces]);

  const animateMove = (piece: Piece, targetRow: number, targetCol: number) => {
    const dr = targetRow - piece.row;
    const dc = targetCol - piece.col;
    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const rowStep = dr / steps;
    const colStep = dc / steps;
    const delay = 300;
    for (let i = 1; i <= steps; i++) {
      setTimeout(() => {
        setPieces((prev) =>
          prev.map((p) =>
            p.id === piece.id
              ? { ...p, row: piece.row + rowStep * i, col: piece.col + colStep * i }
              : p
          )
        );
      }, delay * (i - 1));
    }
    setTimeout(() => {
      setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    }, delay * steps);
  };

  const handleCellClick = (row: number, col: number) => {
    if (selectedPieceId === null) return;
    const piece = pieces.find((p) => p.id === selectedPieceId);
    if (!piece) return;
    if (isValidMove(piece, row, col)) {
      animateMove(piece, row, col);
    }
    setSelectedPieceId(null);
  };

  const handlePieceClick = (piece: Piece) => {
    if (piece.color === players[currentPlayerIndex].color) {
      setSelectedPieceId(piece.id);
    }
  };

  // Define the cell style based on whether it is selected or retains its color
  const cellStyle = (
    cell: string | null,
    isSelected: boolean,
    rowIndex: number,
    colIndex: number
  ) => {
    const isValid = validMoves.some(
      ([r, c]) => r === rowIndex && c === colIndex
    );

    return {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: colors[cell as keyof typeof colors] || "transparent",
      border: cell !== null ? `5px solid ${colors[cell as keyof typeof colors]}` : "none",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      margin: "2px",
      cursor: "pointer",
      boxSizing: "border-box",
      ...(isSelected ? { border: "3px solid #ffffff" } : {}),
      ...(isValid ? { outline: "3px solid #ffffff" } : {}),
    } as React.CSSProperties;
  };

  return (
    <div>
      <div className="flex flex-col bg-white items-center text-4xl text-center mb-[30px] py-[20px]">
  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
    Current Turn: {players[currentPlayerIndex].name}
  </span>
</div>
      <div
        className="relative flex flex-col items-center text-white text-lg justify-center bg-yellow-700 rounded-full p-1 w-[900px] h-[900px]"
      >
        {boardColors.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${row.length}, 40px)`,
              gap: "10px",
            }}
          >
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={cellStyle(
                  cell,
                  false,
                  rowIndex,
                  colIndex
                )}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              ></div>
            ))}
          </div>
        ))}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {pieces.map((piece) => (
            <div
              key={piece.id}
              className="pointer-events-auto"
              onClick={() => handlePieceClick(piece)}
              style={{
                position: "absolute",
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: colors[piece.color],
                border: "3px solid #ffffff",
                transform: `translate(${piece.col * CELL_SIZE}px, ${piece.row * CELL_SIZE}px)`,
                transition: "transform 0.3s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
