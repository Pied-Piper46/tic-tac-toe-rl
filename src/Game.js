import React, { useState, useEffect } from 'react';
import Board from './Board';
import { initialBoard, calculateWinner } from './gameLogic';

function Game() {
    const [board, setBoard] = useState(initialBoard());
    const [isPlayerNext, setIsPlayerNext] = useState(true);
    const [winner, setWinner] = useState(null);
    // TODO: read q table, ai logic, model selection

    const playerMark = 'X';
    const aiMark = '0';

    const handleClick = (i) => {
        if (winner || board[i]) { // Ignore click if game is over or cell is already filled
            return;
        }

        if (!isPlayerNext) {
            return; // Ignore click if it's not the player's turn
        }

        const newBoard = board.slice();
        newBoard[i] = playerMark;
        setBoard(newBoard);

        const currentWinner = calculateWinner(newBoard);
        if (currentWinner) {
            setWinner(currentWinner);
        } else {
            setIsPlayerNext(false); // Switch to AI's turn
            // TODO: AI logic to make a move
        }
    };

    // AI turn (implement details later)
    useEffect(() => {
        if (!isPlayerNext && !winner) {
            // Call AI logic
            // const aiMove = getAIMove(board, qTable);
            // if (aiMove !== null) {
            //     const newBoard = board.slice();
            //     newBoard[aiMove] = aiMark;
            //     setBoard(newBoard);
            //     const currentWinner = calculateWinner(newBoard);
            //     if (currentWinner) {
            //         setWinner(currentWinner);
            //     } else {
            //         setIsPlayerNext(true); // Switch back to player's turn
            //     }
            // }
            // For now
            console.log("AI's turn"); // Temporary placeholder
            setTimeout(() => {
                if (!calculateWinner(board)) setIsPlayerNext(true);
            }, 500);
        }
    }, [isPlayerNext, board, winner, aiMark]);

    const restartGame = () => {
        setBoard(initialBoard());
        setIsPlayerNext(true);
        setWinner(null);
        // TODO: Keep the state of model selection
    };

    let status;
    if (winner) {
        if (winner === 'draw') {
            status = 'Draw!';
        } else {
            status = 'Winner: ' + winner;
        }
    } else {
        status = 'Next player: ' + (isPlayerNext ? playerMark : aiMark);
    }

    return (
        <div className="game">
            <h1> Tic Tac Toe (vs AI) </h1>
            <Board squares={board} onClick={handleClick} />
            <div className="game-info">
                <div>{status}</div>
                <button onClick={restartGame}>Restart Game</button>
            </div>
            {/* TODO: Add model selection UI */}
        </div>
    );
}

export default Game;