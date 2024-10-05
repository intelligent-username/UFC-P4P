import sqlite3
import csv
import math

# Initialize constants
INITIAL_ELO = 500
K_FACTOR = 20
BONUS_KO_SUB = 0.15  # 15% bonus KO/TKO or Submission
ROUND_BONUS = 0.02   # 2% bonus for each round before round 5

# Connect to SQLite database (creates file if it doesn't exist)
conn = sqlite3.connect('elo_database.db')
cursor = conn.cursor()

# Fighter Elo ratings
cursor.execute('''
CREATE TABLE IF NOT EXISTS fighters (
    fighter_name TEXT PRIMARY KEY,
    elo REAL
)
''')

# Storing fight history
cursor.execute('''
CREATE TABLE IF NOT EXISTS fight_history (
    event TEXT,
    fighter_1 TEXT,
    fighter_2 TEXT,
    fighter_1_elo REAL,
    fighter_2_elo REAL,
    result TEXT,
    method TEXT,
    round TEXT,
    date TEXT
)
''')

# Function to get or initialize fighter Elo
def get_fighter_elo(fighter_name):
    cursor.execute("SELECT elo FROM fighters WHERE fighter_name=?", (fighter_name,))
    row = cursor.fetchone()
    if row is None:
        # Fighter doesn't exist in the database, so insert with INITIAL_ELO
        cursor.execute("INSERT INTO fighters (fighter_name, elo) VALUES (?, ?)", (fighter_name, INITIAL_ELO))
        conn.commit()
        return INITIAL_ELO
    return row[0]

# Function to update fighter Elo in the database
def update_fighter_elo(fighter_name, new_elo):
    cursor.execute("UPDATE fighters SET elo=? WHERE fighter_name=?", (new_elo, fighter_name))
    conn.commit()

# Function to calculate expected score based on Elo difference
def expected_score(elo_a, elo_b):
    return 1 / (1 + 10 ** ((elo_b - elo_a) / 400))

# Function to update Elo based on result, with KO/Submission bonuses
def update_elo(fighter_1_elo, fighter_2_elo, result, method, fight_round):
    expected_1 = expected_score(fighter_1_elo, fighter_2_elo)
    
    if result == 'win':  # Fighter 1 wins
        score_1 = 1
    elif result == 'draw':  # Draw
        score_1 = 0.5
    else:  # Fighter 1 loses
        score_1 = 0
    
    # Calculate Elo change using the K-factor
    elo_change_1 = K_FACTOR * (score_1 - expected_1)
    
    # Apply bonuses for KO/TKO/Sub and round bonuses
    if method in ['KO', 'TKO', 'SUB']:
        round_factor = max(1, 5 - int(fight_round))  # Rounds before round 5 get bonus
        bonus = BONUS_KO_SUB + (ROUND_BONUS * round_factor)
        elo_change_1 += elo_change_1 * bonus

    # Update both fighter's Elos
    fighter_1_new_elo = fighter_1_elo + elo_change_1
    fighter_2_new_elo = fighter_2_elo - elo_change_1
    
    return round(fighter_1_new_elo, 2), round(fighter_2_new_elo, 2)

# Function to process fights from the CSV file
def process_fights(csv_file):
    with open(csv_file, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            fighter_1 = row['fighter_1']
            fighter_2 = row['fighter_2']
            result = row['result']  # 'win' for fighter_1, 'draw' for a tie
            method = row['method']  # KO, TKO, SUB, etc.
            fight_round = row['round']
            event = row['event']
            date = row['date']
            
            # Get current Elo for both fighters
            fighter_1_elo = get_fighter_elo(fighter_1)
            fighter_2_elo = get_fighter_elo(fighter_2)
            
            # Update Elo based on the fight result
            fighter_1_new_elo, fighter_2_new_elo = update_elo(fighter_1_elo, fighter_2_elo, result, method, fight_round)
            
            # Update Elo ratings in the database
            update_fighter_elo(fighter_1, fighter_1_new_elo)
            update_fighter_elo(fighter_2, fighter_2_new_elo)
            
            # Insert fight details into fight history
            cursor.execute('''
                INSERT INTO fight_history (event, fighter_1, fighter_2, fighter_1_elo, fighter_2_elo, result, method, round, date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (event, fighter_1, fighter_2, fighter_1_new_elo, fighter_2_new_elo, result, method, fight_round, date))
            conn.commit()

process_fights('fights.csv')

def get_fighter_current_elo(fighter_name):
    cursor.execute("SELECT elo FROM fighters WHERE fighter_name=?", (fighter_name,))
    row = cursor.fetchone()
    if row:
        return f"{fighter_name}'s current Elo rating is {row[0]}"
    else:
        return f"{fighter_name} does not exist in the database."

print(get_fighter_current_elo("Conor McGregor"))

conn.close()
