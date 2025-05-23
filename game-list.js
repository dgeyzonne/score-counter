let gameToDelete = null;
let asc = false;
let sortColumn = 0;
let sortState = {};

document.addEventListener("DOMContentLoaded", function () {
    loadGamesList();
});

function loadGamesList() {
    let games = JSON.parse(localStorage.getItem('games')) || [];
    const tbody = document.getElementById('gamesTable').querySelector('tbody');

    tbody.innerHTML = ''; // Vider le contenu existant

    addBestAndWorstPlayerByGame(games);

    // Tri des parties
    sortGames(games);

    games.forEach(game => {
        const tr = document.createElement('tr');

        const gameNameTd = document.createElement('td');
        gameNameTd.innerHTML = `${game.name}<span class="small-text">${new Date(Number.parseInt(game.id)).toLocaleString()}<span>`;
        tr.appendChild(gameNameTd);

        const bestPlayerTd = document.createElement('td');
        bestPlayerTd.innerHTML = `${game.bestPlayer.name}<span class="small-text">${game.bestPlayer.totalScore}<span>`;
        tr.appendChild(bestPlayerTd);

        const worstPlayerTd = document.createElement('td');
        worstPlayerTd.innerHTML = `${game.worstPlayer.name}<span class="small-text">${game.worstPlayer.totalScore}<span>`;
        tr.appendChild(worstPlayerTd);

        const actionsTd = document.createElement('td');
        actionsTd.className = 'actions-td';
        actionsTd.innerHTML = `
            <button onclick="loadGame(${game.id})" class="load-btn">
                <i class="fas fa-play"></i>
            </button>
            <button onclick="openDeleteGameModal(event, ${game.id})" class="delete-btn">
                <i class="fas fa-trash"></i>
            </button>
        `;

        tr.appendChild(actionsTd);

        tbody.appendChild(tr);
    });
}

function addBestAndWorstPlayerByGame(games) {
    games.forEach(game => {
        // Calculer le meilleur joueur
        const bestPlayer = game.players.reduce((best, player) => {
            const totalPlayerScore = player.scores.reduce((sum, score) => sum + score, 0);

            if (game.isInverseMode) {
                // Mode Inversé : Le joueur avec le score le plus bas est le meilleur
                return totalPlayerScore < best.totalScore ? {name: player.name, totalScore: totalPlayerScore} : best;
            } else {
                // Mode Classique : Le joueur avec le score le plus élevé est le meilleur
                return totalPlayerScore > best.totalScore ? {name: player.name, totalScore: totalPlayerScore} : best;
            }
        }, {name: '', totalScore: game.isInverseMode ? Infinity : 0});

        // Calculer le plus mauvais joueur
        const worstPlayer = game.players.reduce((worst, player) => {
            const totalPlayerScore = player.scores.reduce((sum, score) => sum + score, 0);

            if (game.isInverseMode) {
                // Mode Inversé : Le joueur avec le score le plus bas est le plus mauvais
                return totalPlayerScore > worst.totalScore ? {name: player.name, totalScore: totalPlayerScore} : worst;
            } else {
                // Mode Classique : Le joueur avec le score le plus élevé est le plus mauvais
                return totalPlayerScore < worst.totalScore ? {name: player.name, totalScore: totalPlayerScore} : worst;
            }
        }, {name: '', totalScore: game.isInverseMode ? 0 : Infinity});

        game.bestPlayer = bestPlayer;
        game.worstPlayer = worstPlayer;
    });
}

function sortGames(games) {
    if (sortColumn === 0) {
        if (asc) {
            // Trie les parties par date croissante
            games.sort((a, b) => a.id - b.id);
        } else {
            // Trie les parties par date décroissante
            games.sort((a, b) => b.id - a.id);
        }
    } else if (sortColumn === 1) {
        if (asc) {
            // Trie les parties par meilleur score (plus petits scores en premier)
            games.sort((a, b) => a.bestPlayer.totalScore - b.bestPlayer.totalScore);
        } else {
            // Trie les parties par meilleur score (plus gros scores en premier)
            games.sort((a, b) => b.bestPlayer.totalScore - a.bestPlayer.totalScore);
        }
    } else if (sortColumn === 2) {
        if (asc) {
            // Trie les parties par plus mauvais score (plus petits scores en premier)
            games.sort((a, b) => a.worstPlayer.totalScore - b.worstPlayer.totalScore);
        } else {
            // Trie les parties par plus mauvais score (plus gros scores en premier)
            games.sort((a, b) => b.worstPlayer.totalScore - a.worstPlayer.totalScore);
        }
    }
}

function sortTable(columnIndex, headerCell) {
    sortColumn = columnIndex;

    // Inverser ou initialiser la direction
    sortState[sortColumn] = !sortState[sortColumn];

    asc = sortState[sortColumn];

    // Réinitialise les flèches
    document.querySelectorAll("th .arrow").forEach(span => span.innerHTML = "&#9662;");

    // Met à jour la flèche de la colonne cliquée
    const arrow = headerCell.querySelector(".arrow");
    arrow.innerHTML = asc ? "&#9652;" : "&#9662;";

    loadGamesList();
}

function loadGame(gameId) {
    localStorage.setItem('currentGameId', gameId);
    location.href = 'score.html';
}

function deleteGame() {
    const games = JSON.parse(localStorage.getItem('games')) || [];
    const updatedGames = games.filter(game => game.id != gameToDelete && isNumeric(game.id));

    localStorage.setItem('games', JSON.stringify(updatedGames));

    gameToDelete = null;
    closeDeleteGameModal();

    loadGamesList(); // Recharger la liste des parties
}

function openDeleteGameModal(event, gameId) {
    event.stopPropagation();
    gameToDelete = gameId;
    document.getElementById('deleteGameModal').style.display = 'flex';
}

function closeDeleteGameModal() {
    document.getElementById('deleteGameModal').style.display = 'none';
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}