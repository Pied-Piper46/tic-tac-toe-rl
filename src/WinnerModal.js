import React from 'react';

function WinnerModal({ winner, playerMark, onRestart }) {
    if (!winner || winner === 'draw') return null;

    let message;
    if (winner === playerMark) {
        message = "YOU WIN!";
    } else {
        message = "AI WINS!";
    }

    return (
        <div className="winner-modal-overlay">
            <div className="winner-modal-content">
                <h2>{message}</h2>
                <button className="restart-button" onClick={onRestart}>
                    Restart Game
                </button>
            </div>
        </div>
    );
}

export default WinnerModal;