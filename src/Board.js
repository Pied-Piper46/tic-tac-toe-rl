import React from 'react';
import Cell from './Cell';

function Board({ squares, onClick, winningLine }) {

    return (
        <div className="board">
            {squares.map((squares, i) => (
                <Cell
                    key={i}
                    value={squares}
                    onClick={() => onClick(i)}
                    isWinningCell={winningLine && winningLine.includes(i)}
                />
            ))}
        </div>
    );
}

export default Board;
