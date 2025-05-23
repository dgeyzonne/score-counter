let isInverseMode = false;
let selectedColor = null;
let totalPointsPerRound = null;
let selectedPlayers = [];
let gameName = null;
let currentGameId = null;
let games = null;
let playerToDelete = null;
let roundToDelete = null;

document.addEventListener("DOMContentLoaded", function () {
    games = JSON.parse(localStorage.getItem('games')) || [];
    currentGameId = localStorage.getItem('currentGameId');
    const currentGame = getCurrentGame();

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

    let currentGame = getCurrentGame();
    let isNewGame = false;

    if (currentGame == null) {
        isNewGame = true;
        currentGame = newGame(gameName, [], isInverseMode, totalPointsPerRound);
    } else {
        currentGame.name = gameName;
        localStorage.setItem('games', JSON.stringify(games));
    }

    closeGameNameModal();

    if (isNewGame) {
        const table = document.getElementById("scoreTable");
        const headerRow = table.querySelector("thead tr");
        headerRow.innerHTML = `<th>${currentGame.name}</th>`;

        openPlayersModal();
    } else {
        loadScores(currentGame);
    }
}

function getCurrentGame() {
    return games.find(game => game.id === currentGameId);
}

function newGame(gameName, players, isInverseMode, totalPointsPerRound) {
    let newGame = {
        id: currentGameId,
        name: gameName,
        players: players,
        isInverseMode: isInverseMode,
        totalPointsPerRound: totalPointsPerRound
    };

    games.push(newGame);
    localStorage.setItem('games', JSON.stringify(games));

    return newGame;
}

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-picker div').forEach(div => div.classList.remove('selected'));
    document.querySelector(`.color-picker div[style="background-color: ${color};"]`).classList.add('selected');
}

/**
 * Supprime les caratères interdits
 */
