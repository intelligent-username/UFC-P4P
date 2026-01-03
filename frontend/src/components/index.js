/**
 * UFC P4P Rankings - UI Component Module
 * This module contains reusable UI components for the application
 */

/**
 * Creates and returns the ranking table component
 * @param {Array} rankedFighters - Array of fighter objects to display
 * @param {Array} fighterMetadata - Array of fighter metadata objects
 * @param {number} currentDisplayCount - Number of fighters to display
 * @param {boolean} isAscending - Whether the sort order is ascending
 * @returns {string} HTML markup for the table rows
 */
export function createRankingTable(rankedFighters, fighterMetadata, currentDisplayCount, isAscending) {
    // Calculate the total number of displayed fighters
    const totalFighters = rankedFighters.length;

    // Generate the table rows HTML
    return rankedFighters.slice(0, currentDisplayCount).map((fighter, index) => {
        const metadata = fighterMetadata.find(m => m.fighter_name === fighter.fighter_name) || {};
        const rank = isAscending ? totalFighters - index : index + 1;
        const rawScore = fighter.current_elo ?? fighter.max_elo;
        const eloDisplay = Number.isFinite(rawScore) ? rawScore.toFixed(2) : 'N/A';

        const encodedName = encodeURIComponent(fighter.fighter_name);
        return `
            <tr>
                <td>${rank}</td>
                <td><a href="fighter.html?name=${encodedName}" class="fighter-link">${fighter.fighter_name}</a></td>
                <td>${eloDisplay}</td>
                <td>${metadata.latest_weight_class || 'N/A'}</td>
            </tr>
        `;
    }).join('');
}

/**
 * Creates and populates the filter controls for the rankings
 * @param {Array} weightClasses - Array of available weight classes
 * @param {Function} onWeightClassChange - Callback function for weight class change
 * @param {Function} onRankingTypeChange - Callback function for ranking type change
 */
export function createFilterControls(weightClasses, onRankingTypeChange, onWeightClassChange) {
    // Set up event listeners for the filter controls
    document.getElementById('ranking-type').addEventListener('change', onRankingTypeChange);
    
    // Set up weight class filter
    const dropdown = document.getElementById('weight-class-filter');
    
    // Clear existing options (except the "all" option)
    const allOption = dropdown.querySelector('option[value="all"]');
    dropdown.innerHTML = '';
    dropdown.appendChild(allOption);
    
    // Add weight class options
    weightClasses.forEach(weightClass => {
        const option = document.createElement('option');
        option.value = weightClass;
        option.textContent = weightClass;
        dropdown.appendChild(option);
    });
    
    // Set up event listener
    dropdown.addEventListener('change', onWeightClassChange);
}
