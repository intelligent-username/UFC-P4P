import requests
from bs4 import BeautifulSoup
import csv
import time

base_url = "http://ufcstats.com/statistics/events/completed?page="

# Get the HTML of a given page number
def get_page_html(page_number):
    url = base_url + str(page_number)
    response = requests.get(url)
    return BeautifulSoup(response.content, "html.parser")

# Clean method field from newlines and extra spaces
def clean_method(method_text):
    return ' '.join(method_text.split())

# Infer gender based on weight class for more info
def infer_gender(weight_class):
    return 'Female' if "Women's" in weight_class else 'Male'

# Start scraping all pages of completed UFC events
def scrape_all_events(output_file):
    page_number = 1
    has_more_pages = True

    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ["event", "fighter_1", "fighter_2", "result", "method", "round", "time", "weight_class", "gender"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()  # Write the CSV header

        # Scrape multiple event pages
        while has_more_pages:
            soup = get_page_html(page_number)

            # Extract event details from the current page
            event_list = soup.find_all("a", class_="b-link b-link_style_black")
            if not event_list:
                has_more_pages = False  # Exit if no more events are found on the page
            else:
                for event in event_list:
                    event_name = event.text.strip()
                    event_url = event['href']
                    scrape_event(event_name, event_url, writer)  # Scrape each event and write to CSV
                    
                page_number += 1
                time.sleep(1) 

# Scrape each event and append fight details to CSV
def scrape_event(event_name, event_url, writer):
    # Request event page
    event_response = requests.get(event_url)
    event_soup = BeautifulSoup(event_response.content, "html.parser")
    
    # Scrape fight details (fight table)
    fight_table = event_soup.find("tbody")
    
    # Some pages might not have fights listed, so we check first
    if fight_table:
        for fight_row in fight_table.find_all("tr"):
            fight_data = fight_row.find_all("td")

            # Ensure the correct number of columns are present
            if len(fight_data) >= 10:
                # Collect fight details
                result = fight_data[0].find('i', class_='b-flag__text').text.strip() if fight_data[0].find('i', class_='b-flag__text') else 'Unknown'
                fighter_1 = fight_data[1].find_all("p")[0].text.strip()
                fighter_2 = fight_data[1].find_all("p")[1].text.strip()
                weight_class = fight_data[6].find("p").text.split("<br>")[0].strip()  # Get weight class from the 7th column
                gender = infer_gender(weight_class)
                method = clean_method(fight_data[7].find("p").text.strip())  # Clean the method field to remove newlines and spaces
                round_number = fight_data[8].find("p").text.strip()
                time_of_fight = fight_data[9].find("p").text.strip()

                # Prepare fight details for writing to CSV
                fight_details = {
                    "event": event_name,
                    "fighter_1": fighter_1,
                    "fighter_2": fighter_2,
                    "result": result,
                    "method": method,
                    "round": round_number,
                    "time": time_of_fight,
                    "weight_class": weight_class,
                    "gender": gender
                }

                writer.writerow(fight_details)
                print(f"Finished: {fighter_1} vs {fighter_2} from event: {event_name}")

if __name__ == "__main__":
    scrape_all_events('fights.csv')
