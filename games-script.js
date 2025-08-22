// Game data and state - FIXED to load real data
const availableGames = [
    'Andedammen', 'Revolver skydebane', 'Dart', 'Bonanza', 'Boom ball',
    'Bueskydning', 'Delfinspillet', 'Fodbold', 'Fodbolddart', 'Golf',
    'Hønen', 'Håndboldspillet', 'Basket', 'Mini bowling', 'Dåsekast',
    'Øksekast', 'Andet1', 'Andet2', 'Andet3', 'Andet4'
];

// Real data loaded from localStorage
let teams = {};
let players = [];
let completedGamesList = [];
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
const completedGamesContainer = document.getElementById('completedGames');
const completedCount = document.getElementById('completedCount');
const finishTournamentBtn = document.getElementById('finishTournamentBtn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Games page loaded');
    loadRealData();
    renderGamesGrid();
    renderStandings();
    setupEventListeners();
    updateCompletedGames();
});

function loadRealData() {
    console.log('📥 Loading real data from localStorage...');
    
    // Load players
    try {
        const playersData = localStorage.getItem('bakken-players');
        if (playersData) {
            players = JSON.parse(playersData);
            console.log('✅ Loaded players:', players);
        } else {
            console.log('⚠️ No players found');
            players = [];
        }
    } catch (e) {
        console.error('❌ Failed to load players:', e);
        players = [];
    }

    // Load teams
    try {
        const teamsData = localStorage.getItem('bakken-teams');
        if (teamsData) {
            const teamInfo = JSON.parse(teamsData);
            const teamAssignments = teamInfo.teams || {};
            const teamNames = teamInfo.teamNames || {};
            
            console.log('✅ Loaded team assignments:', teamAssignments);
            console.log('✅ Loaded team names:', teamNames);
            
            // Convert to the format games expects
            teams = {};
            [1, 2, 3].forEach(teamId => {
                const playerIds = teamAssignments[teamId] || [];
                const teamMembers = playerIds.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    return player ? player.name : 'Unknown';
                }).filter(name => name !== 'Unknown');
                
                teams[teamId] = {
                    name: teamNames[teamId] || `Hold ${teamId}`,
                    members: teamMembers,
                    score: 0
                };
            });
            
            console.log('✅ Converted teams for games:', teams);
        } else {
            console.log('⚠️ No teams found, using defaults');
            teams = {
                1: { name: 'Hold 1', members: [], score: 0 },
                2: { name: 'Hold 2', members: [], score: 0 },
                3: { name: 'Hold 3', members: [], score: 0 }
            };
        }
    } catch (e) {
        console.error('❌ Failed to load teams:', e);
        teams = {
            1: { name: 'Hold 1', members: [], score: 0 },
            2: { name: 'Hold 2', members: [], score: 0 },
            3: { name: 'Hold 3', members: [], score: 0 }
        };
    }

    // Load completed games
    try {
        const gamesData = localStorage.getItem('bakken-games');
        if (gamesData) {
            const gameInfo = JSON.parse(gamesData);
            completedGamesList = gameInfo.completedGames || [];
            
            // Restore team scores
            if (gameInfo.teamScores) {
                Object.keys(gameInfo.teamScores).forEach(teamId => {
                    if (teams[teamId]) {
                        teams[teamId].score = gameInfo.teamScores[teamId];
                    }
                });
            }
            
            console.log('✅ Loaded completed games:', completedGamesList);
        }
    } catch (e) {
        console.error('❌ Failed to load games:', e);
        completedGamesList = [];
    }
}

function saveGameData() {
    try {
        const teamScores = {};
        Object.keys(teams).forEach(teamId => {
            teamScores[teamId] = teams[teamId].score;
        });
        
        const gameData = {
            completedGames: completedGamesList,
            teamScores: teamScores
        };
        
        localStorage.setItem('bakken-games', JSON.stringify(gameData));
        console.log('💾 Saved game data:', gameData);
    } catch (e) {
        console.error('❌ Failed to save game data:', e);
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Game selection
    gamesGrid.addEventListener('click', function(e) {
        if (e.target.classList.contains('game-option') && !e.target.classList.contains('completed')) {
            console.log('Starting game:', e.target.dataset.game);
            startGame(e.target.dataset.game);
        }
    });

    // Team selection for places
    document.querySelectorAll('.team-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            console.log('Team button clicked:', this.dataset.team, this.closest('.winner-card').dataset.place);
            selectTeamForPlace(this.dataset.team, this.closest('.winner-card').dataset.place);
        });
    });

    // Game actions
    confirmResultBtn.addEventListener('click', confirmGameResult);
    cancelGameBtn.addEventListener('click', cancelGame);
    
    // Navigation
    document.getElementById('backToTeamsBtn')?.addEventListener('click', function() {
        window.location.href = 'simple-teams.html';
    });
    
    finishTournamentBtn.addEventListener('click', function() {
        if (completedGamesList.length >= 10) {
            alert('Konkurrencen er færdig! Tillykke til vinderne! 🎉');
        }
    });
}

function renderGamesGrid() {
    const completedGameNames = completedGamesList.map(game => game.name || game);
    gamesGrid.innerHTML = availableGames.map(game => `
        <div class="game-option ${completedGameNames.includes(game) ? 'completed' : ''}" 
             data-game="${game}">
            ${game}
        </div>
    `).join('');
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
    console.log('Starting game:', gameName);
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
    console.log('Selecting team', teamId, 'for place', place);
    
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
        const btn = card?.querySelector(`[data-team="${teamId}"]`);
        
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
        timestamp: new Date().toISOString()
    });
    
    // Save data
    saveGameData();
    
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
        const gameData = typeof game === 'string' ? { name: game } : game;
        const winner = gameData.results ? teams[gameData.results[1]] : null;
        return `
            <div class="completed-game">
                <div class="completed-game-name">${gameData.name}</div>
                <div class="completed-game-result">${winner ? `Vinder: ${winner.name}` : 'Resultat gemt'}</div>
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