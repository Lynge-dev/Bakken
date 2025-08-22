// Game data and state
const availableGames = [
    'Andedammen', 'Revolver skydebane', 'Dart', 'Bonanza', 'Boom ball',
    'Bueskydning', 'Delfinspillet', 'Fodbold', 'Fodbolddart', 'Golf',
    'Hønen', 'Håndboldspillet', 'Basket', 'Mini bowling', 'Dåsekast',
    'Øksekast', 'Andet1', 'Andet2', 'Andet3', 'Andet4'
];

// Test team data - in real app this would come from previous screen
const teams = {
    1: { name: 'Hold 1', members: ['Lars', 'Mette', 'Peter'], score: 0 },
    2: { name: 'Hold 2', members: ['Anna', 'Thomas'], score: 0 },
    3: { name: 'Hold 3', members: ['Sofie', 'Michael'], score: 0 }
};

let completedGamesList = []; // Changed name to avoid conflict
let currentGame = null;
let gameResults = {}; // { place: teamId }

// DOM elements
const gameSelectionView = document.getElementById('gameSelectionView');
const activeGameView = document.getElementById('activeGameView');
const gamesGrid = document.getElementById('gamesGrid');
const standingsGrid = document.getElementById('standingsGrid');
const currentGameName = document.getElementById('currentGameName');
const confirmResultBtn = document.getElementById('confirmResultBtn');
const cancelGameBtn = document.getElementById('cancelGameBtn');
const completedGamesContainer = document.getElementById('completedGames'); // Changed name
const completedCount = document.getElementById('completedCount');
const finishTournamentBtn = document.getElementById('finishTournamentBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...'); // Debug log
    renderGamesGrid();
    renderStandings();
    setupEventListeners();
    updateCompletedGames();
});

function setupEventListeners() {
    console.log('Setting up event listeners...'); // Debug log
    
    // Game selection
    gamesGrid.addEventListener('click', function(e) {
        console.log('Game grid clicked:', e.target); // Debug log
        if (e.target.classList.contains('game-option') && !e.target.classList.contains('completed')) {
            console.log('Starting game:', e.target.dataset.game); // Debug log
            startGame(e.target.dataset.game);
        }
    });

    // Team selection for places
    document.querySelectorAll('.team-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Team button clicked:', this.dataset.team, this.closest('.winner-card').dataset.place); // Debug log
            selectTeamForPlace(this.dataset.team, this.closest('.winner-card').dataset.place);
        });
    });

    // Game actions
    confirmResultBtn.addEventListener('click', confirmGameResult);
    cancelGameBtn.addEventListener('click', cancelGame);
    
    // Navigation
    document.getElementById('backToTeamsBtn').addEventListener('click', function() {
        alert('Går tilbage til hold-siden');
    });
    
    finishTournamentBtn.addEventListener('click', function() {
        if (completedGamesList.length >= 10) {
            alert('Konkurrencen er færdig! Tillykke til vinderne! 🎉');
        }
    });
}

function renderGamesGrid() {
    console.log('Rendering games grid...'); // Debug log
    gamesGrid.innerHTML = availableGames.map(game => `
        <div class="game-option ${completedGamesList.includes(game) ? 'completed' : ''}" 
             data-game="${game}">
            ${game}
        </div>
    `).join('');
    console.log('Games grid rendered'); // Debug log
}

function renderStandings() {
    // Sort teams by score
    const sortedTeams = Object.entries(teams)
        .sort(([,a], [,b]) => b.score - a.score)
        .map(([id, team], index) => ({
            id,
            ...team,
            position: index + 1
        }));

    standingsGrid.innerHTML = sortedTeams.map(team => `
        <div class="team-standing ${getPositionClass(team.position)}">
            <div class="standing-position">${team.position}</div>
            <div class="standing-info">
                <div class="standing-team">${team.name}</div>
                <div class="standing-members">${team.members.join(', ')}</div>
            </div>
            <div class="standing-score">${team.score}</div>
        </div>
    `).join('');
}

