import React from 'react';
import Game from './Game';
import SpaceBackground from './SpaceBackground';
import './SpaceTheme.css';

function App() {
  return (
    <>
      <SpaceBackground />
      <div className="App">
        <Game />
      </div>
    </>
  );
}

export default App;
