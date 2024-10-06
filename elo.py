import csv
import math
import os
from datetime import datetime

# Initialize constants
INITIAL_ELO = 500
K_FACTOR = 30
BONUS_KO_SUB = 0.15
ROUND_BONUS = 0.02

# Read the most recent fight date from file
def get_most_recent_date():
    try:
        with open('latest_fight.txt', 'r') as f:
            return datetime.strptime(f.read().strip(), "%d-%m-%Y")
    except FileNotFoundError:
        return datetime.min  # If no record, return very early date

# Update the most recent fight date
def update_most_recent_date(date):
    with open('latest_fight.txt', 'w') as f:
        f.write(date.strftime("%d-%m-%Y"))

# Function to load fighter Elos into memory
def load_fighters():
    fighters = {}
    try:
        with open('fighters.csv', 'r', newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                fighters[row['fighter_name']] = float(row['current_elo'])
    except FileNotFoundError:
        pass
    return fighters

# Function to save fighter Elos back to file
def save_fighters(fighters):
    with open('fighters.csv', 'w', newline='') as csvfile:
        fieldnames = ['fighter_name', 'current_elo']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for fighter, elo in fighters.items():
            writer.writerow({'fighter_name': fighter, 'current_elo': elo})

# Function to update Elo history
def update_elo_history(fighter_name, new_elo, history_file='elo_history.txt'):
    # Note: Might be confused with elo_history.csv (NONEXISTENT) if there's some mistake in the future
    history_data = {}
    
    # Read current history data
    if os.path.exists(history_file):
        with open(history_file, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.reader(file)
            for row in reader:
                if row:
                    fighter = row[0]
                    elos = [float(elo) for elo in row[1:]]
                    history_data[fighter] = elos
    
    # Update or add Elo for the fighter
    if fighter_name in history_data:
        history_data[fighter_name].append(new_elo)
    else:
        history_data[fighter_name] = [INITIAL_ELO, new_elo]
    
    # Write back the updated history data
    with open(history_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        for fighter, elos in history_data.items():
            writer.writerow([fighter] + elos)
            
# Function to update metadata
def update_fighter_metadata(fighter_name, gender, weight_class):
    metadata = []
    updated = False

    try:
        with open('fighter_metadata.csv', 'r', newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            metadata = list(reader)
    except FileNotFoundError:
        pass

    for fighter in metadata:
        if fighter['fighter_name'] == fighter_name:
            fighter['gender'] = gender
            fighter['latest_weight_class'] = weight_class
            updated = True
            break

    if not updated:
        metadata.append({'fighter_name': fighter_name, 'gender': gender, 'latest_weight_class': weight_class})

    with open('fighter_metadata.csv', 'w', newline='') as csvfile:
        fieldnames = ['fighter_name', 'gender', 'latest_weight_class']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(metadata)

# Calculate expected score based on Elo difference
def expected_score(elo_a, elo_b):
    return 1 / (1 + 10 ** ((elo_b - elo_a) / 400))

# Function to update Elo
def update_elo(fighter_1_elo, fighter_2_elo, result, method, fight_round):
    expected_1 = expected_score(fighter_1_elo, fighter_2_elo)
    
    score_1 = 1 if result == 'win' else 0.5 if result == 'draw' else 0
    elo_change_1 = K_FACTOR * (score_1 - expected_1)
    
    if method in ['KO', 'TKO', 'SUB']:
        round_factor = max(1, 5 - int(fight_round))
        bonus = BONUS_KO_SUB + (ROUND_BONUS * round_factor)
        elo_change_1 += elo_change_1 * bonus

    fighter_1_new_elo = fighter_1_elo + elo_change_1
    fighter_2_new_elo = fighter_2_elo - elo_change_1
    
    return round(fighter_1_new_elo, 2), round(fighter_2_new_elo, 2)

# Process fights from CSV, only after the most recent fight
def process_fights(csv_file):
    most_recent_date = get_most_recent_date()
    fighters = load_fighters()
    latest_fight_date = most_recent_date  # To track the newest fight processed

    with open(csv_file, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            fight_date = datetime.strptime(row['date'], "%d-%m-%Y")
            if fight_date <= most_recent_date:
                continue  # Skip fights already processed

            fighter_1, fighter_2 = row['fighter_1'], row['fighter_2']
            result, method, fight_round = row['result'], row['method'], row['round']
            gender, weight_class = row['gender'], row['weight_class']
            
            # Load current Elo, default to INITIAL_ELO
            fighter_1_elo = fighters.get(fighter_1, INITIAL_ELO)
            fighter_2_elo = fighters.get(fighter_2, INITIAL_ELO)
            
            # Calculate new Elos
            fighter_1_new_elo, fighter_2_new_elo = update_elo(fighter_1_elo, fighter_2_elo, result, method, fight_round)
            
            # Update Elo in memory
            fighters[fighter_1] = fighter_1_new_elo
            fighters[fighter_2] = fighter_2_new_elo
            
            # Update Elo history
            update_elo_history(fighter_1, fighter_1_new_elo)
            update_elo_history(fighter_2, fighter_2_new_elo)
            
            # Update metadata (gender, weight class)
            update_fighter_metadata(fighter_1, gender, weight_class)
            update_fighter_metadata(fighter_2, gender, weight_class)

            # Track latest fight date
            if fight_date > latest_fight_date:
                latest_fight_date = fight_date

    # Save updated fighter Elos
    save_fighters(fighters)

    # Update most recent fight date
    if latest_fight_date > most_recent_date:
        update_most_recent_date(latest_fight_date)


# Main execution
if __name__ == "__main__":
    print("Note: This will take a while to run")
    process_fights('fights.csv')
    print("Elo ratings updated successfully.")