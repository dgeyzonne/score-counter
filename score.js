let isInverseMode = false;
//let selectedColor = '#3498db'; // Couleur par défaut
let totalPointsPerRound = null;

document.addEventListener("DOMContentLoaded", function() {
    currentGameId = localStorage.getItem('currentGameId');
    loadScores();
});

function selectColor(color) {
    selectedColor = color;
    document.querySelectorAll('.color-picker div').forEach(div => div.classList.remove('selected'));
    document.querySelector(`.color-picker div[style="background-color: ${color};"]`).classList.add('selected');
}

function addPlayer() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
        alert('Veuillez entrer un nom pour le joueur.');
        return;
    }

    if (!selectedColor) {
        alert('Veuillez sélectionner une couleur.');
        return;
    }

    const table = document.getElementById("scoreTable");
    const headerRow = table.querySelector("thead tr");
    const totalRow = table.querySelector("tfoot tr");

    const newHeaderCell = document.createElement("th");
    newHeaderCell.className = "player-header";
    newHeaderCell.style.backgroundColor = selectedColor;
    newHeaderCell.innerHTML = `
                <input class="input-cell" type="text" value="${name}" onchange="updatePlayerName(this)" />`;
    headerRow.appendChild(newHeaderCell);

    const bodyRows = table.querySelectorAll("tbody tr");
    bodyRows.forEach(row => {
        const newCell = row.insertCell(-1);
        newCell.innerHTML = `<input class="input-cell" type="number" value="" onchange="updateScore()">`;
    });

    const newTotalCell = document.createElement("td");
    newTotalCell.innerHTML = `<span>0</span>`;
    totalRow.appendChild(newTotalCell);

    updateScore(); // Met à jour les scores pour refléter les nouveaux joueurs
    closeModal();
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
            const inputValue = parseInt(currentInput.value) || 0;
            totals[i - 1].innerText = parseInt(totals[i - 1].innerText) + inputValue;

            if (currentInput.value == "") {
                missingScoreInputs.push(currentInput);
            } else {
                hasSomeInput = true;
            }
            currentInput.classList.remove('invalid-score');
            currentInput.placeholder = "";
            roundTotalPoints = roundTotalPoints + inputValue;
        }

        if (totalPointsPerRound != null && missingScoreInputs.length == 1 && hasSomeInput) {
            missingScoreInputs[0].placeholder = `${totalPointsPerRound - roundTotalPoints}`;
        }

        // Si total de ligne incorrect
        if (totalPointsPerRound != null && missingScoreInputs.length == 0 && totalPointsPerRound != roundTotalPoints) {
            for (let i = 1; i < row.cells.length; i++) {
                let currentInput = row.cells[i].getElementsByTagName('input')[0];
                currentInput.classList.add('invalid-score');
            }
        }
    });

    highlightBestScore();
    saveScores(); // Sauvegarde les scores après mise à jour
}

function highlightBestScore() {
    const table = document.getElementById("scoreTable");
    const totals = table.querySelectorAll("tfoot tr td span");
    let bestScores = [];
    let bestScore = isInverseMode ? Infinity : -Infinity;

    totals.forEach(total => {
        const score = parseInt(total.innerText);
        if ((isInverseMode && score < bestScore) || (!isInverseMode && score > bestScore)) {
            bestScore = score;
            bestScores = [total];
        } else if (score === bestScore) {
            bestScores.push(total);
        }
    });

    totals.forEach(total => total.className = bestScores.includes(total) ? 'best-score' : '');
}

function toggleScoreMode() {
    isInverseMode = !isInverseMode;
    const button = document.querySelector('.toggle-score-btn');
    button.innerText = isInverseMode ? 'Inversé' : 'Classique';
    updateScore(); // Recalculer les scores après avoir changé le mode
}

function updateTotalPointsPerRound(input) {
    totalPointsPerRound = input.value;
    updateScore();
}

function openModal() {
    document.getElementById('playerModal').style.display = 'flex';
    // Réinitialiser les champs de la popin
    document.getElementById('playerName').value = '';
    document.querySelectorAll('.color-picker div').forEach(div => div.classList.remove('selected'));
}

function closeModal() {
    document.getElementById('playerModal').style.display = 'none';
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

function showRanking() {
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
            return `
                        <li>
                            <div class="rank" style="background-color: ${player.color};">${rank}</div>
                            <span class="player-name">${player.name}</span>
                            <span class="player-score">${player.score}</span>
                        </li>
                    `;
        }).join('') +
        '</ul>';

    document.getElementById('rankingModal').style.display = 'flex';
}

function saveScores() {
    const table = document.getElementById("scoreTable");
    const players = [];

    const headerCells = table.querySelectorAll("thead th.player-header");
    headerCells.forEach((headerCell, index) => {
        const playerName = headerCell.querySelector("input").value;
        const playerColor = headerCell.style.backgroundColor;

        const playerScores = Array.from(table.querySelectorAll(`tbody tr td:nth-child(${index + 2}) input`))
            .map(input => parseInt(input.value) || 0);

        players.push({
            name: playerName,
            color: playerColor,
            scores: playerScores
        });
    });

    const gameData = {
        id: currentGameId,
        players: players,
        isInverseMode: isInverseMode,
        date: new Date().toLocaleString(),
    };

    // Récupère la liste des parties existantes
    const games = JSON.parse(localStorage.getItem('games')) || [];
    // Vérifie si la partie actuelle existe déjà dans la liste
    const existingGameIndex = games.findIndex(game => game.id === currentGameId);
    if (existingGameIndex !== -1) {
        // Met à jour la partie existante
        games[existingGameIndex] = gameData;
    } else {
        // Ajoute la nouvelle partie
        games.push(gameData);
    }

    // Sauvegarde la liste des parties dans localStorage
    localStorage.setItem('games', JSON.stringify(games));
}

function loadScores() {
    const games = JSON.parse(localStorage.getItem('games')) || [];
    const currentGame = games.find(game => game.id === currentGameId);

    if (currentGame) {
        const table = document.getElementById("scoreTable");
        const headerRow = table.querySelector("thead tr");
        const body = table.querySelector("tbody");
        const totalRow = table.querySelector("tfoot tr");

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