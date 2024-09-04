let isInverseMode = false;
let selectedColor = null;
let totalPointsPerRound = null;
let selectedPlayers = [];
let gameName = null;

document.addEventListener("DOMContentLoaded", function () {
    currentGameId = localStorage.getItem('currentGameId');
    const games = JSON.parse(localStorage.getItem('games')) || [];
    const currentGame = games.find(game => game.id === currentGameId);

    if (currentGame == null || !currentGame.name) {
        openGameNameModal();
    } else {
        loadScores(currentGame);
    }
});

function validateGameName() {
    gameName = document.getElementById('gameName').value.trim();
    const errorMessage = document.getElementById('gameNameErrorMessage');
    errorMessage.innerHTML = '';

    if (!gameName) {
        errorMessage.innerHTML = 'Veuillez entrer un nom de jeu';
        return;
    }

    const games = JSON.parse(localStorage.getItem('games')) || [];
    let currentGame = games.find(game => game.id === currentGameId);
    let isNewGame = false;

    if (currentGame == null) {
        isNewGame = true;
        currentGame = {
            id: currentGameId,
            name: gameName,
            players: [],
            isInverseMode: isInverseMode
        };

        games.push(currentGame);
    } else {
        currentGame.name = gameName;
    }

    // Sauvegarde la liste des parties dans localStorage
    localStorage.setItem('games', JSON.stringify(games));
    closeGameNameModal();

    if (isNewGame) {
        openPlayersModal();
    } else {
        loadScores(currentGame);
    }
}

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-picker div').forEach(div => div.classList.remove('selected'));
    document.querySelector(`.color-picker div[style="background-color: ${color};"]`).classList.add('selected');
}

function addNewPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const errorMessage = document.getElementById('newPlayerErrorMessage');
    errorMessage.innerHTML = '';

    if (!name) {
        errorMessage.innerHTML = 'Veuillez entrer un nom de joueur';
        return;
    }

    if (selectedColor == null) {
        errorMessage.innerHTML = 'Veuillez sélectionner une couleur';
        return;
    }

    const newPlayer = { name: name, color: selectedColor };

    let players = JSON.parse(localStorage.getItem('players')) || [];
    players.push(newPlayer);
    localStorage.setItem('players', JSON.stringify(players));

    selectedPlayers.push(newPlayer);

    loadPlayers();
    closeNewPlayerModal();
}

function addPlayerToTable(player) {
    const table = document.getElementById("scoreTable");
    const headerRow = table.querySelector("thead tr");
    const totalRow = table.querySelector("tfoot tr");

    const newHeaderCell = document.createElement("th");
    newHeaderCell.className = "player-header";
    newHeaderCell.style.backgroundColor = player.color;
    newHeaderCell.innerHTML = `
                <input class="input-cell" type="text" value="${player.name}" onchange="updatePlayerName(this)" />`;
    headerRow.appendChild(newHeaderCell);

    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach(row => {
        const newCell = row.insertCell(-1);
        newCell.innerHTML = `<input class="input-cell" type="number" value="" onchange="updateScore()">`;
    });

    const newTotalCell = document.createElement("td");
    newTotalCell.innerHTML = `<span>0</span>`;
    totalRow.appendChild(newTotalCell);
}

function addRound() {
    const table = document.getElementById("scoreTable").getElementsByTagName('tbody')[0];
    const headerRow = document.getElementById("scoreTable").querySelector("thead tr");

    const newRow = table.insertRow();
    const roundIndex = table.rows.length;

    const roundCell = newRow.insertCell(0);
    roundCell.innerHTML = `#${roundIndex}`;

    for (let i = 1; i < headerRow.cells.length; i++) {
        const newCell = newRow.insertCell(-1);
        newCell.innerHTML = `<input class="input-cell" type="number" value="" onchange="updateScore()">`;
    }
}

