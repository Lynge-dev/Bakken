// Photo management system
let groupPhoto = null;
let teamPhotos = {
    1: null,
    2: null,
    3: null
};

// Test data - in real app this would come from previous screens
const teams = {
    1: { name: 'Hold 1', members: ['Lars', 'Mette', 'Peter'], score: 15 },
    2: { name: 'Hold 2', members: ['Anna', 'Thomas'], score: 12 },
    3: { name: 'Hold 3', members: ['Sofie', 'Michael'], score: 8 }
};

const completedGames = [
    { name: 'Andedammen', winner: 'Hold 1' },
    { name: 'Dart', winner: 'Hold 2' },
    { name: 'Fodbold', winner: 'Hold 1' }
];

// DOM elements
const modeTabs = document.querySelectorAll('.mode-tab');
const photoModes = document.querySelectorAll('.photo-mode');
const groupPhotoPreview = document.getElementById('groupPhotoPreview');
const allParticipants = document.getElementById('allParticipants');
const teamsPhotoGrid = document.getElementById('teamsPhotoGrid');
const groupFileInput = document.getElementById('groupFileInput');
const teamFileInput = document.getElementById('teamFileInput');
const photoModal = document.getElementById('photoModal');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');

let currentTeamForPhoto = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    renderAllParticipants();
    renderTeamPhotoCards();
    updateGroupPhotoDisplay();
});

function setupEventListeners() {
    // Mode tabs
    modeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            switchMode(this.dataset.mode);
        });
    });

    // Group photo actions
    document.getElementById('takeGroupPhoto').addEventListener('click', function() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            groupFileInput.click();
        } else {
            alert('Kamera ikke tilgængeligt. Brug upload i stedet.');
        }
    });

    document.getElementById('uploadGroupPhoto').addEventListener('click', function() {
        groupFileInput.click();
    });

    document.getElementById('deleteGroupPhoto').addEventListener('click', function() {
        if (confirm('Er du sikker på at du vil slette gruppefotos?')) {
            groupPhoto = null;
            updateGroupPhotoDisplay();
        }
    });

    // File inputs
    groupFileInput.addEventListener('change', handleGroupPhotoUpload);
    teamFileInput.addEventListener('change', handleTeamPhotoUpload);

    // Photo modal
    document.getElementById('closePhotoModal').addEventListener('click', closePhotoModal);
    photoModal.addEventListener('click', function(e) {
        if (e.target === photoModal) {
            closePhotoModal();
        }
    });

    // Export functions
    document.getElementById('exportResults').addEventListener('click', exportResults);
    document.getElementById('exportPhotos').addEventListener('click', exportPhotos);
    document.getElementById('exportComplete').addEventListener('click', exportComplete);

    // Navigation
    document.getElementById('backToGamesBtn').addEventListener('click', function() {
        alert('Går tilbage til spil-siden');
    });

    document.getElementById('homeBtn').addEventListener('click', function() {
        alert('Går til forsiden');
    });
}

function switchMode(mode) {
    // Update tabs
    modeTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // Update content
    photoModes.forEach(modeElement => {
        modeElement.classList.toggle('active', modeElement.id === mode + 'Mode');
    });
}

function renderAllParticipants() {
    const allPlayers = Object.values(teams).flatMap(team => team.members);
    allParticipants.textContent = allPlayers.join(', ');
}

function renderTeamPhotoCards() {
    teamsPhotoGrid.innerHTML = Object.entries(teams).map(([teamId, team]) => `
        <div class="team-photo-card">
            <div class="team-photo-preview" onclick="viewTeamPhoto(${teamId})">
                ${teamPhotos[teamId] ? 
                    `<img src="${teamPhotos[teamId]}" alt="${team.name} foto">` :
                    `<div class="team-photo-placeholder">📷</div>`
                }
            </div>
            <div class="team-photo-info">
                <h3>
                    <span class="team-color-indicator team-${teamId}-color"></span>
                    ${team.name}
                </h3>
                <div class="team-members">${team.members.join(', ')}</div>
                <div class="team-photo-actions">
                    <button class="team-photo-btn camera" onclick="takeTeamPhoto(${teamId})">
                        📷 Tag Foto
                    </button>
                    <button class="team-photo-btn upload" onclick="uploadTeamPhoto(${teamId})">
                        📁 Upload
                    </button>
                    ${teamPhotos[teamId] ? 
                        `<button class="team-photo-btn delete" onclick="deleteTeamPhoto(${teamId})">🗑️ Slet</button>` : 
                        ''
                    }
                </div>
            </div>
        </div>
    `).join('');
}

