import requests
from bs4 import BeautifulSoup
import csv
import time
import os

base_url = "http://ufcstats.com/statistics/events/completed?page="
MONTHS = {
    "January": "01", "February": "02", "March": "03", "April": "04", "May": "05", "June": "06",
    "July": "07", "August": "08", "September": "09", "October": "10", "November": "11", "December": "12"
}

# Get the HTML of a given page number
def get_page_html(page_num):
    
    url = base_url + str(page_num)
    response = requests.get(url)
    return BeautifulSoup(response.content, "html.parser")

# Clean method field from newlines and extra spaces
def clean_method(method_text):

    return ' '.join(method_text.split())

# Infer gender based on weight class
def infer_gender(weight_class):

    return 'Female' if "Women's" in weight_class else 'Male'

# Scrape event date
def scrape_event_date(event_url):

    response = requests.get(event_url)
    soup = BeautifulSoup(response.content, "html.parser")
    date_tag = soup.find("li", class_="b-list__box-list-item")
    
    if date_tag:
        raw_date = date_tag.text.strip().replace("Date:", "").strip()
        return convert_date_to_dd_mm_yyyy(raw_date)
    
    return "Unknown"

# Convert date to DD-MM-YYYY format
def convert_date_to_dd_mm_yyyy(date_str):
    parts = date_str.split()
    if len(parts) == 3:
        day = parts[1].replace(',', '').zfill(2)
        month = MONTHS[parts[0]]
        year = parts[2]
        return f"{day}-{month}-{year}"
    return "Unknown"

# Get the latest date from the last row of the existing CSV file
def get_latest_scraped_date(output_file):

    if os.path.exists(output_file):
        try:
            with open(output_file, 'r', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                rows = list(reader)  # Load all rows
                if rows:
                    return rows[-1]['date']  # Return the date from the last data row
                return None
        except Exception as e:
            print(f"Error reading the latest date from CSV: {e}")
            return None
    return None

def scrape_all_events(output_file):

    page_num = 1
    has_more_pages = True
    last_scraped_date = get_latest_scraped_date(output_file)
    
    temp_data = []  # Temporary list to hold *new scraped data

    while has_more_pages:
        soup = get_page_html(page_num)
        event_list = soup.find_all("a", class_="b-link b-link_style_black")
        
        if not event_list:
            has_more_pages = False
        else:
            for event in event_list:
                event_name = event.text.strip()
                event_url = event['href']
                
                event_date = scrape_event_date(event_url)
                
                # If the event date is less than or equal to the latest scraped date, stop scraping
                if event_date >= last_scraped_date:
                    print(f"Stopping at already scraped event: {event_name} ({event_date})")
                    has_more_pages = False
                    break  # Stop scraping if we reach an event we've already scraped
                
                print(f"Scraping event: {event_name} ({event_date})")
                temp_data.extend(scrape_event(event_name, event_url, event_date))  # Collect data for this event

            page_num += 1
            time.sleep(1)  # Optional delay to avoid overloading the server

    # Append the new scraped data to the existing CSV file
    if temp_data:
        append_to_csv(output_file, temp_data)
        print(f"Added {len(temp_data)} new fights to {output_file}")

# Scrape each event and return the fight details as a list of dicts
def scrape_event(event_name, event_url, event_date):
    
    event_response = requests.get(event_url)
    event_soup = BeautifulSoup(event_response.content, "html.parser")
    
    fight_table = event_soup.find("tbody")
    fights = []

    if fight_table:
        for fight_row in fight_table.find_all("tr"):
            fight_data = fight_row.find_all("td")

            if len(fight_data) >= 10:
                result = fight_data[0].find('i', class_='b-flag__text').text.strip() if fight_data[0].find('i', class_='b-flag__text') else 'Unknown'
                fighter_1 = fight_data[1].find_all("p")[0].text.strip()
                fighter_2 = fight_data[1].find_all("p")[1].text.strip()
                weight_class = fight_data[6].find("p").text.split("<br>")[0].strip()
                gender = infer_gender(weight_class)
                method = clean_method(fight_data[7].find("p").text.strip())
                round_number = fight_data[8].find("p").text.strip()
                time_of_fight = fight_data[9].find("p").text.strip()

                # Collect fight details
                fight_details = {
                    "event": event_name,
                    "fighter_1": fighter_1,
                    "fighter_2": fighter_2,
                    "result": result,
                    "method": method,
                    "round": round_number,
                    "time": time_of_fight,
                    "weight_class": weight_class,
                    "gender": gender,
                    "date": event_date
                }

                fights.append(fight_details)

    return fights  # Return collected fight details

# Append new data to the existing CSV file
def append_to_csv(output_file, new_data):
    
    with open(output_file, 'a', newline='', encoding='utf-8') as csvfile:
        fieldnames = ["event", "fighter_1", "fighter_2", "result", "method", "round", "time", "weight_class", "gender", "date"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        if os.stat(output_file).st_size == 0:  # If file is empty, write header first
            writer.writeheader()

        # Write all new fights
        writer.writerows(new_data)

if __name__ == "__main__":

    scrape_all_events('fights.csv')
    print("Finished, Success")
