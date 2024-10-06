let fighters = [];
let fighterMetadata = [];

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('ranking-type').addEventListener('change', () => {
        updateRankings();
    });
});

function updateRankings() {
    const rankingType = document.getElementById('ranking-type').value;
    const rankingTitle = document.getElementById('ranking-title');
    const rankingBody = document.getElementById('ranking-body');

    let rankedFighters;

    if (rankingType === 'current') {
        rankingTitle.textContent = 'Current Rankings';
        rankedFighters = [...fighters].sort((a, b) => b.current_elo - a.current_elo);
    } else {
        rankingTitle.textContent = 'Historical Rankings';
        const historicalElos = processEloHistory(historyData);
        rankedFighters = historicalElos.sort((a, b) => b.max_elo - a.max_elo);
    }

    displayRankings(rankedFighters);
}

function displayRankings(rankedFighters) {
    const rankingBody = document.getElementById('ranking-body');
    rankingBody.innerHTML = rankedFighters.map((fighter, index) => {
        const metadata = fighterMetadata.find(m => m.fighter_name === fighter.fighter_name) || {};
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${fighter.fighter_name}</td>
                <td>${(fighter.current_elo || fighter.max_elo).toFixed(2)}</td>
                <td>${metadata.latest_weight_class || 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

function loadData() {
    fetch('data/data.json')
        .then(response => response.json())
        .then(data => {
            fighters = data.fighters;
            fighterMetadata = data.fighter_metadata;
        })
        .catch(error => console.error('Error loading data:', error));
}

function processEloHistory(history) {
    return history.map(entry => {
        const fighter = fighters.find(f => f.fighter_name === entry.fighter_name);
        return {
            fighter_name: fighter.fighter_name,
            max_elo: fighter.current_elo,
            date: entry.date
        };
    });
}