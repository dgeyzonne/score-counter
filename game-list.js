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

        const dateTd = document.createElement('td');
        dateTd.textContent = game.date;
        tr.appendChild(dateTd);

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
            <button onclick="loadGame(${game.id})" class="load-btn">Charger</button>
            <button onclick="deleteGame(${game.id})" class="delete-btn">
                <i class="fas fa-times"></i>
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
    const updatedGames = games.filter(game => game.id != gameId);

    localStorage.setItem('games', JSON.stringify(updatedGames));
    loadGamesList(); // Recharger la liste des parties
}