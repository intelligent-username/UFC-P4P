let fighters = [];
let fightHistory = [];

async function loadData() {
    const fightersData = await fetch('fighters.csv').then(response => response.text());
    const historyData = await fetch('elo_history.csv').then(response => response.text());

    fighters = Papa.parse(fightersData, { header: true }).data;
    fightHistory = Papa.parse(historyData, { header: true }).data;

    updateRankings();
}

function updateRankings() {
    const rankingType = document.getElementById('ranking-type').value;
    const rankingTitle = document.getElementById('ranking-title');
    const rankingBody = document.getElementById('ranking-body');

    let rankedFighters;

    if (rankingType === 'current') {
        rankingTitle.textContent = 'Current Rankings';
        rankedFighters = fighters.sort((a, b) => b.current_elo - a.current_elo);
    } else {
        rankingTitle.textContent = 'Historical Rankings';
        rankedFighters = fightHistory.reduce((acc, fight) => {
            const existingFighter = acc.find(f => f.fighter_name === fight.fighter_name);
            if (!existingFighter || parseFloat(fight.elo) > parseFloat(existingFighter.elo)) {
                if (existingFighter) {
                    existingFighter.elo = fight.elo;
                } else {
                    acc.push({ fighter_name: fight.fighter_name, elo: fight.elo });
                }
            }
            return acc;
        }, []).sort((a, b) => b.elo - a.elo);
    }

    rankingBody.innerHTML = rankedFighters.slice(0, 10).map((fighter, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${fighter.fighter_name}</td>
            <td>${parseFloat(fighter.current_elo || fighter.elo).toFixed(2)}</td>
            <td>${fighter.weight_class || 'N/A'}</td>
        </tr>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    document.getElementById('ranking-type').addEventListener('change', updateRankings);
});