// initial board state (all squares empty))
export const initialBoard = () => Array(9).fill(null);

// calculate the winner
export const calculateWinner = (squares) => {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // vertical
        [0, 4, 8], [2, 4, 6] // diagonal
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    // draw
    if (squares.every(square => square !== null)) {
        return 'draw';
    }
    // game is still ongoing
    return null;
};

// helper function to convert board state to key string for q table
export const boardToQTableKey = (squares, mapping) => {

    const { player1Mark, player1Value, player2Mark, player2Value } = mapping;

    const qState = squares.map(s => {
        if (s === player1Mark)
            return player1Value;
        if (s === player2Mark)
            return player2Value;
        return 0;
    });
    // expected python output of str(tuple): '(0, 1, -1)'
    return `(${qState.join(', ')})`;
};

export const getAvailableMoves = (squares) => {
    const moves = [];
    squares.forEach((square, index) => {
        if (square === null) {
            moves.push(index);
        }
    });
    return moves;
}
