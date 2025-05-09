import React from 'react';

function Cell({ value, onClick }) {
    return (
        <button className="cell" onClick={onClick}>
            {value}
        </button>
    );
}

export default Cell;