/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { extend } from "@react-three/fiber";
import { SphereGeometry } from "three"; // Import SphereGeometry from three

extend({ SphereGeometry });

interface PlayerPieceProps {
  position: [number, number, number];
  color: string;
  onClick: () => void;
}

const PlayerPiece: React.FC<PlayerPieceProps> = ({
  position,
  color,
  onClick,
}) => {
  return (
    <mesh position={position} onClick={onClick}>
      <cylinderBufferGeometry args={[1, 1, 0.2, 6]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

export default PlayerPiece;
