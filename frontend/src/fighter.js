import { getEloHistory } from './utils/eloHistory.js';
import { createEloChart } from './utils/graph.js';

async function loadFighterProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const fighterName = urlParams.get('name');

    if (!fighterName) {
        document.getElementById('fighter-name').textContent = 'Fighter not found';
        document.getElementById('elo-history').innerHTML = '<p>No fighter specified.</p>';
        return;
    }

    // Set the page title
    document.getElementById('fighter-name').textContent = fighterName;
    document.title = `${fighterName} - Fighter Profile`;

    try {
        const eloHistory = await getEloHistory(fighterName);
        
        if (eloHistory && eloHistory.length > 0) {
            // Create canvas for the chart
            const container = document.getElementById('elo-history');
            container.innerHTML = '<canvas id="elo-chart"></canvas>';
            const canvas = document.getElementById('elo-chart');
            createEloChart(canvas, eloHistory);
        } else {
            document.getElementById('elo-history').innerHTML = '<p>No Elo history found for this fighter.</p>';
        }
    } catch (error) {
        console.error('Error loading fighter profile:', error);
        document.getElementById('elo-history').innerHTML = '<p>Error loading Elo history.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadFighterProfile);
