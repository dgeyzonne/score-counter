function newGame() {
    // Crée un identifiant unique pour la nouvelle partie
    const gameId = Date.now();
    // Enregistre l'identifiant dans localStorage
    localStorage.setItem('currentGameId', gameId);
    // Redirige vers la page de comptage des scores
    location.href = 'score.html';
}

function showVersion() {
    const version = document.getElementById('version');
    version.classList.add('show');

    setTimeout(() => {
        version.classList.remove('show');
    }, 3000); // Disparaît après 3 secondes
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log('Service Worker registered!'))
        .catch((error) => console.log('Service Worker registration failed:', error));
}