function getPositionClass(position) {
    switch(position) {
        case 1: return 'first';
        case 2: return 'second';
        case 3: return 'third';
        default: return '';
    }
}

function startGame(gameName) {
    console.log('Starting game:', gameName); // Debug log
    currentGame = gameName;
    gameResults = {};
    
    // Update UI
    currentGameName.textContent = gameName;
    gameSelectionView.style.display = 'none';
    activeGameView.style.display = 'block';
    
    // Reset team selections
    document.querySelectorAll('.team-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    document.querySelectorAll('.winner-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    updateConfirmButton();
}

function selectTeamForPlace(teamId, place) {
    console.log('Selecting team', teamId, 'for place', place); // Debug log
    
    // Remove this team from other places
    Object.keys(gameResults).forEach(p => {
        if (gameResults[p] === teamId) {
            delete gameResults[p];
        }
    });
    
    // Add team to this place
    gameResults[place] = teamId;
    
    // Update UI
    updateTeamButtonStates();
    updateConfirmButton();
}

function updateTeamButtonStates() {
    // Reset all buttons
    document.querySelectorAll('.team-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.disabled = false;
        btn.style.opacity = '1';
    });
    
    document.querySelectorAll('.winner-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Update based on current selections
    Object.entries(gameResults).forEach(([place, teamId]) => {
        const card = document.querySelector(`[data-place="${place}"]`);
        const btn = card.querySelector(`[data-team="${teamId}"]`);
        
        if (btn) {
            btn.classList.add('selected');
            card.classList.add('selected');
        }
        
        // Disable this team in other places
        document.querySelectorAll(`[data-team="${teamId}"]:not(.selected)`).forEach(otherBtn => {
            otherBtn.disabled = true;
            otherBtn.style.opacity = '0.5';
        });
    });
}

function updateConfirmButton() {
    const allPlacesSelected = Object.keys(gameResults).length === 3;
    confirmResultBtn.disabled = !allPlacesSelected;
}

function confirmGameResult() {
    if (Object.keys(gameResults).length !== 3) return;
    
    // Award points: 1st = 2 points, 2nd = 1 point, 3rd = 0 points
    const points = { 1: 2, 2: 1, 3: 0 };
    
    Object.entries(gameResults).forEach(([place, teamId]) => {
        teams[teamId].score += points[place];
    });
    
    // Record completed game
    completedGamesList.push({
        name: currentGame,
        results: { ...gameResults },
        timestamp: new Date()
    });
    
    // Update UI
    renderStandings();
    renderGamesGrid();
    updateCompletedGames();
    
    // Return to game selection
    activeGameView.style.display = 'none';
    gameSelectionView.style.display = 'block';
    currentGame = null;
    
    // Check if tournament is complete
    if (completedGamesList.length >= 10) {
        finishTournamentBtn.disabled = false;
    }
    
    // Show success message
    const winner = teams[gameResults[1]];
    showMessage(`${winner.name} vandt ${currentGame}! 🎉`);
}

function cancelGame() {
    activeGameView.style.display = 'none';
    gameSelectionView.style.display = 'block';
    currentGame = null;
    gameResults = {};
}

function updateCompletedGames() {
    completedCount.textContent = completedGamesList.length;
    
    if (completedGamesList.length === 0) {
        completedGamesContainer.innerHTML = '<p class="no-games">Ingen spil gennemført endnu</p>';
        return;
    }
    
    completedGamesContainer.innerHTML = completedGamesList.map(game => {
        const winner = teams[game.results[1]];
        return `
            <div class="completed-game">
                <div class="completed-game-name">${game.name}</div>
                <div class="completed-game-result">Vinder: ${winner.name}</div>
            </div>
        `;
    }).join('');
}

function showMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4ECDC4;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideDown 0.3s ease;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) messageDiv.remove();
    }, 3000);
}

// Add animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
`;
document.head.appendChild(style);