// Navigation and year management
let currentViewingYear = null;

// DOM elements
const currentYearSpan = document.getElementById('currentYear');
const newYearBtn = document.getElementById('newYearBtn');
const newYearText = document.getElementById('newYearText');
const previousYears = document.getElementById('previousYears');
const mainNavigation = document.getElementById('mainNavigation');
const previousYearView = document.getElementById('previousYearView');
const backToCurrentBtn = document.getElementById('backToCurrentBtn');
const viewingYearTitle = document.getElementById('viewingYearTitle');
const yearSummary = document.getElementById('yearSummary');
const deleteYearBtn = document.getElementById('deleteYearBtn');
const exportYearBtn = document.getElementById('exportYearBtn');
const currentYearSpanInBack = document.getElementById('currentYearSpan');

// Status elements
const playersStatus = document.getElementById('playersStatus');
const teamsStatus = document.getElementById('teamsStatus');
const gamesStatus = document.getElementById('gamesStatus');
const photosStatus = document.getElementById('photosStatus');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentYear();
    loadPreviousYears();
    updateNavigationStatus();
    setupEventListeners();
});

function setupEventListeners() {
    newYearBtn.addEventListener('click', startNewYear);
    backToCurrentBtn.addEventListener('click', backToCurrentYear);
    deleteYearBtn.addEventListener('click', deleteSelectedYear);
    exportYearBtn.addEventListener('click', exportSelectedYear);
}

function updateCurrentYear() {
    const currentYear = new Date().getFullYear();
    currentYearSpan.textContent = currentYear;
    newYearText.textContent = currentYear;
    currentYearSpanInBack.textContent = currentYear;
}

function loadPreviousYears() {
    const availableYears = dataManager.getAvailableYears();
    const currentYear = new Date().getFullYear();
    const previousYearsList = availableYears.filter(year => year !== currentYear);
    
    if (previousYearsList.length === 0) {
        previousYears.innerHTML = '<p style="text-align: center; color: #999; font-style: italic; padding: 10px;">Ingen tidligere år endnu</p>';
        return;
    }
    
    previousYears.innerHTML = previousYearsList.map(year => `
        <button class="year-btn previous" onclick="viewPreviousYear(${year})">
            📅 Bakken ${year}
        </button>
    `).join('');
}

function updateNavigationStatus() {
    const currentData = dataManager.loadCurrentData();
    
    // Players status
    const playerCount = currentData.players.length;
    playersStatus.textContent = `${playerCount} spiller${playerCount === 1 ? '' : 'e'}`;
    
    // Teams status
    const totalAssigned = Object.values(currentData.teams).flat().length;
    if (totalAssigned === 0) {
        teamsStatus.textContent = 'Ikke oprettet';
    } else if (totalAssigned === playerCount && playerCount > 0) {
        teamsStatus.textContent = 'Alle tildelt';
        document.querySelector('.nav-card.teams').classList.add('completed');
    } else {
        teamsStatus.textContent = `${totalAssigned}/${playerCount} tildelt`;
    }
    
    // Games status
    const gamesCount = currentData.completedGames.length;
    gamesStatus.textContent = `${gamesCount}/10 spil`;
    if (gamesCount >= 10) {
        document.querySelector('.nav-card.games').classList.add('completed');
    }
    
    // Photos status
    const hasGroupPhoto = !!currentData.groupPhoto;
    const teamPhotoCount = Object.values(currentData.teamPhotos).filter(photo => photo).length;
    
    if (!hasGroupPhoto && teamPhotoCount === 0) {
        photosStatus.textContent = 'Ingen fotos';
    } else {
        const photoTexts = [];
        if (hasGroupPhoto) photoTexts.push('Gruppe');
        if (teamPhotoCount > 0) photoTexts.push(`${teamPhotoCount} hold`);
        photosStatus.textContent = photoTexts.join(', ');
        
        if (hasGroupPhoto && teamPhotoCount >= 3) {
            document.querySelector('.nav-card.photos').classList.add('completed');
        }
    }
    
    // Update player count if we have players
    if (playerCount > 0) {
        document.querySelector('.nav-card.players').classList.add('completed');
    }
}

function startNewYear() {
    if (confirm('Start et nyt år? Dette vil gemme det nuværende år og starte forfra.')) {
        // Current year data is automatically saved by data manager
        // Just reload to start fresh
        location.reload();
    }
}