function updateScore() {
    const table = document.getElementById("scoreTable");
    const rows = table.querySelectorAll("tbody tr");
    const totals = table.querySelectorAll("tfoot tr td span");

    totals.forEach(total => total.innerText = 0);

    rows.forEach(row => {
        let roundTotalPoints = 0;
        let missingScoreInputs = [];
        let hasSomeInput = false;

        for (let i = 1; i < row.cells.length; i++) {
            let currentInput = row.cells[i].getElementsByTagName('input')[0];
            const score = parseInt(currentInput.value) || 0;
            totals[i - 1].innerText = parseInt(totals[i - 1].innerText) + score;
            currentInput.classList.remove('invalid-score');
            currentInput.placeholder = "";
            roundTotalPoints = roundTotalPoints + score;

            if (currentInput.value == "") {
                // on liste les inputs sans score du tour
                missingScoreInputs.push(currentInput);
            } else {
                hasSomeInput = true;
            }
        }

        // Si paramètre "Nb points par tour" actif et qu'il ne manque qu'un score sur le tour
        // on calcule la diff pour atteindre le nb de points paramétré, et on l'affiche en placeholder.
        if (totalPointsPerRound != null && missingScoreInputs.length == 1 && hasSomeInput) {
            missingScoreInputs[0].placeholder = `${totalPointsPerRound - roundTotalPoints}`;
        }

        // Si total de ligne incorrect
        if (totalPointsPerRound != null && missingScoreInputs.length == 0 && totalPointsPerRound != roundTotalPoints) {
            for (let i = 1; i < row.cells.length; i++) {
                row.cells[i].getElementsByTagName('input')[0].classList.add('invalid-score');
            }
        }
    });

    highlightBestScore();
    saveScores(); // Sauvegarde les scores après mise à jour
}

function highlightBestScore() {
    // Highlight le(s) meilleur(s) score(s) de la ligne total
    const table = document.getElementById("scoreTable");
    const totals = table.querySelectorAll("tfoot tr td span");
    let bestScores = [];
    let currentBestScore = isInverseMode ? Infinity : -Infinity;

    totals.forEach(total => {
        total.classList.remove('best-score');
        const score = parseInt(total.innerText);
        if ((isInverseMode && score < currentBestScore) || (!isInverseMode && score > currentBestScore)) {
            currentBestScore = score;
            bestScores = [total];
        } else if (score === currentBestScore) {
            bestScores.push(total);
        }
    });

    bestScores.forEach(bestScore => bestScore.classList.add('best-score'));

    // Highlight le(s) meilleur(s) score(s) de chaque tour
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
        let rowBestScores = [];
        let currentRowBestScore = isInverseMode ? Infinity : -Infinity;
        let hasMissingScore = false;

        for (let i = 1; i < row.cells.length; i++) {
            let currentInput = row.cells[i].getElementsByTagName('input')[0];
            const score = parseInt(currentInput.value) || 0;
            currentInput.classList.remove('best-score');

            if (currentInput.value != "") {
                // on liste les meilleurs scores du tour
                if ((isInverseMode && score < currentRowBestScore) || (!isInverseMode && score > currentRowBestScore)) {
                    currentRowBestScore = score;
                    rowBestScores = [currentInput];
                } else if (score === currentRowBestScore) {
                    rowBestScores.push(currentInput);
                }
            } else {
                hasMissingScore = true;
            }
        }

        if (!hasMissingScore) {
            rowBestScores.forEach(rowBestScore => rowBestScore.classList.add('best-score'));
        }
    });
}

function toggleScoreMode() {
    isInverseMode = !isInverseMode;
    const button = document.querySelector('.toggle-score-btn');
    button.innerText = isInverseMode ? 'Inversé' : 'Classique';
    updateScore(); // Recalculer les scores après avoir changé le mode
}

function updateTotalPointsPerRound(input) {
    totalPointsPerRound = isNumeric(input.value) ? input.value : null;
    updateScore();
}

function openGameNameModal() {
    document.getElementById('gameNameModal').style.display = 'flex';
    // Réinitialiser les champs de la popin
    document.getElementById('gameName').value = '';
    document.getElementById('gameNameErrorMessage').innerHTML = '';
}

function closeGameNameModal() {
    document.getElementById('gameNameModal').style.display = 'none';
}

function openPlayersModal() {
    loadPlayers();
    document.getElementById('playersModal').style.display = 'flex';
}

function closePlayersModal() {
    document.getElementById('playersModal').style.display = 'none';
}

function openNewPlayerModal() {
    document.getElementById('newPlayerModal').style.display = 'flex';
    // Réinitialiser les champs de la popin
    document.getElementById('playerName').value = '';
    document.querySelectorAll('.color-picker div').forEach(div => div.classList.remove('selected'));
    document.getElementById('newPlayerErrorMessage').innerHTML = '';
    selectedColor = null;
}

function closeNewPlayerModal() {
    document.getElementById('newPlayerModal').style.display = 'none';
}

