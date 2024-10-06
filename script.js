function loadData() {
    const fighterCsvUrl = 'fighters.csv';
    const metadataCsvUrl = 'fighter_metadata.csv';
    const eloHistoryUrl = 'elo_history.txt';

    Promise.all([
        fetch(fighterCsvUrl).then(response => response.text()),
        fetch(metadataCsvUrl).then(response => response.text()),
        fetch(eloHistoryUrl).then(response => response.text())
    ]).then(([fightersCsv, metadataCsv, eloHistory]) => {
        const fighters = parseCsv(fightersCsv);
        const fighterMetadata = parseCsv(metadataCsv);
        const eloHistoryData = parseEloHistory(eloHistory);

        // Merge the data
        const mergedData = fighters.map(fighter => {
            const metadata = fighterMetadata.find(m => m.fighter_name === fighter.fighter_name);
            const eloHistory = eloHistoryData.find(h => h.fighter_name === fighter.fighter_name);
            return { ...fighter, ...metadata, ...eloHistory };
        });

        // Update the global variables
        fighters = mergedData;
        fighterMetadata = mergedData;
    }).catch(error => {
        console.error('Error loading data:', error);
        alert('Error loading data. Please try again.');
    });
}

function parseCsv(csvText) {
    const rows = csvText.split('\n');
    const headers = rows.shift().split(',');
    return rows.map(row => {
        const values = row.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    });
}

function parseEloHistory(eloHistoryText) {
    const rows = eloHistoryText.split('\n');
    return rows.map(row => {
        const values = row.split(',');
        return {
            fighter_name: values.shift(),
            elos: values.map(Number)
        };
    });
}