function updateGroupPhotoDisplay() {
    const deleteBtn = document.getElementById('deleteGroupPhoto');
    
    if (groupPhoto) {
        groupPhotoPreview.innerHTML = `<img src="${groupPhoto}" alt="Gruppefoto">`;
        deleteBtn.style.display = 'inline-block';
    } else {
        groupPhotoPreview.innerHTML = `
            <div class="photo-placeholder">
                <div class="placeholder-icon">📷</div>
                <p>Tag et gruppefoto af alle spillere</p>
                <small>Tryk på kamera-knappen nedenfor</small>
            </div>
        `;
        deleteBtn.style.display = 'none';
    }
}

function handleGroupPhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            groupPhoto = e.target.result;
            updateGroupPhotoDisplay();
            showMessage('Gruppefoto uploaded! 📸');
        };
        reader.readAsDataURL(file);
    }
}

function handleTeamPhotoUpload(event) {
    const file = event.target.files[0];
    if (file && currentTeamForPhoto) {
        const reader = new FileReader();
        reader.onload = function(e) {
            teamPhotos[currentTeamForPhoto] = e.target.result;
            renderTeamPhotoCards();
            showMessage(`${teams[currentTeamForPhoto].name} foto uploaded! 📸`);
            currentTeamForPhoto = null;
        };
        reader.readAsDataURL(file);
    }
}

function takeTeamPhoto(teamId) {
    currentTeamForPhoto = teamId;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        teamFileInput.click();
    } else {
        alert('Kamera ikke tilgængeligt. Brug upload i stedet.');
    }
}

function uploadTeamPhoto(teamId) {
    currentTeamForPhoto = teamId;
    teamFileInput.click();
}

function deleteTeamPhoto(teamId) {
    if (confirm(`Er du sikker på at du vil slette ${teams[teamId].name} foto?`)) {
        teamPhotos[teamId] = null;
        renderTeamPhotoCards();
        showMessage('Foto slettet');
    }
}

function viewTeamPhoto(teamId) {
    if (teamPhotos[teamId]) {
        modalImage.src = teamPhotos[teamId];
        modalTitle.textContent = `${teams[teamId].name} Foto`;
        photoModal.classList.add('active');
    }
}

function viewGroupPhoto() {
    if (groupPhoto) {
        modalImage.src = groupPhoto;
        modalTitle.textContent = 'Gruppefoto';
        photoModal.classList.add('active');
    }
}

function closePhotoModal() {
    photoModal.classList.remove('active');
}

// Export functions
function exportResults() {
    const sortedTeams = Object.entries(teams)
        .sort(([,a], [,b]) => b.score - a.score);
    
    let resultsText = `🎪 HÅNDÆG OG HÅNDBAJERE - RESULTATER\n`;
    resultsText += `=====================================\n\n`;
    
    resultsText += `🏆 SLUTSTILLING:\n`;
    sortedTeams.forEach(([id, team], index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        resultsText += `${medal} ${index + 1}. ${team.name} - ${team.score} point\n`;
        resultsText += `   Spillere: ${team.members.join(', ')}\n\n`;
    });
    
    resultsText += `🎯 GENNEMFØRTE SPIL:\n`;
    completedGames.forEach((game, index) => {
        resultsText += `${index + 1}. ${game.name} - Vinder: ${game.winner}\n`;
    });
    
    resultsText += `\n📅 Dato: ${new Date().toLocaleDateString('da-DK')}\n`;
    
    downloadTextFile(resultsText, 'bakken-resultater.txt');
    showMessage('Resultater eksporteret! 📊');
}

