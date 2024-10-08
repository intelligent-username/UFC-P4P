# UFC Pound For Pound Rankings

## Rankings Made Scientifically Based on all Previous fights, Performance Metrics, etc

### Process

- Use Python to scrape all fights from ufcstats website
- Add the fights to a csv [fights.csv](/fights.csv), with required information (some information currently not in use, but will be used to implement later features)
- Use an `elo` system to figure out the 'score' ranking of each fighter after each fight
    Note: extra points are awarded for KOs, TKOs, and submissions, as well as even more extra points when they occur before round 5.

- Sort in descending order & display on the page

- Update the data, rankings, etc. as required

### Features

- Current Overall Rankings
- Historical Rankings (all time peak elos)
- Filter by Weight Class

Visit [this webpage](https://intelligent-username.github.io/UFC-P4P/) to view the rankings
