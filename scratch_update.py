import pandas as pd
import random

# Load the existing CSV and strip columns
existing_df = pd.read_csv('data/sample_real_paimana_data.csv')
existing_df.columns = existing_df.columns.str.strip()

# Load the extracted projects
extracted_df = pd.read_csv('extracted_projects.csv')
extracted_df.columns = extracted_df.columns.str.strip()

# Drop duplicates
extracted_df = extracted_df.drop_duplicates(subset=['project_id'])

# Take 15 random new projects to append
new_projects = extracted_df.sample(15, random_state=42).copy()

# Add missing columns with reasonable defaults
new_projects['sector'] = 'Infrastructure'
new_projects['ministry'] = 'Various Ministries'
new_projects['implementing_agency'] = 'Various Agencies'
new_projects['state'] = 'Multi-State'
new_projects['original_start_date'] = '2020-01-01'
new_projects['original_completion_date'] = '2025-12-31'
new_projects['revised_completion_date'] = '2027-12-31'
new_projects['status'] = 'Ongoing'

# Align columns
new_projects = new_projects[existing_df.columns]

# Concatenate and save
updated_df = pd.concat([existing_df, new_projects], ignore_index=True)
updated_df.to_csv('data/sample_real_paimana_data.csv', index=False)
print(f"Appended {len(new_projects)} projects to data/sample_real_paimana_data.csv")