function openRankingModal() {
    const table = document.getElementById("scoreTable");
    const rows = table.querySelectorAll("tfoot tr td span");
    const players = Array.from(rows).map((span, index) => ({
        name: table.querySelector(`thead th:nth-child(${index + 2}) input`).value,
        score: parseInt(span.innerText),
        color: table.querySelector(`thead th:nth-child(${index + 2})`).style.backgroundColor
    }));

    players.sort((a, b) => isInverseMode ? a.score - b.score : b.score - a.score);

    let currentRank = 0;
    let previousScore = null;
    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '<ul class="ranking-list">' +
        players.map((player, index) => {
            const rank = (player.score === previousScore) ? currentRank : ++currentRank;
            previousScore = player.score;
            const crownIcon = rank == 1 ? '<i class="fas fa-crown crown-icon"></i>' : '';
            return `
                        <li style="position:relative">
                            <div class="rank" style="background-color: ${player.color};"><span class="rank-text">${rank}</span></div>${crownIcon}
                            <span class="player-name">${player.name}</span>
                            <span class="player-score">${player.score}</span>
                        </li>
                    `;
        }).join('') +
        '</ul>';

    document.getElementById('rankingModal').style.display = 'flex';
}

function closeRankingModal() {
    document.getElementById('rankingModal').style.display = 'none';
}

function openOptionsModal() {
    document.getElementById('optionsModal').style.display = 'flex';
}

function closeOptionsModal() {
    document.getElementById('optionsModal').style.display = 'none';
}

function updatePlayerName(input) {
    const headerCell = input.closest('th');
    const index = Array.from(headerCell.parentNode.children).indexOf(headerCell);
    const totalCells = document.querySelectorAll(`#scoreTable tfoot tr td:nth-child(${index + 2}) span`);
    totalCells.forEach(cell => cell.innerText = 0);
    updateScore();
}

function saveScores() {
    const table = document.getElementById("scoreTable");
    const players = [];

    const headerCells = table.querySelectorAll("thead th.player-header");
    headerCells.forEach((headerCell, index) => {
        const playerName = headerCell.querySelector("input").value;
        const playerColor = rgbToHex(headerCell.style.backgroundColor);
        const playerScores = Array.from(table.querySelectorAll(`tbody tr td:nth-child(${index + 2}) input`))
            .map(input => input.value == "0" ? 0 : parseInt(input.value) || null);

        players.push({
            name: playerName,
            color: playerColor,
            scores: playerScores
        });
    });
    
    const games = JSON.parse(localStorage.getItem('games')) || [];
    const currentGame = games.find(game => game.id === currentGameId);

    if (currentGame == null) {
        const gameData = {
            id: currentGameId,
            name: gameName,
            players: players,
            isInverseMode: isInverseMode
        };

        games.push(gameData);
    } else {
        currentGame.players = players;
        currentGame.isInverseMode = isInverseMode;
    }

    // Sauvegarde la liste des parties dans localStorage
    localStorage.setItem('games', JSON.stringify(games));
}

function rgbToHex(col) {
    if (col.charAt(0) == 'r') {
        col = col.replace('rgb(', '').replace(')', '').split(',');
        var r = parseInt(col[0], 10).toString(16);
        var g = parseInt(col[1], 10).toString(16);
        var b = parseInt(col[2], 10).toString(16);
        r = r.length == 1 ? '0' + r : r; g = g.length == 1 ? '0' + g : g; b = b.length == 1 ? '0' + b : b;
        var colHex = '#' + r + g + b;
        return colHex;
    }
    return col;
}

function loadScores(currentGame) {
    if (currentGame) {
        const table = document.getElementById("scoreTable");
        const headerRow = table.querySelector("thead tr");
        const body = table.querySelector("tbody");
        const totalRow = table.querySelector("tfoot tr");

        // Vider la table
        headerRow.innerHTML = '<th></th>';
        body.innerHTML = '';
        totalRow.innerHTML = '<td>Total</td>';

        currentGame.players.forEach(player => {
            // Ajouter les headers pour chaque joueur
            const newHeaderCell = document.createElement("th");
            newHeaderCell.className = "player-header";
            newHeaderCell.style.backgroundColor = player.color;
            newHeaderCell.innerHTML = `<input class="input-cell" type="text" value="${player.name}" onchange="updatePlayerName(this)" />`;
            headerRow.appendChild(newHeaderCell);

            // Ajouter les scores pour chaque round
            player.scores.forEach((score, roundIndex) => {
                if (body.rows[roundIndex]) {
                    const newCell = body.rows[roundIndex].insertCell(-1);
                    newCell.innerHTML = `<input class="input-cell" type="number" value="${score}" onchange="updateScore()">`;
                } else {
                    const newRow = document.createElement("tr");
                    const roundLabel = document.createElement("td");
                    roundLabel.textContent = `#${roundIndex + 1}`;
                    newRow.appendChild(roundLabel);

                    const newCell = document.createElement("td");
                    newCell.innerHTML = `<input class="input-cell" type="number" value="${score}" onchange="updateScore()">`;
                    newRow.appendChild(newCell);

                    body.appendChild(newRow);
                }
            });

            // Ajouter une colonne de total
            const newTotalCell = document.createElement("td");
            const totalScore = player.scores.reduce((sum, score) => sum + score, 0);
            newTotalCell.innerHTML = `<span>${totalScore}</span>`;
            totalRow.appendChild(newTotalCell);
        });

        isInverseMode = currentGame.isInverseMode;
        document.querySelector(".toggle-score-btn").textContent = isInverseMode ? "Inversé" : "Classique";
        highlightBestScore();
    }
}