function exportPhotos() {
    // In a real app, you'd create a ZIP file with all photos
    // For now, we'll show what would be included
    let photosList = [];
    
    if (groupPhoto) photosList.push('Gruppefoto.jpg');
    
    Object.entries(teamPhotos).forEach(([teamId, photo]) => {
        if (photo) photosList.push(`${teams[teamId].name}.jpg`);
    });
    
    if (photosList.length === 0) {
        alert('Ingen fotos at eksportere. Tag nogle fotos først!');
        return;
    }
    
    alert(`Ville eksportere ${photosList.length} fotos:\n\n${photosList.join('\n')}\n\n(I en rigtig app ville dette downloade en ZIP fil)`);
}

function exportComplete() {
    generateCompleteReport();
}

function generateCompleteReport() {
    const sortedTeams = Object.entries(teams)
        .sort(([,a], [,b]) => b.score - a.score);
    
    const reportHtml = `
        <!DOCTYPE html>
        <html lang="da">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Håndæg og Håndbajere - Rapport</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .standings { margin-bottom: 30px; }
                .team { padding: 15px; margin: 10px 0; border-radius: 10px; }
                .team.first { background: linear-gradient(90deg, rgba(255,215,0,0.2), #f8f9fa); }
                .team.second { background: linear-gradient(90deg, rgba(192,192,192,0.2), #f8f9fa); }
                .team.third { background: linear-gradient(90deg, rgba(205,127,50,0.2), #f8f9fa); }
                .photos { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
                .photo { text-align: center; }
                .photo img { max-width: 100%; border-radius: 10px; }
                .games { margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎪 Håndæg og Håndbajere</h1>
                <h2>Bakken ${new Date().getFullYear()}</h2>
                <p>Dato: ${new Date().toLocaleDateString('da-DK')}</p>
            </div>
            
            <div class="standings">
                <h2>🏆 Slutstilling</h2>
                ${sortedTeams.map(([id, team], index) => {
                    const positionClass = index === 0 ? 'first' : index === 1 ? 'second' : 'third';
                    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                    return `
                        <div class="team ${positionClass}">
                            <h3>${medal} ${index + 1}. ${team.name} - ${team.score} point</h3>
                            <p>Spillere: ${team.members.join(', ')}</p>
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${(groupPhoto || Object.values(teamPhotos).some(p => p)) ? `
                <div class="photos">
                    <h2>📸 Fotos</h2>
                    ${groupPhoto ? `
                        <div class="photo">
                            <img src="${groupPhoto}" alt="Gruppefoto">
                            <p>Alle sammen</p>
                        </div>
                    ` : ''}
                    ${Object.entries(teamPhotos).map(([teamId, photo]) => 
                        photo ? `
                            <div class="photo">
                                <img src="${photo}" alt="${teams[teamId].name}">
                                <p>${teams[teamId].name}</p>
                            </div>
                        ` : ''
                    ).join('')}
                </div>
            ` : ''}
            
            <div class="games">
                <h2>🎯 Gennemførte Spil</h2>
                <ol>
                    ${completedGames.map(game => `
                        <li>${game.name} - Vinder: ${game.winner}</li>
                    `).join('')}
                </ol>
            </div>
        </body>
        </html>
    `;
    
    // Show preview
    document.getElementById('previewContent').innerHTML = reportHtml;
    document.getElementById('exportPreview').style.display = 'block';
    
    // Setup download
    document.getElementById('downloadReport').onclick = function() {
        downloadTextFile(reportHtml, 'bakken-rapport.html');
    };
    
    document.getElementById('shareReport').onclick = function() {
        if (navigator.share) {
            navigator.share({
                title: 'Håndæg og Håndbajere - Rapport',
                text: 'Se vores Bakken resultater!',
                url: window.location.href
            });
        } else {
            alert('Del funktionen er ikke tilgængelig i denne browser');
        }
    };
    
    showMessage('Rapport genereret! 📋');
}

function downloadTextFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

// Add click handler for group photo preview
groupPhotoPreview.addEventListener('click', viewGroupPhoto);

// Add animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }
`;
document.head.appendChild(style);