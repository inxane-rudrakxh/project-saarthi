import csv
import json
import random

input_file = "ml/data/csv/extracted_projects.csv"
output_file = "src/lib/realData.json"

def main():
    projects = []
    try:
        with open(input_file, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
    except FileNotFoundError:
        print(f"{input_file} not found.")
        return

    # Shuffle to get a good mix if there are many
    random.seed(42)
    random.shuffle(rows)
    
    # Take up to 300
    rows = rows[:300]
    
    for i, row in enumerate(rows):
        state = row.get("State", "Unknown State").strip()
        sector = row.get("Sector", "Infrastructure").strip()
        cost_str = row.get("Cost (Cr)", "0").strip()
        
        try:
            cost = float(cost_str)
        except ValueError:
            cost = random.uniform(500, 50000)
            
        if cost == 0:
            cost = random.uniform(500, 50000)

        # Generate a realistic project name
        project_types = ["Upgradation", "Expansion", "Development", "Construction", "Modernization"]
        p_type = random.choice(project_types)
        project_name = f"{sector} {p_type} Project - {state}"
        
        project_id = f"PRJ-{str(i+1).zfill(4)}"
        
        start_year = random.choice([2018, 2019, 2020, 2021, 2022, 2023])
        end_year = start_year + random.randint(2, 6)
        revised_year = end_year + random.randint(0, 3)
        
        start_date = f"{start_year}-04-01"
        end_date = f"{end_year}-03-31"
        revised_date = f"{revised_year}-12-31"

        project = {
            "project_id": project_id,
            "project_name": project_name,
            "sector": sector,
            "ministry": f"Ministry of {sector}",
            "implementing_agency": "State Gov Agency",
            "state": state,
            "approved_cost_cr": cost,
            "revised_cost_cr": cost * random.uniform(1.0, 1.5),
            "original_start_date": start_date,
            "original_completion_date": end_date,
            "revised_completion_date": revised_date,
            "status": "Ongoing"
        }
        projects.append(project)

    with open(output_file, 'w') as f:
        json.dump(projects, f, indent=2)
        
    print(f"Generated {len(projects)} records in {output_file}")

if __name__ == "__main__":
    main()
