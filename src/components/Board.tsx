import React, { useState } from "react";
// import { extend } from "@react-three/fiber";
// import { CylinderGeometry } from "three";
// extend({ CylinderGeometry });
// import { HexTile } from "./PlayerPiece";

// const Board: React.FC = () => {
//   const rows = 5; // Simplified board rows
//   const tiles: JSX.Element[] = [];

//   for (let row = 0; row < rows; row++) {
//     for (let col = 0; col < row + 1; col++) {
//       tiles.push(
//         <HexTile key={`${row}-${col}`} position={[col * 1.5, 0, row * 1.75]} />
//       );
//     }
//   }

//   return <>{tiles}</>;
// };

// const Board: React.FC = () => {
//   const rows = 3;
//   const tiles = [];

//   for (let row = 0; row < rows; row++) {
//     for (let col = 0; col < row + 1; col++) {
//       tiles.push(
//         <mesh key={`${row}-${col}`} position={[col * 1.5, 0, row * 1.75]}>
//           <cylinderGeometry args={[1, 1, 0.2, 6]} />{" "}
//           {/* Notice cylinderGeometry */}
//           <meshStandardMaterial color="#f0e68c" />
//         </mesh>
//       );
//     }
//   }

//   return <>{tiles}</>;
// };

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
  [
    "T1",
    "T1",
    "T1",
    "T1",
    null,
    null,
    null,
    null,
    null,
    "T6",
    "T6",
    "T6",
    "T6",
  ],
  ["T1", "T1", "T1", null, null, null, null, null, null, "T6", "T6", "T6"],
  [
    null,
    "T1",
    "T1",
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    "T6",
    "T6",
    null,
  ],
  [null, "T1", null, null, null, null, null, null, null, null, "T6", null],
  [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ],
  [null, "T5", null, null, null, null, null, null, null, null, "T3", null],
  [
    null,
    "T5",
    "T5",
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    "T3",
    "T3",
    null,
  ],
  ["T5", "T5", "T5", null, null, null, null, null, null, "T3", "T3", "T3"],
  [
    "T5",
    "T5",
    "T5",
    "T5",
    null,
    null,
    null,
    null,
    null,
    "T3",
    "T3",
    "T3",
    "T3",
  ],
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
  T1: "#FFD700", // Yellow
  T2: "#32CD32", // Green
  T3: "#1E90FF", // Blue
  T4: "#FF4500", // Red
  T5: "#FFFFFF", // White
  T6: "#c0ffee", // teal
  C: "#e3e3e3", // Neutral center
};

const Board: React.FC = () => {
  const [layout, setLayout] = useState(initialLayout);
  const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(
    null
  );

  const isJumpMove = (
    selectedRow: number,
    selectedCol: number,
    rowIndex: number,
    colIndex: number
  ) => {
    // Check if it's a valid jump over an adjacent piece
    const isJump =
      Math.abs(rowIndex - selectedRow) === 2 &&
      Math.abs(colIndex - selectedCol) === 2;

    if (isJump) {
      // Get the middle piece (the piece being jumped over)
      const middleRow = (selectedRow + rowIndex) / 2;
      const middleCol = (selectedCol + colIndex) / 2;

      // Jump is valid if the middle cell contains a piece and the destination is empty
      if (
        layout[middleRow][middleCol] !== null &&
        layout[rowIndex][colIndex] === null
      ) {
        return true;
      }
    }
    return false;
  };

  const isValidMove = (
    selectedRow: number,
    selectedCol: number,
    rowIndex: number,
    colIndex: number
  ) => {
    // Check if the move is a basic diagonal move (one space)
    const isDiagonalMove =
      Math.abs(rowIndex - selectedRow) === 1 &&
      Math.abs(colIndex - selectedCol) === 1;

    // If it's a diagonal move, the destination must be empty
    if (isDiagonalMove && layout[rowIndex][colIndex] === null) {
      return true;
    }

    // Check for a valid jump move
    return isJumpMove(selectedRow, selectedCol, rowIndex, colIndex);
  };

  const handleClick = (rowIndex: number, colIndex: number) => {
    if (selectedPiece === null) {
      // First click - select the piece if there is a piece in the clicked cell
      if (layout[rowIndex][colIndex]?.startsWith("T")) {
        setSelectedPiece([rowIndex, colIndex]);
      }
    } else {
      // Second click - try to move the piece
      const [selectedRow, selectedCol] = selectedPiece;

      // Check if it's a valid move (either adjacent diagonal or a jump)
      if (isValidMove(selectedRow, selectedCol, rowIndex, colIndex)) {
        const newLayout = [...layout];

        // Move the piece to the new location
        newLayout[rowIndex][colIndex] = newLayout[selectedRow][selectedCol];

        // Clear the old location
        newLayout[selectedRow][selectedCol] = null;

        // Update the board layout
        setLayout(newLayout);

        // Check if it's a jump move
        if (isJumpMove(selectedRow, selectedCol, rowIndex, colIndex)) {
          // Allow chain jumps by keeping the selected piece in the new location
          setSelectedPiece([rowIndex, colIndex]);
        } else {
          // Reset the selected piece after the move
          setSelectedPiece(null);
        }
      } else {
        // Invalid move, reset the selection
        setSelectedPiece(null);
      }
    }
  };

  const cellStyle = (color: string | undefined) => ({
    width: "40px",
    height: "40px",
    borderRadius: "50%", // Circular pieces
    backgroundColor: color || "transparent",
    border: "1px solid #999",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "2px",
    cursor: "pointer",
  });

  const rowStyle = (row: any[]) => ({
    display: "grid",
    gridTemplateColumns: `repeat(${row.length}, 40px)`,
    justifyContent: "center", // Center rows with fewer cells
    gap: "10px",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#8B4513", // Wood color
        borderRadius: "50%", // Circular board effect
        padding: "20px",
        width: "auto",
        height: "auto",
      }}>
      {layout.map((row, rowIndex) => (
        <div key={rowIndex} style={rowStyle(row)}>
          {row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={cellStyle(
                colors[cell as keyof typeof colors] || "transparent"
              )}
              onClick={() => handleClick(rowIndex, colIndex)}>
              {/* Optional: {cell} */}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;
