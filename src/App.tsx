// import { useState } from "react";

import emotionCheckersLogo from "./assets/logo.png";
import "./App.css";

function App() {
  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={emotionCheckersLogo} className="logo" alt="Game logo" />
        </a>
      </div>
      <h1>Emotion checkers</h1>
      <h2>😁😨😢🤢😡😌</h2>
    </>
  );
}

export default App;
