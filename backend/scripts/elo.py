import os
import csv
from datetime import datetime

# Update paths to use the frontend public data directory
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data')

# Important Constants
K_FACTOR = 30
INITIAL_ELO = 500
ROUND_BONUS = 0.02
BONUS_KO_SUB = 0.15

def get_most_recent_date_and_line():
    """
    Find the most recent fight date and most recent line number in fights.csv
    BY LOOKING AT 'latest_fight.txt'.
    
    Returns:
        tuple: (datetime object of most recent date, int of most recent line number)
    """
    latest_fight_file = os.path.join(DATA_DIR, 'latest_fight.txt')
    
    try:
        with open(latest_fight_file, 'r') as f:
            lines = f.readlines()
            most_recent_date = datetime.strptime(lines[0].strip(), "%d-%m-%Y")
            most_recent_line = int(lines[1].strip())
            return most_recent_date, most_recent_line
    except FileNotFoundError:
        return datetime.min, 0  # If no record, return very early date and line 0

def update_most_recent_date_and_line(date, line):
    """
    Update 'latest_fight.txt' with the most recent fight date and line number.
    
    Args:
        date (datetime): The date of the most recent fight.
        line (int): The line number of the most recent fight in the CSV.
    
    """
    latest_fight_file = os.path.join(DATA_DIR, 'latest_fight.txt')
    
    with open(latest_fight_file, 'w', encoding='utf-8') as f:
        f.write(date.strftime("%d-%m-%Y") + '\n')
        f.write(str(line) + '\n')

def update_most_recent_date(date):
    """
    Update 'latest_fight.txt' with the most recent fight date.
    
    Args:
        date (datetime): The date of the most recent fight.
    """
    latest_fight_file = os.path.join(DATA_DIR, 'latest_fight.txt')
    
    with open(latest_fight_file, 'w', encoding='utf-8') as f:
        f.write(date.strftime("%d-%m-%Y"))

