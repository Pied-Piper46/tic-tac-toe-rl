import React, { useState, useEffect, useCallback } from 'react';
import Board from './Board';
import { initialBoard, calculateWinner, boardToQTableKey, getAvailableMoves } from './gameLogic';

// default Q-table file path
const DEFAULT_Q_TABLE_FILE = 'q_table_normal.json';

function Game() {
    const [board, setBoard] = useState(initialBoard());
    const [isPlayerNext, setIsPlayerNext] = useState(true);
    const [winner, setWinner] = useState(null);
    // TODO: read q table, ai logic, model selection
    const [qTable, setQTable] = useState(null);
    const [isLoading, setLoading] = useState(true);
    const [currentQTableFile, setCurrentQTableFile] = useState(DEFAULT_Q_TABLE_FILE);

    const playerMark = 'X'; // human player
    const aiMark = '0'; // AI player

    // Load Q-table from a file
    useEffect(() => {
        const loadQTable = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/${currentQTableFile}`);
                if (!response.ok) {
                    throw new Error('Failed to lead Q-table(${currentQTableFile}): ${response.statusText}');
                }
                const data = await response.json();
                // Convert the Q-table to a Map for easier access
                // if unexisted key is accessed, return default value (list of 0)
                const qMap = new Map(Object.entries(data));
                setQTable(qMap);
                console.log('Q-table loaded: ${currentQTableFile}');
            } catch (error) {
                console.error(error);
                setQTable(new Map());
                alert(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadQTable();
    }, [currentQTableFile]);

    // Helper function to get Q values
    const getQValues = useCallback((stateKey) => {
        if (qTable && qTable.has(stateKey)) {
            return qTable.get(stateKey);
        }
        return Array(9).fill(0); // Default Q values if stateKey not found
    }, [qTable]);

    
    // AI logic
    const getAIMove = useCallback((currentBoard) => {
        if (!qTable || qTable.size === 0) { // No Q-table loaded or empty Q-table
            console.log('No Q-table loaded or empty Q-table. AI move is random.');
            const available = getAvailableMoves(currentBoard);
            return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;    
        }

        const stateKey = boardToQTableKey(currentBoard, aiMark, playerMark);
        const qValues = getQValues(stateKey);
        const availableMoves = getAvailableMoves(currentBoard);

        if (availableMoves.length === 0) {
            return null; // No available moves
        }

        let bestMove = -1;
        let maxQValue = -Infinity;

        // Find the move with the highest Q-value in the available moves
        availableMoves.forEach(move => {
            if (qValues[move] > maxQValue) {
                maxQValue = qValues[move];
                bestMove = move;
            }
        });

        // If all moves have the same Q-value, pick a random available move
        if (availableMoves.every(move => qValues[move] === maxQValue)) {
            const randomIndex = Math.floor(Math.random() * availableMoves.length);
            bestMove = availableMoves[randomIndex];
        }

        // for debugging
        console.log(`State: ${stateKey}, Q-values: [${qValues.map(v => v.toFixed(2)).join(', ')}], Available: [${availableMoves.join(', ')}], Chosen move: ${bestMove} (Q: ${maxQValue.toFixed(2)})`);

        return bestMove;
    }, [qTable, getQValues, aiMark, playerMark]);


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