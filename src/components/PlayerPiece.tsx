/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { extend } from "@react-three/fiber";
import { SphereGeometry } from "three"; // Import SphereGeometry from three

extend({ SphereGeometry });

interface PlayerPieceProps {
  position: [number, number, number];
  color: string;
  // onClick: () => void;
}

// A simple hexagonal tile for the board
// export const HexTile = ({
//   position,
// }: {
//   position: [number, number, number];
// }) => {
//   return (
//     <mesh position={position}>
//       <cylinderBufferGeometry args={[1, 1, 0.2, 6]} />
//       <meshStandardMaterial color="#f0e68c" />
//     </mesh>
//   );
// };

// // The animated player piece component
// const PlayerPiece: React.FC<PlayerPieceProps> = ({
//   position,
//   color,
//   onClick,
// }) => {
//   // Using spring animation to animate the position changes
//   const { pos } = useSpring({ pos: position });

//   return (
//     <animated.mesh position={pos as any} onClick={onClick}>
//       <sphereBufferGeometry args={[0.5, 32, 32]} /> {/* Adjusted geometry */}
//       <meshStandardMaterial color={color} />
//     </animated.mesh>
//   );
// };

const PlayerPiece: React.FC<PlayerPieceProps> = ({ position, color }) => {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5, 32, 32]} /> {/* Notice sphereGeometry */}
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export default PlayerPiece;
