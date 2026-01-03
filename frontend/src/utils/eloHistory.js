/**
 * Fetches the Elo history for a given fighter from the elo_history.txt file.
 * @param {string} fighterName - The name of the fighter to look up.
 * @returns {Promise<number[]|null>} - Array of Elo ratings or null if not found.
 */
export async function getEloHistory(fighterName) {
    try {
        const response = await fetch('/data/elo_history.txt');
        if (!response.ok) {
            throw new Error('Failed to fetch elo_history.txt');
        }
        
        const data = await response.text();
        const lines = data.split('\n');

        for (const line of lines) {
            const [name, ...elos] = line.split(',');
            if (name === fighterName) {
                return elos.map(Number);
            }
        }
        return null; // fighter not found
    } catch (error) {
        console.error('Error fetching Elo history:', error);
        return null;
    }
}
