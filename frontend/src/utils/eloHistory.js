/**
 * Fetches the Elo history for a given fighter from the elo_history.csv file.
 * @param {string} fighterName - The name of the fighter to look up.
 * @returns {Promise<Array<{elo:number,date:string}>>} - Sorted array of Elo entries.
 */
export async function getEloHistory(fighterName) {
    try {
        const response = await fetch('/data/elo_history.csv');
        if (!response.ok) {
            throw new Error('Failed to fetch elo_history.csv');
        }
        
        const data = await response.text();
        const lines = data.split('\n').slice(1); // skip header
        const history = [];

        for (const line of lines) {
            if (!line.trim()) continue;
            const [name, eloStr, date, wl, method, opponent] = line.split(',');
            if (name === fighterName) {
                const eloVal = parseFloat(eloStr);
                if (!Number.isNaN(eloVal) && date) {
                    history.push({ elo: eloVal, date: date.trim(), WL: wl, method: method.trim(), opponent: opponent.trim() });
                }
            }
        }

        history.sort((a, b) => {
            const da = new Date(a.date.split('-').reverse().join('-'));
            const db = new Date(b.date.split('-').reverse().join('-'));
            return da - db;
        });

        return history;
    } catch (error) {
        console.error('Error fetching Elo history:', error);
        return [];
    }
}
