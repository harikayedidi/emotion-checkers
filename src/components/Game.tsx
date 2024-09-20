import React, { useState } from "react";
import Board from "./Board";
import PlayerPiece from "./PlayerPiece";

// Initial player positions and colors
// const initialPlayerPositions: [number, number, number][] = [
//   [0, 0, 0],
//   [1.5, 0, 0],
//   [3, 0, 0],
//   [4.5, 0, 0],
// ];

// const Game: React.FC = () => {
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
  return (
    <>
      <Board />
      <PlayerPiece position={[0, 1, 0]} color="red" />
      <PlayerPiece position={[2, 1, 0]} color="blue" />
    </>
  );
};
export default Game;
