let fighters = [];
let fightHistory = [];
let fighterMetadata = [];
let currentDisplayCount = 50;

// Load data from CSVs using PapaParse
async function loadData() {
    try {
        const [fightersResponse, historyResponse, metadataResponse] = await Promise.all([
            fetch('fighters.csv'),
            fetch('elo_history.csv'),
            fetch('fighter_metadata.csv')
        ]);

        if (!fightersResponse.ok || !historyResponse.ok || !metadataResponse.ok) {
            throw new Error('Failed to fetch CSV files');
        }

        const [fightersData, historyData, metadataData] = await Promise.all([
            fightersResponse.text(),
            historyResponse.text(),
            metadataResponse.text()
        ]);

        fighters = Papa.parse(fightersData, { header: true, dynamicTyping: true }).data;
        fightHistory = Papa.parse(historyData, { header: true, dynamicTyping: true }).data;
        fighterMetadata = Papa.parse(metadataData, { header: true, dynamicTyping: true }).data;

        updateRankings();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('ranking-body').innerHTML = '<tr><td colspan="4">Error loading data. Please try again.</td></tr>';
    }
}

// Function to update the rankings display based on the selected type
function updateRankings() {
    const rankingType = document.getElementById('ranking-type').value;
    const rankingTitle = document.getElementById('ranking-title');

    let rankedFighters;

    if (rankingType === 'current') {
        rankingTitle.textContent = 'Current Rankings';
        rankedFighters = [...fighters].sort((a, b) => b.current_elo - a.current_elo);
    } else {
        rankingTitle.textContent = 'Historical Rankings';
        rankedFighters = fightHistory.reduce((acc, fight) => {
            const existingFighter = acc.find(f => f.fighter_name === fight.fighter_name);
            if (!existingFighter || fight.elo > existingFighter.elo) {
                if (existingFighter) {
                    existingFighter.elo = fight.elo;
                } else {
                    acc.push({ fighter_name: fight.fighter_name, elo: fight.elo });
                }
            }
            return acc;
        }, []).sort((a, b) => b.elo - a.elo);
    }

    displayRankings(rankedFighters);
}

// Function to display fighters in the table
function displayRankings(rankedFighters) {
    const rankingBody = document.getElementById('ranking-body');

    // Clear the table body
    rankingBody.innerHTML = rankedFighters.slice(0, currentDisplayCount).map((fighter, index) => {
        const metadata = fighterMetadata.find(m => m.fighter_name === fighter.fighter_name) || {};
        const weightClass = metadata.latest_weight_class || 'N/A';

        return `
            <tr>
                <td>${index + 1}</td>
                <td>${fighter.fighter_name}</td>
                <td>${(fighter.current_elo || fighter.elo).toFixed(2)}</td>
                <td>${weightClass}</td>
            </tr>
        `;
    }).join('');

    updateLoadMoreButton(rankedFighters.length);
}

// Show/hide the "Load More" button depending on the number of fighters displayed
function updateLoadMoreButton(totalFighters) {
    const loadMoreButton = document.getElementById('load-more');
    if (currentDisplayCount < totalFighters) {
        loadMoreButton.style.display = 'block';
    } else {
        loadMoreButton.style.display = 'none';
    }
}

// Function to load more fighters when "Load More" button is clicked
function loadMore() {
    currentDisplayCount += 20;  // Load 20 more fighters
    updateRankings();
}

// Event listeners for when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('ranking-type').addEventListener('change', () => {
        currentDisplayCount = 50;  // Reset count to 50 on ranking type change
        updateRankings();
    });
    document.getElementById('load-more').addEventListener('click', loadMore);
});