function loadPlayers() {
    loadSelectedPlayers();
    loadAvailablePlayers();
}

// Chargement des joueurs depuis le LocalStorage
function loadAvailablePlayers() {
    let players = JSON.parse(localStorage.getItem('players')) || [];

    // on n'affiche pas les joueurs déjà ajoutés au tableau, ni ceux sélectionnés
    const games = JSON.parse(localStorage.getItem('games')) || [];
    const currentGame = games.find(game => game.id === currentGameId);
    players = players.filter(player => (currentGame == null || !currentGame.players.some(currentPlayer => currentPlayer.name == player.name && rgbToHex(currentPlayer.color) == player.color))
        && !selectedPlayers.some(selectedPlayer => selectedPlayer.name == player.name && selectedPlayer.color == player.color));
    
    players.sort((a, b) => a.name.localeCompare(b.name));
    const playersList = document.getElementById('playersList');
    playersList.innerHTML = '';

    players.forEach((player, index) => {
        const playerItem = document.createElement('div');
        playerItem.classList.add('player-item');
        playerItem.setAttribute('data-index', index);
        playerItem.innerHTML = `
            <div class="selectable-user" onclick="selectPlayer('${player.name}', '${player.color}')">
                <div class="color-circle" style="background-color: ${player.color};"></div>
                <span>${player.name}</span>
            </div>
            <button class="delete-btn small-button" onclick="deletePlayer('${player.name}', '${player.color}')">
                <i class="fas fa-trash"></i>
            </button>`;
        playersList.appendChild(playerItem);
    });
}

function selectPlayer(name, color) {
    let players = JSON.parse(localStorage.getItem('players')) || [];
    const selectedPlayer = players.find(player => player.name == name && player.color == color);
    selectedPlayers.push(selectedPlayer);
    loadPlayers();
}

function loadSelectedPlayers() {
    const selectedPlayersList = document.getElementById('selectedPlayersList');
    selectedPlayersList.innerHTML = '';

    // on n'affiche pas les joueurs déjà ajoutés au tableau
    const games = JSON.parse(localStorage.getItem('games')) || [];
    const currentGame = games.find(game => game.id === currentGameId);
    if (currentGame != null) {
        selectedPlayers = selectedPlayers.filter(selectedPlayer => !currentGame.players.some(player => player.name == selectedPlayer.name && rgbToHex(player.color) == selectedPlayer.color));
    }

    selectedPlayers.forEach((selectedPlayer) => {
        const selectedPlayerItem = document.createElement('div');
        selectedPlayerItem.classList.add('player-item');
        selectedPlayerItem.innerHTML = `
        <div style="display:flex">
            <div class="color-circle" style="background-color: ${selectedPlayer.color};"></div>
            <span>${selectedPlayer.name}</span>
        </div>`;
        selectedPlayerItem.classList.toggle('selected');
        selectedPlayerItem.addEventListener('click', function () {
            deselectPlayer(selectedPlayer.name, selectedPlayer.color);
        });
        selectedPlayersList.appendChild(selectedPlayerItem);
    });
}

function deselectPlayer(name, color) {
    selectedPlayers = selectedPlayers.filter(selectedPlayer => selectedPlayer.name != name && selectedPlayer.color != color);
    loadPlayers();
}

function deletePlayer(name, color) {
    let players = JSON.parse(localStorage.getItem('players')) || [];
    players = players.filter(player => player.name != name && player.color != color);
    localStorage.setItem('players', JSON.stringify(players));
    loadPlayers();
}

function addSelectedPlayers() {
    selectedPlayers.forEach(selectedPlayer => addPlayerToTable(selectedPlayer));
    updateScore();
    closePlayersModal();
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}