function filterPlayerNameInput(input) {
    const forbiddenChars = /['"<>]/g;
    input.value = input.value.replace(forbiddenChars, '');
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

    const newHeaderCell = createHeaderCell(player);
    headerRow.appendChild(newHeaderCell);

    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach(row => {
        const newCell = row.insertCell();
        newCell.innerHTML = `<input class="input-cell" type="number" value="" onchange="updateScore()">`;
    });

    const newTotalCell = document.createElement("td");
    newTotalCell.innerHTML = `<span>0</span>`;
    totalRow.appendChild(newTotalCell);
}

function createHeaderCell(player) {
    const newHeaderCell = document.createElement("th");
    newHeaderCell.className = "player-header";
    newHeaderCell.style.backgroundColor = player.color;
    newHeaderCell.innerHTML = `<span class="header-player-name">${player.name}</span>`;
    newHeaderCell.addEventListener("click", function() {
        let removeButton = newHeaderCell.querySelector(".header-player-delete-btn");
        if (!removeButton) {
            // Ajoute le bouton de suppression s'il n'est pas déjà présent
            removeButton = document.createElement("span");
            removeButton.className = "header-player-delete-btn";
            removeButton.innerHTML = `
                    <button onclick="openDeletePlayerFromCurrentGameModal(event, '${player.name}', '${player.color}')" class="delete-btn small-button">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

            newHeaderCell.appendChild(removeButton);
        } else {
            newHeaderCell.removeChild(removeButton);
        }
    });

    return newHeaderCell;
}

function deletePlayerFromCurrentGame() {
    const currentGame = getCurrentGame();
    currentGame.players = currentGame.players.filter(player => player.name != playerToDelete.name && player.color != playerToDelete.color);
    // Sauvegarde la liste des parties dans localStorage
    localStorage.setItem('games', JSON.stringify(games));

    playerToDelete = null;
    closeDeletePlayerFromCurrentGameModal();
    loadScores(currentGame);
}

function addRound() {
    const table = document.getElementById("scoreTable").getElementsByTagName('tbody')[0];
    const headerRow = document.getElementById("scoreTable").querySelector("thead tr");

    const newRow = table.insertRow();
    const roundIndex = table.rows.length - 1;

    const roundCell = newRow.insertCell(0);
    roundCell.innerHTML = `#${roundIndex + 1}`;
    newRoundCell(roundCell, roundIndex);

    for (let i = 1; i < headerRow.cells.length; i++) {
        const newCell = newRow.insertCell();
        newCell.innerHTML = `<input class="input-cell" type="number" value="" onchange="updateScore()">`;
    }
}

function deleteRound() {
    const currentGame = getCurrentGame();
    currentGame.players.forEach(player => player.scores.splice(roundToDelete, 1));
    // Sauvegarde la liste des parties dans localStorage
    localStorage.setItem('games', JSON.stringify(games));

    roundToDelete = null;
    closeDeleteRoundModal();
    loadScores(currentGame);
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

function openDeletePlayerModal(event, playerName, playerColor) {
    event.stopPropagation();

    let players = JSON.parse(localStorage.getItem('players')) || [];
    playerToDelete = players.find(player => player.name == playerName && player.color == playerColor);

    document.getElementById('deletePlayerModal').style.display = 'flex';
}

function closeDeletePlayerModal() {
    document.getElementById('deletePlayerModal').style.display = 'none';
}

function openDeletePlayerFromCurrentGameModal(event, playerName, playerColor) {
    event.stopPropagation();

    const currentGame = getCurrentGame();
    playerToDelete = currentGame.players.find(player => player.name == playerName && player.color == playerColor);
    
    document.getElementById('deletePlayerFromCurrentGameModal').style.display = 'flex';
}

function closeDeletePlayerFromCurrentGameModal() {
    document.getElementById('deletePlayerFromCurrentGameModal').style.display = 'none';
}

function openDeleteRoundModal(event, roundIndex) {
    event.stopPropagation();
    roundToDelete = roundIndex;
    document.getElementById('deleteRoundModal').style.display = 'flex';
}

function closeDeleteRoundModal() {
    document.getElementById('deleteRoundModal').style.display = 'none';
}

function openRankingModal() {
    const currentGame = getCurrentGame();
    const rankingModalTitle = document.getElementById('rankingModalTitle');
    rankingModalTitle.innerHTML = currentGame.name;
    
    const table = document.getElementById("scoreTable");
    const rows = table.querySelectorAll("tfoot tr td span");
    const players = Array.from(rows).map((span, index) => ({
        name: table.querySelector(`thead th:nth-child(${index + 2}) .header-player-name`).innerText,
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

function saveScores() {
    const table = document.getElementById("scoreTable");
    const players = [];

    const headerCells = table.querySelectorAll("thead th.player-header");
    headerCells.forEach((headerCell, index) => {
        const playerName = headerCell.querySelector(".header-player-name").innerText;
        const playerColor = rgbToHex(headerCell.style.backgroundColor);
        const playerScores = Array.from(table.querySelectorAll(`tbody tr td:nth-child(${index + 2}) input`))
            .map(input => input.value == "0" ? 0 : parseInt(input.value) || null);

        players.push({
            name: playerName,
            color: playerColor,
            scores: playerScores
        });
    });

    const currentGame = getCurrentGame();

    if (currentGame == null) {
        newGame(gameName, players, isInverseMode, totalPointsPerRound);
    } else {
        currentGame.players = players;
        currentGame.isInverseMode = isInverseMode;
        currentGame.totalPointsPerRound = totalPointsPerRound;
        localStorage.setItem('games', JSON.stringify(games));
    }
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
        headerRow.innerHTML = `<th>${currentGame.name}</th>`;
        body.innerHTML = '';
        totalRow.innerHTML = '<td>Total</td>';

        currentGame.players.forEach(player => {
            // Ajouter les headers pour chaque joueur
            const newHeaderCell = createHeaderCell(player);
            headerRow.appendChild(newHeaderCell);

            // Ajouter les scores pour chaque round
            player.scores.forEach((score, roundIndex) => {
                if (body.rows[roundIndex]) {
                    const newCell = body.rows[roundIndex].insertCell();
                    newCell.innerHTML = `<input class="input-cell" type="number" value="${score !== null ? score : ''}" onchange="updateScore()">`;
                } else {
                    const newRow = document.createElement("tr");
                    const roundLabel = document.createElement("td");
                    roundLabel.textContent = `#${roundIndex + 1}`;
                    newRoundCell(roundLabel, roundIndex);
                    newRow.appendChild(roundLabel);

                    const newCell = document.createElement("td");
                    newCell.innerHTML = `<input class="input-cell" type="number" value="${score !== null ? score : ''}" onchange="updateScore()">`;
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
        totalPointsPerRound = currentGame.totalPointsPerRound;
        document.querySelector("#total-point-per-round-input").value = totalPointsPerRound;

        updateScore();
    }
}

function newRoundCell(cell, roundIndex) {
    cell.addEventListener("click", function () {
        let removeButton = cell.querySelector(".delete-round-btn");
        if (!removeButton) {
            // Ajoute le bouton de suppression s'il n'est pas déjà présent
            removeButton = document.createElement("span");
            removeButton.className = "delete-round-btn";
            removeButton.innerHTML = `
                    <button onclick="openDeleteRoundModal(event, ${roundIndex})" class="delete-btn small-button">
                        <i class="fas fa-trash"></i>
                    </button>
                `;

            cell.appendChild(removeButton);
        } else {
            cell.removeChild(removeButton);
        }
    });
}

function loadPlayers() {
    loadSelectedPlayers();
    loadAvailablePlayers();
}

// Chargement des joueurs depuis le LocalStorage
function loadAvailablePlayers() {
    let players = JSON.parse(localStorage.getItem('players')) || [];

    // on n'affiche pas les joueurs déjà ajoutés au tableau, ni ceux sélectionnés
    const currentGame = getCurrentGame();
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
            <button class="delete-btn small-button" onclick="openDeletePlayerModal(event, '${player.name}', '${player.color}')">
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
    const currentGame = getCurrentGame();
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

function deletePlayer() {
    let players = JSON.parse(localStorage.getItem('players')) || [];
    players = players.filter(player => player.name != playerToDelete.name && player.color != playerToDelete.color);

    // Sauvegarde la liste des joueurs dans localStorage
    localStorage.setItem('players', JSON.stringify(players));

    playerToDelete = null;
    closeDeletePlayerModal();
    loadPlayers();
}

function addSelectedPlayers() {
    selectedPlayers.forEach(selectedPlayer => addPlayerToTable(selectedPlayer));
    updateScore();
    closePlayersModal();
}

async function downloadScore() {
    const currentGame = getCurrentGame();
    const currentGameDate = new Date(Number.parseInt(currentGame.id));
    const fileName = currentGame.name + '_' + currentGameDate.toLocaleString().replaceAll(' ', '_') + '.png';

    const modalContent = document.querySelector("#rankingModal .modal-content");
    const rect = modal.getBoundingClientRect(); // Taille exacte de la modal
    const canvas = await html2canvas(modalContent, {
        backgroundColor: null, // pour fond transparent si nécessaire
        scrollX: 0,
        scrollY: 0,
        width: rect.width,
        height: rect.height,
        windowWidth: rect.width,
        windowHeight: rect.height,
    });

    canvas.toBlob(async (blob) => {
        if (!blob) {
            return;
        }

        const file = new File([blob], fileName, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: "Score-counter",
                    text: currentGame.name + ' ' + currentGameDate,
                    files: [file],
                });
                return;
            } catch (err) {
                console.error("Partage annulé ou erreur:", err);
            }
        }

        // FALLBACK : téléchargement
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${currentGame.name} ${currentGameDate}.png`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}