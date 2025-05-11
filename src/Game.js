import React, { useState, useEffect, useCallback } from 'react';
import Board from './Board';
import ModelSelector from './ModelSelector';
import { initialBoard, calculateWinner, boardToQTableKey, getAvailableMoves } from './gameLogic';
import './Game.css'; // Game.css をインポート

// The first model which is defined in ModelSelector.js will be a default model
// Ajust the model name if you change the order of models in ModelSelector.js
const initialModelFile = 'q_table_easy.json';

function Game() {
    const [board, setBoard] = useState(initialBoard());
    const [isPlayerNext, setIsPlayerNext] = useState(true); // true if it's player's turn
    const [winner, setWinner] = useState(null);
    const [qTable, setQTable] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQTableFile, setCurrentQTableFile] = useState(initialModelFile);
    const [playerMark, setPlayerMark] = useState('X'); // human player
    const [aiMark, setAiMark] = useState('O'); // AI player
    const [gameStarted, setGameStarted] = useState(false); // true if game has started


    const startGame = (playerIsFirst) => {
        setBoard(initialBoard());
        setWinner(null);
        if (playerIsFirst) {
            setPlayerMark('X');
            setAiMark('O');
            setIsPlayerNext(true);
        } else {
            setPlayerMark('O');
            setAiMark('X');
            setIsPlayerNext(false);
        }
        setGameStarted(true);
    };

    const resetGameToSetup = () => {
        setGameStarted(false);
        setBoard(initialBoard());
        setWinner(null);
    };

    const handleModelChange = (newModelFile) => {
        setCurrentQTableFile(newModelFile);
        resetGameToSetup();
    };


    // Load Q-table from a file
    useEffect(() => {
        const loadQTable = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/${currentQTableFile}`);
                if (!response.ok) {
                    throw new Error(`Failed to lead Q-table (${currentQTableFile}): ${response.statusText}`);
                }
                const data = await response.json();
                // Convert the Q-table to a Map for easier access
                const qMap = new Map(Object.entries(data));
                setQTable(qMap);
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
        if (qTable) {
            if (qTable.has(stateKey)) {
                return qTable.get(stateKey);
            } else {
                console.warn(`[getQValues] Key NOT FOUND in qTable: "${stateKey}"`);
                if (qTable.size > 0) {
                    console.log("[getQValues] Sample of actual keys in qTable:");
                    let count = 0;
                    for (const key of qTable.keys()) {
                        console.log(`  - Actual key: "${key}" (type: ${typeof key}, length: ${key.length})`);
                        count++;
                        if (count >= 5) break;
                    }
                } else {
                    console.log("[getQValues] qTable is empty.");
                }
            }
        }
        return Array(9).fill(0); // Default Q values if stateKey not found
    }, [qTable]);


    // Dynamic mapping of player and AI marks
    const getMarkMapping = useCallback(() => {
        // Q-table is trained exclusively with 'X' as player 1 (value 1) and 'O' as player 2 (value -1).
        // Therefore, for q-table lookup, always map the board's 'X' to 1 and 'O' to -1,
        // regardless of which mark the AI is currently playing.
        return {
            player1Mark: 'X', // The mark on the board that corresponds to '1' in Q-table keys
            player1Value: 1,
            player2Mark: 'O', // The mark on the board that corresponds to '-1' in Q-table keys
            player2Value: -1
        };
    }, []);

    
    // AI logic
    const getAIMove = useCallback((currentBoard) => {
        if (!qTable || qTable.size === 0) { // No Q-table loaded or empty Q-table
            console.log('No Q-table loaded or empty Q-table. AI move is random.');
            const available = getAvailableMoves(currentBoard);
            return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;    
        }

        // use dynamic mapping
        const markMapping = getMarkMapping();
        const stateKey = boardToQTableKey(currentBoard, markMapping);
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
    }, [qTable, getQValues, getMarkMapping]);


    const handleClick = (i) => {
        if (isLoading || winner || board[i] || !isPlayerNext || !gameStarted) { // Ignore click if game is over or cell is already filled
            return;
        }

        const newBoard = board.slice();
        newBoard[i] = playerMark;
        setBoard(newBoard);

        const gameWinner = calculateWinner(newBoard);
        if (gameWinner) {
            setWinner(gameWinner);
        } else {
            setIsPlayerNext(false); // Switch to AI's turn
        }
    };

    // AI turn (implement details later)
    useEffect(() => {
        if (!isPlayerNext && !winner && !isLoading && gameStarted) {
            // Call AI logic
            const aiMove = getAIMove(board);

            // Pretend AI thinks for a moment
            setTimeout(() => {
                if (aiMove !== null && board[aiMove] === null) {
                    const newBoard = board.slice();
                    newBoard[aiMove] = aiMark;
                    setBoard(newBoard);

                    const gameWinner = calculateWinner(newBoard);
                    if (gameWinner) {
                        setWinner(gameWinner);
                    } else {
                        setIsPlayerNext(true);
                    }
                } else if (calculateWinner(board) === 'draw' && !winner) {
                    setWinner('draw');
                } else if (aiMove === null && getAvailableMoves(board).length > 0) {
                    console.error('AI move is null, but there are still available moves. This should not happen.');
                    setIsPlayerNext(true);
                }
            }, 500);
        }
    }, [isPlayerNext, board, winner, aiMark, getAIMove, isLoading, gameStarted]);


    let status;
    if (isLoading && !gameStarted) {
        status = 'Select a model and First/Second to start the game';
    } else if (isLoading) {
        status = 'Loading Q-table...';
    } else if (winner) {
        if (winner === 'draw') {
            status = 'Draw!';
        } else {
            status = `Winner: ${winner === playerMark ? 'You' : 'AI'} (${winner})`;
        }
    } else if (gameStarted) {
        status = `Next player: ${isPlayerNext ? `You (${playerMark})` : `AI (${aiMark})`}`;
    }

    return (
        <div className="game-container">
        <header className="game-header">
            <h1>TIC TAC TOE (vs AI)</h1>
        </header>

        {/* Set up display */}
        {!gameStarted && (
            <div className="game-setup">
            <div className="model-selector-container">
                <ModelSelector
                currentModelFile={currentQTableFile}
                onChangeModel={handleModelChange}
                disabled={isLoading}
                />
            </div>
            <h2>First or Second？</h2>
            <div className="start-options">
                <button onClick={() => startGame(true)} disabled={isLoading}>First (X)</button>
                <button onClick={() => startGame(false)} disabled={isLoading}>Second (O)</button>
            </div>
            {isLoading && <p className="loading-text">Loading...</p>}
            </div>
        )}

        {/* Game display */}
        {gameStarted && (
            <main className="game-main">
            <Board squares={board} onClick={handleClick} playerMark={playerMark} aiMark={aiMark} />
            <div className="game-status-panel">
                <p className="status-message">{status}</p>
                <button className="reset-button" onClick={resetGameToSetup} disabled={isLoading}>
                Back to Setup
                </button>
            </div>
            </main>
        )}
        </div>
    );
}

export default Game;
