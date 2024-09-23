import React, { useState } from "react";
import Board from "./Board";
import PlayerPiece from "./PlayerPiece";

const initialPlayerPositions: [number, number, number][][] = [
  [
    [0, 0, 0],
    [1.5, 0, 0],
    [3, 0, 0],
    [4.5, 0, 0],
  ],
  [
    [0, 1, 0],
    [1.5, 1, 0],
    [3, 1, 0],
    [4.5, 1, 0],
  ],
];
//   const [playerPositions, setPlayerPositions] = useState(
//     initialPlayerPositions
//   );

//   // Logic to move player pieces
//   const movePiece = (index: number) => {
//     setPlayerPositions((prevPositions) => {
//       const newPositions = [...prevPositions];
//       newPositions[index][0] += 1.5; // Moves along the x-axis for demonstration
//       return newPositions;
//     });
//   };

//   return (
//     <>
//       <GameBoard />
//       {playerPositions.map((pos, idx) => (
//         <PlayerPiece
//           key={idx}
//           position={pos}
//           color={["#ffcc00", "#1e90ff", "#ff4500", "#ff1493"][idx]} // Example colors
//           onClick={() => movePiece(idx)}
//         />
//       ))}
//     </>
//   );
// };
const Game: React.FC = () => {
  const [playerPositions, setPlayerPositions] = useState(
    initialPlayerPositions
  );
  const [currentPlayer, setCurrentPlayer] = useState(0);

  const movePiece = (playerIndex: number, pieceIndex: number) => {
    setPlayerPositions((prevPositions) => {
      const newPositions = [...prevPositions];
      newPositions[playerIndex][pieceIndex][0] += 1.5; // Moves along the x-axis for demonstration
      return newPositions;
    });
    setCurrentPlayer((prevPlayer) => (prevPlayer + 1) % playerPositions.length);
  };
  return (
    <>
      <Board />
      {playerPositions.map((positions, playerIndex) =>
        positions.map((pos, pieceIndex) => (
          <PlayerPiece
            key={`${playerIndex}-${pieceIndex}`}
            position={pos}
            color={["#ffcc00", "#1e90ff", "#ff4500", "#ff1493"][playerIndex]} // Example colors
            onClick={() => {
              if (currentPlayer === playerIndex) {
                movePiece(playerIndex, pieceIndex);
              }
            }}
          />
        ))
      )}
    </>
  );
};
export default Game;