function viewPreviousYear(year) {
    currentViewingYear = year;
    const yearData = dataManager.getYearData(year);
    
    if (!yearData) {
        alert('Ingen data fundet for dette år');
        return;
    }
    
    // Hide main navigation, show previous year view
    mainNavigation.style.display = 'none';
    previousYearView.style.display = 'block';
    
    // Update title
    viewingYearTitle.textContent = `Bakken ${year}`;
    
    // Generate summary
    generateYearSummary(yearData);
}

function generateYearSummary(yearData) {
    const teams = yearData.teams || {};
    const teamNames = yearData.teamNames || {};
    const teamScores = yearData.teamScores || {};
    const completedGames = yearData.completedGames || [];
    const groupPhoto = yearData.groupPhoto;
    const teamPhotos = yearData.teamPhotos || {};
    
    // Sort teams by score
    const sortedTeams = Object.entries(teamScores)
        .sort(([,a], [,b]) => b - a)
        .map(([teamId, score], index) => ({
            id: teamId,
            name: teamNames[teamId] || `Hold ${teamId}`,
            score,
            members: teams[teamId] || [],
            position: index + 1
        }));
    
    yearSummary.innerHTML = `
        <div class="summary-section">
            <h3>🏆 Slutstilling</h3>
            <div class="summary-teams">
                ${sortedTeams.map(team => {
                    const positionClass = team.position === 1 ? 'first' : team.position === 2 ? 'second' : 'third';
                    const medal = team.position === 1 ? '🥇' : team.position === 2 ? '🥈' : '🥉';
                    return `
                        <div class="summary-team ${positionClass}">
                            <div>
                                <strong>${medal} ${team.name}</strong><br>
                                <small>${team.members.join(', ')}</small>
                            </div>
                            <div style="font-weight: bold; font-size: 1.2rem;">${team.score}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="summary-section">
            <h3>🎯 Spil (${completedGames.length})</h3>
            <div class="summary-games">
                ${completedGames.length > 0 ? 
                    completedGames.map((game, index) => `${index + 1}. ${game.name}`).join('<br>') :
                    '<em>Ingen spil gennemført</em>'
                }
            </div>
        </div>
        
        <div class="summary-section">
            <h3>📸 Fotos</h3>
            <div class="summary-photos">
                ${groupPhoto ? `
                    <div class="summary-photo" onclick="viewPhoto('${groupPhoto}', 'Gruppefoto')">
                        <img src="${groupPhoto}" alt="Gruppefoto">
                    </div>
                ` : `
                    <div class="summary-photo">
                        <div class="summary-photo-placeholder">👥</div>
                    </div>
                `}
                ${Object.entries(teamPhotos).map(([teamId, photo]) => {
                    const teamName = teamNames[teamId] || `Hold ${teamId}`;
                    return photo ? `
                        <div class="summary-photo" onclick="viewPhoto('${photo}', '${teamName}')">
                            <img src="${photo}" alt="${teamName}">
                        </div>
                    ` : `
                        <div class="summary-photo">
                            <div class="summary-photo-placeholder">👥</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function backToCurrentYear() {
    currentViewingYear = null;
    previousYearView.style.display = 'none';
    mainNavigation.style.display = 'block';
}

function deleteSelectedYear() {
    if (!currentViewingYear) return;
    
    if (confirm(`Er du sikker på at du vil slette alle data fra ${currentViewingYear}? Dette kan ikke fortrydes.`)) {
        dataManager.deleteYear(currentViewingYear);
        backToCurrentYear();
        loadPreviousYears();
        showMessage(`Data fra ${currentViewingYear} er slettet`);
    }
}

function exportSelectedYear() {
    if (!currentViewingYear) return;
    
    const yearData = dataManager.getYearData(currentViewingYear);
    const dataStr = JSON.stringify(yearData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakken-${currentViewingYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage(`Data fra ${currentViewingYear} eksporteret`);
}

function viewPhoto(photoSrc, title) {
    // Create simple photo modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = photoSrc;
    img.style.cssText = `
        max-width: 90vw;
        max-height: 90vh;
        border-radius: 10px;
    `;
    
    modal.appendChild(img);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
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

// Refresh status when page becomes visible (user returns from other screens)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        updateNavigationStatus();
    }
});

// Add animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
`;
document.head.appendChild(style);