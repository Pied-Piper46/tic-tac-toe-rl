import React, { useState, useEffect, useCallback, useRef } from 'react';
import Board from './Board';
import { initialBoard, calculateWinner, boardToQTableKey, getAvailableMoves } from './gameLogic';
import { CSSTransition, SwitchTransition } from 'react-transition-group';
import { motion } from 'framer-motion';
import './SpaceTheme.css';


const models = [
    { file: 'q_table_easy.json', name: 'Easy Model', description: '★☆☆' },
    { file: 'q_table_normal.json', name: 'Normal Model', description: '★★☆' },
    { file: 'q_table_advanced.json', name: 'Advanced Model', description: '★★★' },
];

function Game() {
    const [board, setBoard] = useState(initialBoard());
    const [isPlayerNext, setIsPlayerNext] = useState(true); // true if it's player's turn
    const [gameResult, setGameResult] = useState({ winner: null, line: null, lineIndex: null }); // Changed from winner
    const [qTable, setQTable] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentQTableFile, setCurrentQTableFile] = useState(models[0].file);
    const [playerMark, setPlayerMark] = useState('X'); // human player
    const [aiMark, setAiMark] = useState('O'); // AI player
    const [gameStarted, setGameStarted] = useState(false); // true if game has started
    const [isPageLoaded, setIsPageLoaded] = useState(false);
    const statusRef = useRef(null);
    const [playerChoice, setPlayerChoice] = useState(null);


    useEffect(() => {
        const timer = setTimeout(() => setIsPageLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);


    const resetGameToSetup = () => {
        setGameStarted(false);
        setPlayerChoice(null);
        setBoard(initialBoard());
        setGameResult({ winner: null, line: null, lineIndex: null }); // Reset gameResult
    };

    const handleModelSelect = (modelFile) => {
        setCurrentQTableFile(modelFile);
    };

    const handlePlayerChoiceSelect = (choice) => {
        setPlayerChoice(choice);
    };

    const handleStartGame = () => {
        if (!currentQTableFile || !playerChoice) return;

        setBoard(initialBoard());
        setGameResult({ winner: null, line: null, lineIndex: null });

        if (playerChoice === 'first') {
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


    // Load Q-table from a file
    useEffect(() => {
        const loadQTable = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/${currentQTableFile}`);
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
        // Use gameResult.winner to check if game is over
        if (isLoading || gameResult.winner || board[i] || !isPlayerNext || !gameStarted) {
            return;
        }

        const newBoard = board.slice();
        newBoard[i] = playerMark;
        setBoard(newBoard);

        const result = calculateWinner(newBoard); // calculateWinner now returns an object
        if (result.winner) { // Check if there is a winner or a draw
            setGameResult(result); // Set the entire result object
        } else {
            setIsPlayerNext(false); // Switch to AI's turn
        }
    };

    // AI turn
    useEffect(() => {
        // Use gameResult.winner to check if game is over
        if (!isPlayerNext && !gameResult.winner && !isLoading && gameStarted) {
            const aiMove = getAIMove(board);

            // Pretend AI thinks for a moment
            setTimeout(() => {
                if (aiMove !== null && board[aiMove] === null) {
                    const newBoard = board.slice();
                    newBoard[aiMove] = aiMark;
                    setBoard(newBoard);

                    const result = calculateWinner(newBoard); // calculateWinner returns an object
                    if (result.winner) { // Check if there is a winner or a draw
                        setGameResult(result); // Set the entire result object
                    } else {
                        setIsPlayerNext(true); // No winner/draw, switch turn
                    }
                // Removed redundant draw check here, as calculateWinner handles it.
                } else if (aiMove === null && getAvailableMoves(board).length > 0) {
                    console.error('AI move is null, but there are still available moves. This should not happen.');
                    setIsPlayerNext(true);
                } else if (aiMove === null && getAvailableMoves(board).length === 0 && !gameResult.winner) {
                    // Safeguard: If AI has no move and board is full, explicitly set draw
                    setGameResult(calculateWinner(board));
                }
            }, 800);
        }
        // Add gameResult.winner to dependency array
    }, [isPlayerNext, board, gameResult.winner, aiMark, getAIMove, isLoading, gameStarted]);

    let status;
    if (isLoading && !gameStarted) {
        status = 'Select a model and First/Second to start the game';
    } else if (isLoading) {
        status = 'Loading Q-table...';
    } else if (gameResult.winner) { // Check gameResult.winner
        if (gameResult.winner === 'draw') {
            status = 'Draw!';
        } else {
            // Use gameResult.winner for status message
            status = `Winner: ${gameResult.winner === playerMark ? 'You' : 'AI'} (${gameResult.winner})`;
        }
    } else if (gameStarted) {
        status = `Next player: ${isPlayerNext ? `You (${playerMark})` : `AI (${aiMark})`}`;
    }

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        visible: { 
            opacity: 1, 
            scale: 1,
            transition: { 
                duration: 0.8,
                ease: "easeOut",
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    return (
        <motion.div 
            className={`game-container ${isPageLoaded ? 'loaded' : ''}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.header className="game-header" variants={itemVariants}>
                <motion.h1
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.3
                    }}
                >
                    TIC TAC TOE
                </motion.h1>
                <motion.p 
                    className="game-subtitle"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    vs AI
                </motion.p>
            </motion.header>

            {/* Set up display */}
            {!gameStarted && (
                <div className="game-setup">
                    {/* model select section*/}
                    <div className="setup-selection model-selection">
                        <h2>1. Select a Model</h2>
                        <div className="options-grid model-options">
                            {models.map(model => (
                                <button
                                    key={model.file}
                                    className={`option-card model-option-card ${currentQTableFile === model.file ? 'selected' : ''}`}
                                    onClick={() => handleModelSelect(model.file)}
                                    disabled={isLoading}
                                >
                                    <span className="card-title">{model.name}</span>
                                    {model.description && <span className="card-description">{model.description}</span>}
                                    {currentQTableFile === model.file && <span className="checkmark">✔︎</span>}
                                </button>
                            ))}
                        </div>
                        {isLoading && <p className="loading-text subtle">Loading...</p>}
                    </div>
                    {/* player select section*/}
                    <div className="setup-selection player-selection">
                        <h2>2. Select First or Second</h2>
                        <div className="options-grid player-options">
                            <button
                                className={`option-card player-option-card ${playerChoice === 'first' ? 'selected' : ''}`}
                                onClick={() => handlePlayerChoiceSelect('first')}
                                disabled={isLoading}
                            >
                                <span className="mark-icon player-x">X</span>
                                <span className="card-title">First Player</span>
                                {playerChoice === 'first' && <span className="checkmark">✔︎</span>}
                            </button>
                            <button
                                className={`option-card player-option-card ${playerChoice === 'second' ? 'selected' : ''}`}
                                onClick={() => handlePlayerChoiceSelect('second')}
                                disabled={isLoading}
                            >
                                <span className="mark-icon player-o">O</span>
                                <span className="card-title">Second Player</span>
                                {playerChoice === 'second' && <span className="checkmark">✔︎</span>}
                            </button>
                        </div>
                    </div>

                    {/* Start game button */}
                    <div className="setup-section start-game">
                        <button
                            className="start-button"
                            onClick={handleStartGame}
                            disabled={isLoading || !currentQTableFile || !playerChoice}
                        >
                            Start Game
                        </button>
                    </div>
                </div>
            )}

            {/* Game display */}
            {gameStarted && (
                <main className={`game-main ${gameResult.winner && gameResult.winner !== 'draw' ? 'game-over' : ''}`}>
                {/* Pass winningLine to Board */}
                <Board
                    squares={board}
                    onClick={handleClick}
                    playerMark={playerMark}
                    aiMark={aiMark}
                    winningLine={gameResult.line}
                />
                <div className="status-message-wrapper">
                    <SwitchTransition mode="out-in">
                        <CSSTransition
                        key={status}
                        nodeRef={statusRef}
                        timeout={300} // アニメーション時間をミリ秒で指定
                        classNames="fade"
                        >
                            <p 
                                className={`status-message ${gameResult.winner && gameResult.winner !== 'draw' ? 'victory' : ''}`} 
                                ref={statusRef}
                            >
                                {status}
                            </p>
                        </CSSTransition>
                    </SwitchTransition>
                </div>
                <button className="reset-button" onClick={resetGameToSetup} disabled={isLoading}>
                    Back to Setup
                </button>
                </main>
            )}


            {/* Victory Effects */}
            {gameResult.winner && gameResult.winner !== 'draw' && (
                <>
                    {/* Victory Overlay */}
                    <motion.div 
                        className="victory-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    />
                    
                    {/* Victory Particles */}
                    <motion.div 
                        className="victory-particles"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.7 }}
                    >
                        {[...Array(20)].map((_, i) => (
                            <div 
                                key={i} 
                                className="particle"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}
                            />
                        ))}
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}

export default Game;
