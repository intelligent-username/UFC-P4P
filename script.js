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
    const rankingBody = document.getElementById('ranking-body');
    let rankedFighters;

    if (rankingType === 'current') {
        rankingTitle.textContent = 'Current Rankings';
        rankedFighters = [...fighters].sort((a, b) => b.current_elo - a.current_elo);
    } else {
        rankingTitle.textContent = 'Historical Rankings';

        // Find maximum Elo for each fighter in the history data
        const historicalFighterMaxElos = fightHistory.reduce((acc, fight) => {
            const existingFighter = acc.find(f => f.fighter_name === fight.fighter_name);
            const fightElo = fight.elo;
            
            if (!existingFighter) {
                acc.push({ fighter_name: fight.fighter_name, elo: fightElo });
            } else if (fightElo > existingFighter.elo) {
                existingFighter.elo = fightElo;
            }
            return acc;
        }, []);

        // Sort by highest Elo values
        rankedFighters = historicalFighterMaxElos.sort((a, b) => b.elo - a.elo);
    }

    displayRankings(rankedFighters);
}


// Function to display fighters in the table
function displayRankings(rankedFighters) {
    const rankingBody = document.getElementById('ranking-body');
    rankingBody.innerHTML = rankedFighters.slice(0, currentDisplayCount).map((fighter, index) => {
        const metadata = fighterMetadata.find(m => m.fighter_name === fighter.fighter_name) || {};  // Reference to metadata
        
        // Ensure metadata.latest_weight_class is used correctly
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${fighter.fighter_name}</td>
                <td>${(fighter.current_elo || fighter.elo).toFixed(2)}</td>
                <td>${metadata.latest_weight_class || 'N/A'}</td>
            </tr>
        `;
    }).join('');

    updateLoadMoreButton(rankedFighters.length);
}

function loadMore() {
    currentDisplayCount += 20;  // Increase display count
    updateRankings();  // Call function to refresh the display
}

// Make sure the button is visible only when necessary
function updateLoadMoreButton(totalFighters) {
    const loadMoreButton = document.getElementById('load-more');
    if (currentDisplayCount < totalFighters) {
        loadMoreButton.style.display = 'block';
    } else {
        loadMoreButton.style.display = 'none';
    }
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
