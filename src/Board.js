import React from 'react';
import Cell from './Cell';

function Board({ squares, onClick }) {

    return (
        <div className="board">
            {squares.map((squares, i) => (
                <Cell
                    key={i}
                    value={squares}
                    onClick={() => onClick(i)}
                />
            ))}
        </div>
    );
}

export default Board;