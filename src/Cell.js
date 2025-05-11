import React from 'react';

function Cell({ value, onClick }) {
    
    let cellClass = "cell";
    if (value === 'X') {
        cellClass += " player-x";
    } else if (value === 'O') {
        cellClass += " player-o";
    }
    if (value) {
        cellClass += " occupied";
    }

    return (
        <button 
            className={cellClass}
            onClick={onClick}
            disabled={!!value} // Disable the button if it's already occupied
        >
            {value}
        </button>
    );
}

export default Cell;