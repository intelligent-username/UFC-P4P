import { getEloHistory } from './utils/eloHistory.js';
import { createEloChart } from './utils/graph.js';

let currentFighter = '';
let fighterHistories = [];
let allFighters = [];

async function loadFighterProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const fighterName = urlParams.get('name');

    if (!fighterName) {
        document.getElementById('fighter-name').textContent = 'Fighter not found';
        document.getElementById('elo-history').innerHTML = '<p>No fighter specified.</p>';
        return;
    }

    currentFighter = fighterName;
    document.getElementById('fighter-name').textContent = fighterName;
    document.title = `${fighterName} - Fighter Profile`;

    try {
        // Load fighter list for search
        if (allFighters.length === 0) {
            const fightersResponse = await fetch('/data/fighters.csv');
            const fightersData = await fightersResponse.text();
            const fightersRows = fightersData.split('\n').slice(1);
            allFighters = fightersRows.map(row => {
                const cols = row.split(',');
                return { name: cols[0], elo: parseFloat(cols[1]) || 0 };
            }).filter(f => f.name && f.name !== currentFighter);
        }

        const eloHistory = await getEloHistory(fighterName);
        
        if (eloHistory && eloHistory.length > 0) {
            fighterHistories = [{ name: fighterName, data: eloHistory }];
            renderChart();
        } else {
            document.getElementById('elo-history').innerHTML = '<p>No Elo history found for this fighter.</p>';
        }
    } catch (error) {
        console.error('Error loading fighter profile:', error);
        document.getElementById('elo-history').innerHTML = '<p>Error loading Elo history.</p>';
    }
}

function renderChart() {
    const container = document.getElementById('elo-history');
    let html = '';
    if (fighterHistories.length > 1) {
        html += '<div id="compared-fighters" style="margin-bottom: 10px;">Comparing to: ';
        fighterHistories.slice(1).forEach((fighter, index) => {
            html += `<span style="margin-right: 10px;">${fighter.name} <button class="remove-fighter" data-index="${index + 1}" style="background: none; border: none; color: red; cursor: pointer; font-size: 16px;">×</button></span>`;
        });
        html += '</div>';
    }
    html += '<canvas id="elo-chart"></canvas>';
    container.innerHTML = html;
    const canvas = document.getElementById('elo-chart');
    createEloChart(canvas, fighterHistories);

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-fighter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            fighterHistories.splice(index, 1);
            renderChart();
        });
    });
}

async function addCompareFighter(fighterName) {
    try {
        const history = await getEloHistory(fighterName);
        if (history && history.length > 0) {
            fighterHistories.push({ name: fighterName, data: history });
            renderChart();
        }
    } catch (error) {
        console.error('Error loading compare fighter:', error);
    }
}

function setupCompare() {
    const compareBtn = document.getElementById('compare-btn');
    const compareContainer = document.getElementById('compare-container');
    const searchInput = document.getElementById('compare-search');
    const resultsDiv = document.getElementById('compare-results');
    const closeBtn = document.getElementById('close-compare');

    compareBtn.addEventListener('click', () => {
        const isVisible = compareContainer.style.display !== 'none';
        compareContainer.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            searchInput.focus();
        }
    });

    closeBtn.addEventListener('click', () => {
        compareContainer.style.display = 'none';
        searchInput.value = '';
        resultsDiv.style.display = 'none';
    });

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) {
            resultsDiv.style.display = 'none';
            return;
        }
        const matches = allFighters.filter(f => f.name.toLowerCase().includes(query))
            .sort((a, b) => {
                const aIndex = a.name.toLowerCase().indexOf(query);
                const bIndex = b.name.toLowerCase().indexOf(query);
                if (aIndex !== bIndex) return aIndex - bIndex;
                return b.elo - a.elo;
            })
            .slice(0, 10);
        resultsDiv.innerHTML = matches.map(f => `<div class="compare-result" data-name="${f.name}">${f.name}</div>`).join('');
        resultsDiv.style.display = 'block';
    });

    resultsDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('compare-result')) {
            const name = e.target.dataset.name;
            addCompareFighter(name);
            compareContainer.style.display = 'none';
            searchInput.value = '';
            resultsDiv.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadFighterProfile();
    setupCompare();
});
