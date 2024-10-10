let fighters = [];
let fightHistory = [];
let weightClasses = [];
let fighterMetadata = [];
let currentDisplayCount = 50;
let isAscending = false; // Initially descending order
let loadingMore = false; // Flag to prevent multiple simultaneous loads

async function loadData() {
    try {
        const [fightersResponse, metadataResponse, historyResponse] = await Promise.all([
            fetch('fighters.csv'),
            fetch('fighter_metadata.csv'),
            fetch('elo_history.txt') // Fetch the elo history as a txt file
        ]);

        if (!fightersResponse.ok || !metadataResponse.ok || !historyResponse.ok) {
            throw new Error('Failed to fetch files. Why were they deleted??');
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

        // Extract unique weight classes from metadata & update dropdown
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

    // Sort fighters based on rank order
    rankedFighters = sortFightersByRank(rankedFighters);

    displayRankings(rankedFighters);
}

function sortFightersByRank(fightersArray) {
    // Sort the fighters based on rank (descending by default)
    fightersArray.sort((a, b) => {
        const rankA = a.current_elo || a.max_elo;
        const rankB = b.current_elo || b.max_elo;
        return isAscending ? rankA - rankB : rankB - rankA;
    });
    return fightersArray;
}

function displayRankings(rankedFighters) {
    const rankingBody = document.getElementById('ranking-body');
    
    // Calculate the total number of displayed fighters
    const totalFighters = rankedFighters.length;

    rankingBody.innerHTML = rankedFighters.slice(0, currentDisplayCount).map((fighter, index) => {
        const metadata = fighterMetadata.find(m => m.fighter_name === fighter.fighter_name) || {};
        
        // Determine the rank based on whether sorting is ascending or descending
        const rank = isAscending ? totalFighters - index : index + 1;

        return `
            <tr>
                <td>${rank}</td> <!-- Dynamically assign rank based on sort order -->
                <td>${fighter.fighter_name}</td>
                <td>${(fighter.current_elo || fighter.max_elo).toFixed(2)}</td>
                <td>${metadata.latest_weight_class || 'N/A'}</td>
            </tr>
        `;
    }).join('');

    loadingMore = false;
}

function loadMore() {
    if (loadingMore) return;
    loadingMore = true;
    currentDisplayCount += 20; // Increase the display count by 20
    updateRankings();
}

function handleScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.body.offsetHeight;
    const scrollThreshold = bodyHeight - 200;  // 200px from the bottom

    if (scrollPosition >= scrollThreshold) {
        loadMore();
    }
}

function toggleSortOrder() {
    isAscending = !isAscending;                                             // Toggle sort order
    const rankHeader = document.getElementById('rank-header');
    rankHeader.innerHTML = `Rank ${isAscending ? '&#9650;' : '&#9660;'}`;   // Update the rank header with arrow
    updateRankings();                                                       // Re-render rankings with the new sort order
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();

    // Reset sorting and reload rankings when ranking type or weight class changes
    document.getElementById('ranking-type').addEventListener('change', () => {
        currentDisplayCount = 50;                                               // Reset to initial count
        isAscending = false;                                                    // Reset to descending order
        document.getElementById('rank-header').innerHTML = 'Rank &#9660;';      // Update the header to descending arrow
        updateRankings();
    });
    document.getElementById('weight-class-filter').addEventListener('change', () => {
        currentDisplayCount = 50;                                                  // Reset to initial count
        isAscending = false;                                                       // Reset to descending order
        document.getElementById('rank-header').innerHTML = 'Rank &#9660;';         // Update the header to descending arrow
        updateRankings();
    });

    window.addEventListener('scroll', handleScroll);

    // Add event listener for rank header click to toggle sorting
    document.getElementById('rank-header').addEventListener('click', toggleSortOrder);
});
