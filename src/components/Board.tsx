import React, { useState } from "react";

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

// Players ordered clockwise by team number
const players = [
  { name: "Player 1", color: "T1", backgroundColor: "#000000" },
  { name: "Player 2", color: "T2", backgroundColor: "#32CD32" },
  { name: "Player 3", color: "T3", backgroundColor: "#1E90FF" },
  { name: "Player 4", color: "T4", backgroundColor: "#FF4500" },
  { name: "Player 5", color: "T5", backgroundColor: "#ff1493" },
  { name: "Player 6", color: "T6", backgroundColor: "#FFD700" },
];

const Board: React.FC = () => {
  const [layout, setLayout] = useState(initialLayout);
  const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(
    null
  );
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0); // Player 1 starts
  const [retainedColors, setRetainedColors] = useState<{
    [key: string]: { color: string; backgroundColor: string };
  }>({}); // Track retained colors

  // Handle piece movement
  const handleClick = (rowIndex: number, colIndex: number) => {
    const currentPlayer = players[currentPlayerIndex];

    // Utility helpers
    const isValidCell = (
      r: number,
      c: number,
      board: (string | null)[][]
    ): boolean =>
      r >= 0 &&
      c >= 0 &&
      r < board.length &&
      c < board[r].length &&
      board[r][c] !== undefined;

    const updateColor = (
      obj: { [key: string]: { color: string; backgroundColor: string } },
      r: number,
      c: number,
      color: string
    ) => {
      const bg = players.find((p) => p.color === color)?.backgroundColor!;
      obj[`${r},${c}`] = { color, backgroundColor: bg };
    };

    if (selectedPiece === null) {
      if (layout[rowIndex][colIndex] === currentPlayer.color) {
        setSelectedPiece([rowIndex, colIndex]);
      }
      return;
    }

    const [selectedRow, selectedCol] = selectedPiece;
    const target = layout[rowIndex][colIndex];

    // Destination must be empty
    if (target !== null && target !== "C") {
      setSelectedPiece(null);
      return;
    }

    const rowDiff = rowIndex - selectedRow;
    const colDiff = colIndex - selectedCol;
    const absRow = Math.abs(rowDiff);
    const absCol = Math.abs(colDiff);

    // Reject diagonal or large moves
    if ((absRow && absCol) || absRow > 2 || absCol > 2) {
      setSelectedPiece(null);
      return;
    }

    const newLayout = layout.map((row) => [...row]);
    const newRetained = { ...retainedColors };
    const pieceColor = newLayout[selectedRow][selectedCol]!;

    const movePiece = (fromR: number, fromC: number, toR: number, toC: number) => {
      updateColor(newRetained, fromR, fromC, pieceColor);
      newLayout[toR][toC] = pieceColor;
      newLayout[fromR][fromC] = null;
    };

    const performJumps = (startR: number, startC: number) => {
      let r = startR;
      let c = startC;
      let jumped = true;

      while (jumped) {
        jumped = false;
        const dirs = [
          [-2, 0],
          [2, 0],
          [0, -2],
          [0, 2],
        ];

        for (const [dr, dc] of dirs) {
          const midR = r + dr / 2;
          const midC = c + dc / 2;
          const destR = r + dr;
          const destC = c + dc;

          if (
            isValidCell(destR, destC, newLayout) &&
            isValidCell(midR, midC, newLayout) &&
            (newLayout[destR][destC] === null ||
              newLayout[destR][destC] === "C") &&
            newLayout[midR][midC] !== null &&
            newLayout[midR][midC] !== "C"
          ) {
            movePiece(r, c, destR, destC);
            r = destR;
            c = destC;
            jumped = true;
            break;
          }
        }
      }
    };

    const isAdjacent = (absRow === 1 && colDiff === 0) || (absCol === 1 && rowDiff === 0);
    const isJump = (absRow === 2 && colDiff === 0) || (absCol === 2 && rowDiff === 0);

    if (isAdjacent) {
      movePiece(selectedRow, selectedCol, rowIndex, colIndex);
    } else if (isJump) {
      const midRow = selectedRow + rowDiff / 2;
      const midCol = selectedCol + colDiff / 2;

      if (
        !isValidCell(midRow, midCol, layout) ||
        layout[midRow][midCol] === null ||
        layout[midRow][midCol] === "C"
      ) {
        setSelectedPiece(null);
        return;
      }

      movePiece(selectedRow, selectedCol, rowIndex, colIndex);
      performJumps(rowIndex, colIndex);
    } else {
      setSelectedPiece(null);
      return;
    }

    setLayout(newLayout);
    setRetainedColors(newRetained);
    setSelectedPiece(null);
    setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
  };

  // Define the cell style based on whether it is selected or retains its color
  const cellStyle = (
    cell: string | null,
    isSelected: boolean,
    rowIndex: number,
    colIndex: number
  ) => {
    const retainedCell = retainedColors[`${rowIndex},${colIndex}`];

    return {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      backgroundColor: retainedCell
        ? "#ffffff"
        : colors[cell as keyof typeof colors] || "transparent",
      border:
        cell !== null || retainedCell
          ? "5px solid " +
            (retainedCell ? retainedCell.backgroundColor : "transparent")
          : "none",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      margin: "2px",
      cursor: "pointer",
      boxSizing: "border-box",
      ...(isSelected ? { border: "3px solid #ffffff" } : {}),
    };
  };

  return (
    <div>
      <div className="flex flex-col bg-white items-center text-4xl text-center mb-[30px] py-[20px]">
  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
    Current Turn: {players[currentPlayerIndex].name}
  </span>
</div>
      <div
      className="flex flex-col items-center text-white text-lg justify-center bg-yellow-700 rounded-full p-1 w-[900px] h-[900px]">
        {layout.map((row, rowIndex) => (
          <div
            key={rowIndex}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${row.length}, 40px)`,
              gap: "10px",
            }}>
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={
                  cellStyle(
                    cell,
                    selectedPiece !== null &&
                      selectedPiece[0] === rowIndex &&
                      selectedPiece[1] === colIndex,
                    rowIndex,
                    colIndex
                  ) as React.CSSProperties
                }
                onClick={() => handleClick(rowIndex, colIndex)}>
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;
