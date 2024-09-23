import emotionCheckersLogo from "./assets/logo.png";
import "./index.css";
import Game from "./components/Board";
import backgroundImage from "./assets/bg-7.png";

function App() {
  return (
    <div >
      <div className="flex flex-col container mx-auto p-6 items-center" >
        <div className="w-100 h-100">
          <img src={emotionCheckersLogo} width="100px" alt="Game logo" />
        </div>
        <div className="text-6xl font-bold mb-6 text-center">
          😁😨😢{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-blue-500 via-red-500 to-green-500">
            Emotion checkers
          </span>
          🤢😡😌
        </div>
        <p>Chinese checkers with a twist using Inside out emotions </p>
        <details>
          <summary>Possible future variations:</summary>
          <ul>
            <li>
              Character Powers: Each character has a special ability that can
              change the rules. For example, one character can "jump" two spaces
              at once, while another can block moves for a turn.
            </li>
            <li>
              Reverse Objective: Instead of trying to get all your pieces across
              the board to the opposite corner, you need to keep your pieces in
              your starting area while forcing others to move theirs out.
            </li>
            <li>
              Warp Zones: Add areas on the board that act as portals, allowing
              players to teleport their pieces to random parts of the board.
              This could be a feature tied to a specific character's power.
            </li>
            <li>
              Timed Moves: Players must complete their moves within a short time
              limit, adding an element of pressure.
            </li>
            <li>
              Dynamic Obstacles: Have barriers or obstacles that can be placed
              or moved around the board by certain characters, making it harder
              for others to move.
            </li>
            <li>
              Inner Power-ups: Introduce inner power-ups (representing emotions)
              scattered around the board that give temporary boosts, like moving
              extra spaces or jumping multiple times.
            </li>
          </ul>
        </details>
      </div>
      <div className="flex flex-col items-center p-6 mt-10 background-image">
        <Game />
      </div>
    </div>
  );
}

export default App;
