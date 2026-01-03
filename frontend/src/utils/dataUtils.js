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

export function processEloHistory(csvText) {
    const lines = csvText.split('\n').slice(1).filter(line => line.trim());
    const eloMap = new Map();

    lines.forEach(line => {
        const [fighterName, eloStr] = line.split(',').map(item => item && item.trim());
        const elo = parseFloat(eloStr);
        if (!fighterName || Number.isNaN(elo)) return;

        const currentMax = eloMap.get(fighterName);
        if (currentMax === undefined || elo > currentMax) {
            eloMap.set(fighterName, elo);
        }
    });

    return Array.from(eloMap, ([fighter_name, max_elo]) => ({ fighter_name, max_elo }));
}
