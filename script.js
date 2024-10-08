let fighters = [];
let fightHistory = [];
let fighterMetadata = [];
let currentDisplayCount = 50; // Start with 50 fighters to display
let additionalDisplayCount = 20; // Initial additional count for Load More button
let weightClasses = []; // To hold all unique weight classes

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

        // Extract unique weight classes from metadata and update dropdown
        weightClasses = Array.from(new Set(fighterMetadata.map(f => f.latest_weight_class))).filter(Boolean);
        populateWeightClassDropdown();

        updateRankings();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('ranking-body').innerHTML = '<tr><td colspan="4">Error loading data. Please try again.</td></tr>';
    }
}

function processEloHistory(data) {
    const lines = data.split('\n').filter(line => line.trim()); // Remove empty lines
    const eloMap = new Map(); // Use a map to store max Elo for each fighter

    lines.forEach(line => {
        const parts = line.split(',').map(item => item.trim());
        const fighterName = parts[0]; // Fighter's name is the first part
        const elos = parts.slice(1).map(Number).filter(elo => !isNaN(elo)); // Convert ELOs to numbers

        const maxElo = Math.max(...elos); // Find the maximum ELO

        // Update the map with the maximum Elo
        if (!eloMap.has(fighterName) || maxElo > eloMap.get(fighterName)) {
            eloMap.set(fighterName, maxElo);
        }
    });

    // Convert the map to an array of objects for easy processing later
    return Array.from(eloMap, ([fighter_name, max_elo]) => ({ fighter_name, max_elo }));
}

function populateWeightClassDropdown() {
    const dropdown = document.getElementById('weight-class-filter');
    weightClasses.forEach(weightClass => {
        const option = document.createElement('option');
        option.value = weightClass;
        option.textContent = weightClass;
        dropdown.appendChild(option);
    });
}

function updateRankings() {
    const rankingType = document.getElementById('ranking-type').value;
    const weightClassFilter = document.getElementById('weight-class-filter').value;
    const rankingTitle = document.getElementById('ranking-title');

    let rankedFighters;

    if (rankingType === 'current') {
        rankingTitle.textContent = 'Current Rankings';
        rankedFighters = [...fighters].sort((a, b) => b.current_elo - a.current_elo);
    } else {
        rankingTitle.textContent = 'Historical Rankings';
        rankedFighters = [...fightHistory].sort((a, b) => b.max_elo - a.max_elo); // Sort by max_elo
    }

    // Filter fighters by weight class if selected
    if (weightClassFilter !== 'all') {
        rankedFighters = rankedFighters.filter(fighter => {
            const metadata = fighterMetadata.find(m => m.fighter_name === fighter.fighter_name);
            return metadata && metadata.latest_weight_class === weightClassFilter;
        });
    }

    displayRankings(rankedFighters);
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
    currentDisplayCount += additionalDisplayCount; // Increase the display count
    additionalDisplayCount = Math.ceil(additionalDisplayCount * 1.5); // Increase the additional count by 50%
    updateRankings();
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('ranking-type').addEventListener('change', () => {
        currentDisplayCount = 50; // Reset to initial count
        additionalDisplayCount = 20; // Reset additional count
        updateRankings();
    });
    document.getElementById('weight-class-filter').addEventListener('change', () => {
        currentDisplayCount = 50; // Reset to initial count
        additionalDisplayCount = 20; // Reset additional count
        updateRankings();
    });
    document.getElementById('load-more').addEventListener('click', loadMore);
});
