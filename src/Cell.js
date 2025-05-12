import React from 'react';

function Cell({ value, onClick, isWinningCell }) {
    
    let cellClass = "cell";
    if (value === 'X') {
        cellClass += " player-x";
    } else if (value === 'O') {
        cellClass += " player-o";
    }
    if (value) {
        cellClass += " occupied";
    }

    if (isWinningCell) {
        cellClass += " winning-cell";
    }

    return (
        <button 
            className={cellClass}
            onClick={onClick}
            disabled={!!value} // Disable the button if it's already occupied
        >
            {value && <span className="mark-symbol">{value}</span>}
        </button>
    );
}

export default Cell;