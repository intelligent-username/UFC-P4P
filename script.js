let fighters = [];
let fightHistory = [];
let fighterMetadata = [];
let currentDisplayCount = 50;

async function loadData() {
    try {
        const [fightersResponse, metadataResponse, historyResponse] = await Promise.all([
            fetch('fighters.csv'),
            fetch('fighter_metadata.csv'),
            fetch('elo_history.txt') // Fetching the elo history as a text file
        ]);

        if (!fightersResponse.ok || !metadataResponse.ok || !historyResponse.ok) {
            throw new Error('Failed to fetch files');
        }

        const [fightersData, metadataData, historyData] = await Promise.all([
            fightersResponse.text(),
            metadataResponse.text(),
            historyResponse.text()
        ]);

        fighters = Papa.parse(fightersData, { header: true, dynamicTyping: true }).data;
        fighterMetadata = Papa.parse(metadataData, { header: true, dynamicTyping: true }).data;

        // Process elo_history.txt manually
        fightHistory = processEloHistory(historyData);

        updateRankings();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('ranking-body').innerHTML = '<tr><td colspan="4">Error loading data. Please try again.</td></tr>';
    }
}

function processEloHistory(data) {
    const lines = data.split('\n').filter(line => line.trim());
    const historicalElos = [];

    lines.forEach(line => {
        const parts = line.split(',').map(item => item.trim());
        const fighterName = parts[0];
        const elos = parts.slice(1).map(Number).filter(elo => !isNaN(elo));
        const maxElo = Math.max(...elos);
        historicalElos.push({ fighter_name: fighterName, max_elo: maxElo });
    });

    return historicalElos;
}

function updateRankings() {
    const rankingType = document.getElementById('ranking-type').value;
    const rankingTitle = document.getElementById('ranking-title');
    const rankingBody = document.getElementById('ranking-body');
    const weightClassSelect = document.getElementById('weight-class-select');

    let rankedFighters;

    if (rankingType === 'current') {
        rankingTitle.textContent = 'Current Rankings';
        rankedFighters = [...fighters].sort((a, b) => b.current_elo - a.current_elo);
    } else {
        rankingTitle.textContent = 'Historical Rankings';
        const historicalElos = processEloHistory(historyData);
        rankedFighters = historicalElos.sort((a, b) => b.max_elo - a.max_elo);
    }

    // Display all weight classes by default
    const selectedWeightClass = weightClassSelect.value;
    if (selectedWeightClass === 'all') {
        displayRankings(rankedFighters);
    } else {
        // Filter by selected weight class
        const filteredFighters = rankedFighters.filter(fighter => fighter.latest_weight_class === selectedWeightClass);
        displayRankings(filteredFighters);
    }
}

function displayRankings(rankedFighters) {
    const rankingBody = document.getElementById('ranking-body');
    rankingBody.innerHTML = rankedFighters.slice(0, currentDisplayCount).map((fighter, index) => {
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

    updateLoadMoreButton(rankedFighters.length);
}

function updateLoadMoreButton(totalFighters) {
    const loadMoreButton = document.getElementById('load-more');
    if (currentDisplayCount < totalFighters) {
        loadMoreButton.style.display = 'block';
    } else {
        loadMoreButton.style.display = 'none';
    }
}

function loadMore() {
    currentDisplayCount += 20;
    updateRankings();
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('ranking-type').addEventListener('change', () => {
        currentDisplayCount = 50;
        updateRankings();
    });
    document.getElementById('load-more').addEventListener('click', loadMore);
});
