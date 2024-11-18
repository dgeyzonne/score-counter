document.addEventListener("DOMContentLoaded", function() {
    loadGamesList();
});

function loadGamesList() {
    const games = JSON.parse(localStorage.getItem('games')) || [];
    const tbody = document.getElementById('gamesTable').querySelector('tbody');

    tbody.innerHTML = ''; // Vider le contenu existant

    // Trier les parties par date (plus récentes en premier)
    games.sort((a, b) => b.id - a.id);

    games.forEach(game => {
        const tr = document.createElement('tr');

        const gameNameTd = document.createElement('td');
        gameNameTd.innerHTML = `${game.name}<span class="game-date">${new Date(Number.parseInt(game.id)).toLocaleString()}<span>`;
        tr.appendChild(gameNameTd);

        // Calculer le meilleur joueur en fonction du mode
        const bestPlayer = game.players.reduce((best, player) => {
            const totalPlayerScore = player.scores.reduce((sum, score) => sum + score, 0);

            if (game.isInverseMode) {
                // Mode Inversé : Le joueur avec le score le plus bas est le meilleur
                return totalPlayerScore < best.score ? { name: player.name, score: totalPlayerScore } : best;
            } else {
                // Mode Classique : Le joueur avec le score le plus élevé est le meilleur
                return totalPlayerScore > best.score ? { name: player.name, score: totalPlayerScore } : best;
            }
        }, { name: '', score: game.isInverseMode ? Infinity : 0 });

        const playersTd = document.createElement('td');
        playersTd.textContent = bestPlayer.name;
        tr.appendChild(playersTd);

        const actionsTd = document.createElement('td');
        actionsTd.className = 'actions-td';
        actionsTd.innerHTML = `
            <button onclick="loadGame(${game.id})" class="load-btn">
                <i class="fas fa-play"></i>
            </button>
            <button onclick="deleteGame(${game.id})" class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;
    
        tr.appendChild(actionsTd);

        tbody.appendChild(tr);
    });
}

function loadGame(gameId) {
    localStorage.setItem('currentGameId', gameId);
    location.href = 'score.html';
}

function deleteGame(gameId) {
    const games = JSON.parse(localStorage.getItem('games')) || [];
    const updatedGames = games.filter(game => game.id != gameId && isNumeric(game.id));

    localStorage.setItem('games', JSON.stringify(updatedGames));
    loadGamesList(); // Recharger la liste des parties
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}