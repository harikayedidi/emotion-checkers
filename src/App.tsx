import emotionCheckersLogo from "./assets/logo.png";
import { Canvas } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei"; // For better camera control
// import Game from "./components/Game";
import Game from "./components/Board";
import { Suspense } from "react";

function App() {
  return (
    // <>
    //   <div
    //     style={{
    //       position: "absolute",
    //       top: 0,
    //       left: "50%",
    //       transform: "translateX(-50%)",
    //       textAlign: "center",
    //     }}>
    //     {/* <img src={emotionCheckersLogo} className="logo" alt="Game logo" /> */}
    //     <h3>😁😨😢 Emotion checkers 🤢😡😌</h3>
    //     <p>Chinese checkers with a twist using Inside out emotions </p>
    //     <details>
    //       <summary>Possible future variations:</summary>
    //       <ul>
    //         <li>
    //           Character Powers: Each character has a special ability that can
    //           change the rules. For example, one character can "jump" two spaces
    //           at once, while another can block moves for a turn.
    //         </li>
    //         <li>
    //           Reverse Objective: Instead of trying to get all your pieces across
    //           the board to the opposite corner, you need to keep your pieces in
    //           your starting area while forcing others to move theirs out.
    //         </li>
    //         <li>
    //           Warp Zones: Add areas on the board that act as portals, allowing
    //           players to teleport their pieces to random parts of the board.
    //           This could be a feature tied to a specific character's power.
    //         </li>
    //         <li>
    //           Timed Moves: Players must complete their moves within a short time
    //           limit, adding an element of pressure.
    //         </li>
    //         <li>
    //           Dynamic Obstacles: Have barriers or obstacles that can be placed
    //           or moved around the board by certain characters, making it harder
    //           for others to move.
    //         </li>
    //         <li>
    //           Inner Power-ups: Introduce inner power-ups (representing emotions)
    //           scattered around the board that give temporary boosts, like moving
    //           extra spaces or jumping multiple times.
    //         </li>
    //       </ul>
    //     </details>
    //   </div>
    // <Canvas className="h-screen" camera={{ position: [0, 5, 10], fov: 50 }}>
    //   <ambientLight intensity={0.5} />
    //   <pointLight position={[10, 10, 10]} />
    //   <OrbitControls />
    //   <Suspense fallback={null}>
    //     <Game />
    //   </Suspense>
    // </Canvas>
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Chinese Checkers</h1>
      <Game />
    </div>
    // </>
  );
}

export default App;
