import React, { useState, useEffect, useCallback } from 'react';
import Board from './Board';
import ModelSelector from './ModelSelector';
import { initialBoard, calculateWinner, boardToQTableKey, getAvailableMoves } from './gameLogic';

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


    // Dynamic mapping of player and AI marks
    const getMarkMapping = useCallback(() => {
        // Since Player1 is always 1('O'), Player2 is always -1('X') in Q-table,
        // we need to map them to the actual marks used in the game
        if (aiMark === 'O') { // AI is 'O' (player 1 in Q-table)
            return {
                player1Mark: 'O', player1Value: 1,
                player2Mark: 'X', player2Value: -1
            };
        } else { // AI is 'X' (player 2 in Q-table)
                 // need to swap the marks since Q-table values are always viewed by player 1
            return {
                player1Mark: 'X', player1Value: 1,
                player2Mark: 'O', player2Value: -1
                // depending on the definition of Q-table
            };
        }  
    }, [aiMark]);

    
    // AI logic
    const getAIMove = useCallback((currentBoard) => {
        if (!qTable || qTable.size === 0) { // No Q-table loaded or empty Q-table
            console.log('No Q-table loaded or empty Q-table. AI move is random.');
            const available = getAvailableMoves(currentBoard);
            return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : null;    
        }

        const qTableConsistentMapping = {
            player1Mark: 'O', player1Value: 1,
            player2Mark: 'X', player2Value: -1
        };

        const stateKey = boardToQTableKey(currentBoard, qTableConsistentMapping);
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
    }, [qTable, getQValues]);


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

    if (!gameStarted) {
        return (
            <div className="game-setup">
                <h1> Tic Tac Toe (vs AI) </h1>
                <ModelSelector
                    currentModelFile={currentQTableFile}
                    onChangeModel={handleModelChange}
                    disabled={isLoading || (!isPlayerNext && !winner)}
                />
                <h2> First or Second?</h2>
                <button onClick={() => startGame(true)} disabled={isLoading}> First Player (X)</button>
                <button onClick={() => startGame(false)} disabled={isLoading}> Second Player (O)</button>
                {isLoading && <p>Loading Q-table...</p>}
            </div>
        );
    }

    return (
        <div className="game">
            <h1> Tic Tac Toe (vs AI) </h1>
            <Board squares={board} onClick={handleClick} />
            <div className="game-info">
                <div>{status}</div>
                <button onClick={resetGameToSetup}>Restart Game</button>
            </div>
            {/* TODO: Add model selection UI */}
        </div>
    );
}

export default Game;