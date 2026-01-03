import { formatDateToWords } from './dataUtils.js';

/**
 * Creates and renders an ELO history line chart
 * @param {HTMLCanvasElement} canvas - The canvas element to render the chart on
 * @param {Array<{name:string, data:Array<{elo:number,date:string,WL:string,method:string,opponent:string}>}>} fighters - Array of fighter histories
 * @returns {Chart} - The Chart.js instance
 */
export function createEloChart(canvas, fighters) {
    // Collect all unique dates
    const allDates = new Set();
    fighters.forEach(fighter => {
        fighter.data.forEach(point => allDates.add(point.date));
    });
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a.split('-').reverse().join('-')) - new Date(b.split('-').reverse().join('-')));
    const labels = sortedDates.map(date => formatDateToWords(date));

    // Colors for different fighters
    const colors = ['#333', '#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

    const datasets = fighters.map((fighter, index) => {
        // Map Elo to dates
        const eloMap = new Map();
        fighter.data.forEach(point => eloMap.set(point.date, point.elo));
        
        let lastElo = 500; // Initial Elo
        const values = sortedDates.map(date => {
            if (eloMap.has(date)) {
                lastElo = eloMap.get(date);
            }
            return lastElo;
        });

        return {
            label: fighter.name,
            data: values,
            borderColor: colors[index % colors.length],
            backgroundColor: colors[index % colors.length].replace('rgb', 'rgba').replace(')', ', 0.1)'),
            tension: 0.1,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 4
        };
    });

    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const datasetIndex = context.datasetIndex;
                            const dataIndex = context.dataIndex;
                            const fighter = fighters[datasetIndex];
                            const date = sortedDates[dataIndex];
                            const point = fighter.data.find(p => p.date === date);
                            if (point) {
                                return [
                                    `${fighter.name}: ${context.parsed.y.toFixed(2)}`,
                                    `Opponent: ${point.opponent}`,
                                    `Result: ${point.WL} (${point.method})`
                                ];
                            } else {
                                return `${fighter.name}: ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'ELO'
                    }
                }
            }
        }
    });
}
