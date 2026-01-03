/**
 * Creates and renders an ELO history line chart
 * @param {HTMLCanvasElement} canvas - The canvas element to render the chart on
 * @param {number[]} data - Array of ELO ratings
 * @returns {Chart} - The Chart.js instance
 */
export function createEloChart(canvas, data) {
    const labels = data.map((_, index) => `Fight ${index + 1}`);
    
    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'ELO Rating',
                data: data,
                borderColor: '#333',
                backgroundColor: 'rgba(51, 51, 51, 0.1)',
                tension: 0.1,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `ELO: ${context.parsed.y.toFixed(2)}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Fight'
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
