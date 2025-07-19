// Utility functions for data processing and formatting

export function formatDateToWords(dateStr) {
    if (!dateStr || dateStr === "Unknown") return "Unknown";

    const [day, month, year] = dateStr.split("-");
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayInt = parseInt(day, 10);
    const monthName = monthNames[parseInt(month, 10) - 1];

    const suffixes = ["th", "st", "nd", "rd"];
    const relevantSuffix = (dayInt % 10 > 3 || [11, 12, 13].includes(dayInt)) ? "th" : suffixes[dayInt % 10];

    return `${monthName} ${dayInt}${relevantSuffix}, ${year}`;
}

export function processEloHistory(data) {
    const lines = data.split('\n').filter(line => line.trim());
    const eloMap = new Map();

    lines.forEach(line => {
        const parts = line.split(',').map(item => item.trim());
        const fighterName = parts[0];
        const elos = parts.slice(1).map(Number).filter(elo => !isNaN(elo));

        const maxElo = Math.max(...elos);

        if (!eloMap.has(fighterName) || maxElo > eloMap.get(fighterName)) {
            eloMap.set(fighterName, maxElo);
        }
    });

    return Array.from(eloMap, ([fighter_name, max_elo]) => ({ fighter_name, max_elo }));
}
