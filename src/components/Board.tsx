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
  T1: "#c0ffee", // teal
  T2: "#32CD32", // Green
  T3: "#1E90FF", // Blue
  T4: "#FF4500", // Red
  T5: "#ff1493", // White
  T6: "#FFD700", // Yellow
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
    targetRow: number,
    targetCol: number
  ) => {
    // Check if the move is exactly 2 spaces away
    const rowDiff = Math.abs(targetRow - selectedRow);
    const colDiff = Math.abs(targetCol - selectedCol);

    // The move must be exactly 2 spaces in either row, column, or both (diagonal)
    const isTwoSpacesAway =
      (rowDiff === 2 && colDiff === 0) || // Vertical
      (colDiff === 2 && rowDiff === 0) || // Horizontal
      rowDiff === 2 ||
      colDiff === 2; // Diagonal

    if (!isTwoSpacesAway) {
      console.log("Not a jump");
      return false; // If not exactly two spaces away, not a jump
    }

    // Calculate the middle cell that the piece is jumping over
    const middleRow = selectedRow + (targetRow - selectedRow) / 2;
    const middleCol = selectedCol + (targetCol - selectedCol) / 2;

    // Ensure the middle cell contains a piece and the target cell is empty
    const middlePiece = layout[middleRow][middleCol];
    const targetCellEmpty = layout[targetRow][targetCol] === null;

    if (middlePiece !== null && targetCellEmpty) {
      console.log("Jumped over", middlePiece);
      return true; // Valid jump move
    }

    return false; // Invalid jump if middle piece isn't there or target cell is occupied
  };

  const isValidMove = (
    selectedRow: number,
    selectedCol: number,
    targetRow: number,
    targetCol: number
  ) => {
    // Check if the target is an adjacent cell
    const isAdjacentMove =
      Math.abs(targetRow - selectedRow) <= 1 &&
      Math.abs(targetCol - selectedCol) <= 1;

    // If it's an adjacent move and the target cell is empty, return true
    if (isAdjacentMove && layout[targetRow][targetCol] === null) {
      return true; // Valid adjacent move
    }

    // Otherwise, check if it's a valid jump move
    return isJumpMove(selectedRow, selectedCol, targetRow, targetCol);
  };
  const checkFurtherJumps = (currentRow: number, currentCol: number) => {
    // Check all possible directions (horizontal, vertical, diagonal) for further jumps
    const directions = [
      [2, 0], // Down
      [-2, 0], // Up
      [0, 2], // Right
      [0, -2], // Left
      [2, 2], // Diagonal down-right
      [-2, -2], // Diagonal up-left
      [2, -2], // Diagonal down-left
      [-2, 2], // Diagonal up-right
    ];

    // Iterate over all directions and check if a further jump is possible
    for (const [rowOffset, colOffset] of directions) {
      const targetRow = currentRow + rowOffset;
      const targetCol = currentCol + colOffset;

      // Ensure the target is within board bounds
      if (
        targetRow >= 0 &&
        targetRow < layout.length &&
        targetCol >= 0 &&
        targetCol < layout[0].length
      ) {
        if (isJumpMove(currentRow, currentCol, targetRow, targetCol)) {
          return true; // Further jump is possible
        }
      }
    }

    return false; // No further jumps available
  };

  const handleClick = (rowIndex: number, colIndex: number) => {
    console.log("Clicked", rowIndex, colIndex);
    if (selectedPiece === null) {
      // First click - select the piece if there is a piece in the clicked cell
      if (layout[rowIndex][colIndex]?.startsWith("T")) {
        setSelectedPiece([rowIndex, colIndex]);
      }
    } else {
      // Second click - try to move the piece
      const [selectedRow, selectedCol] = selectedPiece;

      // Check if it's a valid move (either adjacent move or a jump)
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

          // After the jump, check if further jumps are possible
          const furtherJumpAvailable = checkFurtherJumps(rowIndex, colIndex);
          if (!furtherJumpAvailable) {
            // No more jumps available, reset selection
            setSelectedPiece(null);
          }
        } else {
          // Reset the selected piece after a basic move
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
        justifyContent: "center",
        backgroundColor: "#8B4513", // Wood color
        borderRadius: "50%", // Circular board effect
        padding: "20px",
        width: "900px",
        height: "900px",
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
