import os
import re
import csv
import subprocess

PDF_DIR = "report-data"
OUTPUT_CSV = "ml/data/csv/extracted_projects.csv"

def extract_text(pdf_path):
    try:
        result = subprocess.run(['pdftotext', '-layout', pdf_path, '-'], capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
        return ""

def parse_text_to_csv(text):
    # This is a very rudimentary regex to find potential project lines
    # It looks for lines that have a number (sl.no), some text (name), and some numbers (costs)
    projects = []
    
    # Simple state parser (example)
    lines = text.split('\n')
    current_state = "Unknown"
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Very basic heuristic for a state name block
        if len(line) > 3 and len(line) < 30 and "Ministry" not in line and "Total" not in line and not any(char.isdigit() for char in line):
            if "Table" not in line and "Page" not in line:
                current_state = line.strip()
                
        # Look for numbers which might be project costs (e.g. 1000.00)
        match = re.search(r'(\d+)\s+([A-Za-z\s&]+)\s+(\d+)\s+([\d\.]+)', line)
        if match:
            sl_no = match.group(1)
            name = match.group(2).strip()
            count = match.group(3)
            cost = match.group(4)
            
            # Filter out junk
            if len(name) > 3 and name.lower() not in ['total', 'page', 'table']:
                projects.append({
                    'State': current_state,
                    'Sector': name,
                    'Project Count': count,
                    'Cost (Cr)': cost
                })
                
    return projects

def main():
    all_projects = []
    
    for filename in os.listdir(PDF_DIR):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(PDF_DIR, filename)
            print(f"Processing {filename}...")
            text = extract_text(pdf_path)
            if text:
                projects = parse_text_to_csv(text)
                all_projects.extend(projects)
                
    if not all_projects:
        print("No structured data could be extracted.")
        return
        
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    with open(OUTPUT_CSV, 'w', newline='') as csvfile:
        fieldnames = ['State', 'Sector', 'Project Count', 'Cost (Cr)']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for p in all_projects:
            writer.writerow(p)
            
    print(f"Successfully extracted {len(all_projects)} records into {OUTPUT_CSV}")

if __name__ == "__main__":
    main()
