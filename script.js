// Global variables to store data
let fighters = [];
let fightHistory = [];
let metadata = [];

// Function to load CSV data
async function loadData() {
    const fightersData = await fetch('fighters.csv').then(response => response.text());
    const historyData = await fetch('elo_history.csv').then(response => response.text());
    const metadataData = await fetch('fighter_metadata.csv').then(response => response.text());

    fighters = Papa.parse(fightersData, { header: true }).data;
    fightHistory = Papa.parse(historyData, { header: true }).data;
    metadata = Papa.parse(metadataData, { header: true }).data;

    displayCurrentRankings();
}

// Function to display current rankings
function displayCurrentRankings() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h2>Current Rankings</h2>
        <div class="filters">
            <select id="weightClassFilter">
                <option value="all">All Weight Classes</option>
                ${[...new Set(metadata.map(m => m.latest_weight_class))].map(wc => `<option value="${wc}">${wc}</option>`).join('')}
            </select>
            <select id="genderFilter">
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
        </div>
    `;

    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Elo Rating</th>
            <th>Weight Class</th>
            <th>Gender</th>
        </tr>
    `;

    content.appendChild(table);

    function updateTable() {
        const weightClass = document.getElementById('weightClassFilter').value;
        const gender = document.getElementById('genderFilter').value;

        let filteredFighters = fighters;
        if (weightClass !== 'all' || gender !== 'all') {
            filteredFighters = fighters.filter(fighter => {
                const fighterMetadata = metadata.find(m => m.fighter_name === fighter.fighter_name);
                return (weightClass === 'all' || fighterMetadata.latest_weight_class === weightClass) &&
                       (gender === 'all' || fighterMetadata.gender === gender);
            });
        }

        const sortedFighters = filteredFighters.sort((a, b) => b.current_elo - a.current_elo);

        table.innerHTML = `
            <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Elo Rating</th>
                <th>Weight Class</th>
                <th>Gender</th>
            </tr>
        `;

        sortedFighters.forEach((fighter, index) => {
            const fighterMetadata = metadata.find(m => m.fighter_name === fighter.fighter_name);
            table.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${fighter.fighter_name}</td>
                    <td>${fighter.current_elo}</td>
                    <td>${fighterMetadata ? fighterMetadata.latest_weight_class : 'N/A'}</td>
                    <td>${fighterMetadata ? fighterMetadata.gender : 'N/A'}</td>
                </tr>
            `;
        });
    }

    document.getElementById('weightClassFilter').addEventListener('change', updateTable);
    document.getElementById('genderFilter').addEventListener('change', updateTable);

    updateTable();
}

// Function to display historical rankings
function displayHistoricalRankings() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h2>Historical Rankings</h2>
        <div class="filters">
            <select id="yearFilter">
                ${[...new Set(fightHistory.map(f => new Date(f.date).getFullYear()))].sort().map(year => `<option value="${year}">${year}</option>`).join('')}
            </select>
        </div>
        <canvas id="historicalChart"></canvas>
    `;

    function updateChart() {
        const selectedYear = document.getElementById('yearFilter').value;
        const relevantHistory = fightHistory.filter(f => new Date(f.date).getFullYear() <= selectedYear);

        const topFighters = relevantHistory.sort((a, b) => b.elo - a.elo).slice(0, 10);

        const ctx = document.getElementById('historicalChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: topFighters.map(f => f.fighter_name),
                datasets: [{
                    label: 'Elo Rating',
                    data: topFighters.map(f => f.elo),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    document.getElementById('yearFilter').addEventListener('change', updateChart);
    updateChart();
}

// Function to display fighter profiles
function displayFighterProfiles() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h2>Fighter Profiles</h2>
        <select id="fighterSelect">
            ${fighters.map(f => `<option value="${f.fighter_name}">${f.fighter_name}</option>`).join('')}
        </select>
        <div id="fighterProfile"></div>
        <canvas id="eloHistoryChart"></canvas>
    `;

    function updateProfile() {
        const selectedFighter = document.getElementById('fighterSelect').value;
        const fighter = fighters.find(f => f.fighter_name === selectedFighter);
        const fighterMetadata = metadata.find(m => m.fighter_name === selectedFighter);
        const fighterHistory = fightHistory.filter(f => f.fighter_name === selectedFighter);

        document.getElementById('fighterProfile').innerHTML = `
            <h3>${fighter.fighter_name}</h3>
            <p>Current Elo: ${fighter.current_elo}</p>
            <p>Weight Class: ${fighterMetadata ? fighterMetadata.latest_weight_class : 'N/A'}</p>
            <p>Gender: ${fighterMetadata ? fighterMetadata.gender : 'N/A'}</p>
        `;

        const ctx = document.getElementById('eloHistoryChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: fighterHistory.map(f => f.date),
                datasets: [{
                    label: 'Elo Rating',
                    data: fighterHistory.map(f => f.elo),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    document.getElementById('fighterSelect').addEventListener('change', updateProfile);
    updateProfile();
}

// Function to display weight class comparisons
function displayWeightClassComparisons() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h2>Weight Class Comparisons</h2>
        <canvas id="weightClassChart"></canvas>
    `;

    const weightClasses = [...new Set(metadata.map(m => m.latest_weight_class))];
    const weightClassData = weightClasses.map(wc => {
        const fightersInClass = fighters.filter(f => {
            const fighterMetadata = metadata.find(m => m.fighter_name === f.fighter_name);
            return fighterMetadata && fighterMetadata.latest_weight_class === wc;
        });
        return {
            weightClass: wc,
            averageElo: fightersInClass.reduce((sum, f) => sum + parseFloat(f.current_elo), 0) / fightersInClass.length
        };
    });

    const ctx = document.getElementById('weightClassChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: weightClassData.map(d => d.weightClass),
            datasets: [{
                label: 'Average Elo Rating',
                data: weightClassData.map(d => d.averageElo),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Function to display gender comparisons
function displayGenderComparisons() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h2>Gender Comparisons</h2>
        <canvas id="genderChart"></canvas>
    `;

    const genderData = ['Male', 'Female'].map(gender => {
        const fightersOfGender = fighters.filter(f => {
            const fighterMetadata = metadata.find(m => m.fighter_name === f.fighter_name);
            return fighterMetadata && fighterMetadata.gender === gender;
        });
        return {
            gender: gender,
            averageElo: fightersOfGender.reduce((sum, f) => sum + parseFloat(f.current_elo), 0) / fightersOfGender.length
        };
    });

    const ctx = document.getElementById('genderChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: genderData.map(d => d.gender),
            datasets: [{
                label: 'Average Elo Rating',
                data: genderData.map(d => d.averageElo),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Function to display about page
function displayAbout() {
    const content = document.getElementById('content');
    content.innerHTML = `
        <h2>About MMA Elo Rankings</h2>
        <p>This project aims to provide Elo rankings for MMA fighters based on their performance history.</p>
        <p>The Elo rating system is used to calculate relative skill levels in competitor-versus-competitor games.</p>
    `;
}

// Event listener for navigation
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('href').substring(1);

            switch (section) {
                case 'current-rankings':
                    displayCurrentRankings();
                    break;
                case 'historical-rankings':
                    displayHistoricalRankings();
                    break;
                case 'fighter-profiles':
                    displayFighterProfiles();
                    break;
                case 'weight-class-comparisons':
                    displayWeightClassComparisons();
                    break;
                case 'gender-comparisons':
                    displayGenderComparisons();
                    break;
                case 'about':
                    displayAbout();
                    break;
                default:
                    displayCurrentRankings(); // Default to current rankings if none match
            }
        });
    });
});
