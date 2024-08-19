function newGame() {
    // Crée un identifiant unique pour la nouvelle partie
    const gameId = Date.now();
    // Enregistre l'identifiant dans localStorage
    localStorage.setItem('currentGameId', gameId);
    // Redirige vers la page de comptage des scores
    location.href = 'score.html';
}