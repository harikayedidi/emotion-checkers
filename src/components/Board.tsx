import React, { useState, useEffect } from "react";
import { useDebug } from "../DebugContext";

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

const Board: React.FC = () => {
  const { debug } = useDebug();
  const [layout, setLayout] = useState(initialLayout);
  const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(
    null
  );
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0); // Player 1 starts
  const [retainedColors, setRetainedColors] = useState<{
    [key: string]: { color: string; backgroundColor: string };
  }>({}); // Track retained colors
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);

  useEffect(() => {
    if (debug) {
      console.log(`Turn: ${players[currentPlayerIndex].name}`);
    }
  }, [currentPlayerIndex, debug]);

  const getValidMoves = (
    row: number,
    col: number,
  ): [number, number][] => {
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    const moves: [number, number][] = [];
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (
        layout[nr] &&
        (layout[nr][nc] === null || layout[nr][nc] === "C")
      ) {
        moves.push([nr, nc]);
      }
      const jr = row + dr * 2;
      const jc = col + dc * 2;
      if (
        layout[nr] &&
        layout[jr] &&
        layout[nr][nc] !== null &&
        (layout[jr][jc] === null || layout[jr][jc] === "C")
      ) {
        moves.push([jr, jc]);
      }
    }
    return moves;
  };

  // Handle piece movement
  const handleClick = (rowIndex: number, colIndex: number) => {
    const currentPlayer = players[currentPlayerIndex];

    if (selectedPiece === null) {
      if (layout[rowIndex][colIndex] === currentPlayer.color) {
        setSelectedPiece([rowIndex, colIndex]);
        setValidMoves(getValidMoves(rowIndex, colIndex));
      }
    } else {
      const [selectedRow, selectedCol] = selectedPiece;

      const isValid = validMoves.some(
        ([r, c]) => r === rowIndex && c === colIndex,
      );

      if (isValid) {
        const newLayout = [...layout];

        // Move the piece to the new location
        newLayout[rowIndex][colIndex] = newLayout[selectedRow][selectedCol];

        // Retain the color and background color of the old location before clearing the piece
        const currentColor = newLayout[selectedRow][selectedCol]!;
        const playerBackgroundColor = players.find(
          (player) => player.color === currentColor
        )?.backgroundColor;
        setRetainedColors({
          ...retainedColors,
          [`${selectedRow},${selectedCol}`]: {
            color: currentColor,
            backgroundColor: playerBackgroundColor!,
          },
        });

        // Clear the old location (piece removed, but color retained)
        newLayout[selectedRow][selectedCol] = null;

        setLayout(newLayout);

        // Reset the selected piece and switch turns
        setSelectedPiece(null);
        setValidMoves([]);
        if (debug) {
          console.log(
            `Player ${currentPlayer.name} moved from ${selectedRow},${selectedCol} to ${rowIndex},${colIndex}`,
          );
        }
        const nextPlayer = (currentPlayerIndex + 1) % players.length;
        setCurrentPlayerIndex(nextPlayer); // Switch turn
        if (debug) {
          console.log(`Next turn: ${players[nextPlayer].name}`);
        }
      } else {
        setSelectedPiece(null); // Invalid move, reset selection
        setValidMoves([]);
      }
    }
  };

  // Define the cell style based on whether it is selected or retains its color
  const cellStyle = (
    cell: string | null,
    isSelected: boolean,
    isValid: boolean,
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
      ...(isValid && debug ? { outline: "2px dashed #ffffff" } : {}),
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
                    validMoves.some(
                      ([r, c]) => r === rowIndex && c === colIndex,
                    ),
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