def load_fighters():
    """
    Load fighter Elo ratings from 'fighters.csv'.
    
    Returns:
        dict: A dictionary with fighter names as keys and their Elo ratings as values.
    """
    fighters_file = os.path.join(DATA_DIR, 'fighters.csv')
    
    fighters = {}
    try:
        with open(fighters_file, 'r', newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                fighters[row['fighter_name']] = float(row['current_elo'])
    except FileNotFoundError:
        pass
    return fighters

def save_fighters(fighters):
    """
    Save fighter Elo ratings to 'fighters.csv'.
    
    Args:
        fighters (dict): A dictionary with fighter names as keys and their Elo ratings as values.
    """
    fighters_file = os.path.join(DATA_DIR, 'fighters.csv')
    
    with open(fighters_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['fighter_name', 'current_elo']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for fighter, elo in fighters.items():
            writer.writerow({'fighter_name': fighter, 'current_elo': elo})

def update_elo_history(fighter_name, new_elo, history_file=None):
    """
    Update the Elo history for a fighter in 'elo_history.txt'.
    
    Args:
        fighter_name (str): The name of the fighter.
        new_elo (float): The new Elo rating for the fighter.
        history_file (str, optional): The file to store Elo history. Defaults to 'elo_history.txt'.
    """
    if history_file is None:
        history_file = os.path.join(DATA_DIR, 'elo_history.txt')
    
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
            
def update_fighter_metadata(fighter_name, gender, weight_class):
    """
    Update or add metadata for a fighter in 'fighter_metadata.csv'.
    In case of weight class change

    Args:
        fighter_name (str): The name of the fighter.
        gender (str): The gender of the fighter.
        weight_class (str): The weight class of the fighter.
    """
    metadata_file = os.path.join(DATA_DIR, 'fighter_metadata.csv')
    
    metadata = []
    updated = False

    try:
        with open(metadata_file, 'r', newline='') as csvfile:
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

    with open(metadata_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['fighter_name', 'gender', 'latest_weight_class']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(metadata)

def expected_score(elo_a, elo_b):
    """
    Use the Formula: 1 / (1 + 10 ** ((elo_b - elo_a) / 400)) 
    & Calculate the expected score based on Elo difference.
    
    Args:
        elo_a (float): Elo rating of fighter A.
        elo_b (float): Elo rating of fighter B.
    
    Returns:
        float: The expected score for fighter A.
    """

    return 1 / (1 + 10 ** ((elo_b - elo_a) / 400))

def update_elo(fighter_1_elo, fighter_2_elo, result, method, fight_round):
    """
    Update Elo ratings for two fighters based on fight result.
    
    Args:
        fighter_1_elo (float): Current Elo rating of fighter 1.
        fighter_2_elo (float): Current Elo rating of fighter 2.
        result (str): The result of the fight ('win', 'loss', or 'draw').
        method (str): The method of victory (e.g., 'KO', 'TKO', 'SUB', 'DEC').
        fight_round (str): The round in which the fight ended.
    
    Returns:
        tuple: (new_elo_fighter_1, new_elo_fighter_2)
    """
        
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

def process_fights(csv_file):
    """
    Process fights from a CSV file and update Elo ratings.
    
    Args:
        csv_file (str): Path to the CSV file containing fight data.
    """

    most_recent_date, most_recent_line = get_most_recent_date_and_line()
    fighters = load_fighters()
    latest_fight_date = most_recent_date  # To track the newest fight processed
    current_line = 0  # Line tracker

    # Load elo history and metadata once at the start
    history_file = os.path.join(DATA_DIR, 'elo_history.txt')
    history_data = {}
    if os.path.exists(history_file):
        with open(history_file, mode='r', newline='', encoding='utf-8') as file:
            reader = csv.reader(file)
            for row in reader:
                if row:
                    fighter = row[0]
                    elos = [float(elo) for elo in row[1:]]
                    history_data[fighter] = elos

    metadata_file = os.path.join(DATA_DIR, 'fighter_metadata.csv')
    metadata = {}
    try:
        with open(metadata_file, 'r', newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                metadata[row['fighter_name']] = row
    except FileNotFoundError:
        pass

    with open(csv_file, 'r', newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            current_line += 1
            
            # Keep skipping until we reach the line after the last processed one
            if current_line <= most_recent_line:
                continue
            
            fight_date = datetime.strptime(row['date'], "%d-%m-%Y")
            
            # Update fighter data and Elo ratings
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
            
            # Update Elo history in memory
            if fighter_1 in history_data:
                history_data[fighter_1].append(fighter_1_new_elo)
            else:
                history_data[fighter_1] = [INITIAL_ELO, fighter_1_new_elo]
            
            if fighter_2 in history_data:
                history_data[fighter_2].append(fighter_2_new_elo)
            else:
                history_data[fighter_2] = [INITIAL_ELO, fighter_2_new_elo]
            
            # Update metadata in memory
            metadata[fighter_1] = {'fighter_name': fighter_1, 'gender': gender, 'latest_weight_class': weight_class}
            metadata[fighter_2] = {'fighter_name': fighter_2, 'gender': gender, 'latest_weight_class': weight_class}

            # Track latest fight date
            if fight_date > latest_fight_date:
                latest_fight_date = fight_date

    # Save all updates to disk at the end
    save_fighters(fighters)

    # Write elo history once
    with open(history_file, mode='w', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        for fighter, elos in history_data.items():
            writer.writerow([fighter] + elos)

    # Write metadata once
    with open(metadata_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['fighter_name', 'gender', 'latest_weight_class']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(metadata.values())

    # Update most recent fight date and line number
    if latest_fight_date > most_recent_date:
        update_most_recent_date_and_line(latest_fight_date, current_line)

# Run
if __name__ == "__main__":

    print("[ELO] Updating Elo ratings...")

    print("(Note: This will take a while if running for the first time)")

    # Use the data directory path
    csv_file = os.path.join(DATA_DIR, 'fights.csv')
    process_fights(csv_file)

    print("[ELO] Elo ratings updated successfully.")
