import { formatDateToWords, processEloHistory } from './utils/dataUtils.js';
import { createRankingTable, createFilterControls } from './components/index.js';

let fighters = [];
let fightHistory = [];
let weightClasses = [];
let fighterMetadata = [];
let currentDisplayCount = 50;
let isAscending = false; // Initially descending order
let loadingMore = false; // Flag to prevent multiple simultaneous loads

async function displayLatestEventDate() {
    try {
        const response = await fetch('/data/fights.csv');
        if (!response.ok) {
            throw new Error('Failed to fetch fights.csv');
        }

        const csvText = await response.text();
        const rows = Papa.parse(csvText, { header: true }).data;

        if (rows.length > 1) {
            const latestEvent = rows[rows.length - 2]; // Second last row
            const latestDate = latestEvent.date || "Unknown"; // Extract the date column

            // Convert date to a readable format (e.g., "February 22nd, 2025")
            const formattedDate = formatDateToWords(latestDate);

            // Remove any existing latest event date element to prevent duplicates
            const existingDateElement = document.getElementById("latest-event-date");
            if (existingDateElement) {
                existingDateElement.remove();
            }

            // Create a new paragraph element for displaying the latest event date
            const latestDateElement = document.createElement("p");
            latestDateElement.textContent = `Latest Indexed Event: ${formattedDate}`;
            latestDateElement.id = "latest-event-date"; // Set an ID for styling

            // Insert below the main title
            const titleElement = document.querySelector("h1");
            titleElement.insertAdjacentElement("afterend", latestDateElement);
        }
    } catch (error) {
        console.error("Error fetching latest event date:", error);
    }
}

async function loadData() {
    try {
        const [fightersResponse, metadataResponse, historyResponse] = await Promise.all([
            fetch('/data/fighters.csv'),
            fetch('/data/fighter_metadata.csv'),
            fetch('/data/elo_history.txt')
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

function populateWeightClassDropdown() {
    // Define handlers for filter changes
    const handleRankingTypeChange = () => {
        currentDisplayCount = 50;
        isAscending = false;
        document.getElementById('rank-header').innerHTML = 'Rank &#9660;';
        updateRankings();
    };
    
    const handleWeightClassChange = () => {
        currentDisplayCount = 50;
        isAscending = false;
        document.getElementById('rank-header').innerHTML = 'Rank &#9660;';
        updateRankings();
    };

    // Use the createFilterControls component function to set up the filters
    createFilterControls(
        weightClasses,
        handleRankingTypeChange,
        handleWeightClassChange
    );
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
    
    // Use the createRankingTable component function to generate the table HTML
    rankingBody.innerHTML = createRankingTable(
        rankedFighters, 
        fighterMetadata, 
        currentDisplayCount, 
        isAscending
    );

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
    displayLatestEventDate(); // Call the function to fetch and display the latest event date

    // The event listeners for ranking-type and weight-class-filter are now set in populateWeightClassDropdown
    // using the createFilterControls component

    window.addEventListener('scroll', handleScroll);

    // Event listener for rank header click to toggle sorting
    document.getElementById('rank-header').addEventListener('click', toggleSortOrder);
});
