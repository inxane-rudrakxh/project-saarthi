import re
import csv
import sys

def parse_flash_report(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    projects = []
    # Regex to match lines like:
    # "1             705728             MUMBAI-AHMEDABAD HIGH SPEED RAIL PROJECT- 508 KM                                108,000                        108,000         90,967                         62.16"
    # Note that sometimes some numbers are missing, like line 2 has no expenditure or revised cost?
    # Actually, line 2: 63,246 (original), (missing revised?), 34,698 (expenditure), 55.73 (progress)
    
    # We'll just look for lines that start with a number followed by spaces, then a 6-digit ID, then text.
    pattern = re.compile(r'^"?(\d+)\s+(\d{5,7})\s+(.+?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)?\s*([\d,]+(?:\.\d+)?)?\s*([\d\.]+)?"?$')
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        m = pattern.match(line)
        if m:
            sno = m.group(1)
            pid = m.group(2)
            name = m.group(3).strip()
            
            # The remaining groups are costs and progress
            # Since some might be merged or missing, let's just grab the text and extract numbers
            # Instead of strict regex for the tail, let's split the tail by multiple spaces
            pass
            
    # Alternative approach: just regex for ID and Name
    alt_pattern = re.compile(r'^"?\d+\s+(\d{5,7})\s+([A-Za-z].*?)\s{2,}')
    
    found = 0
    with open('extracted_projects.csv', 'w', newline='', encoding='utf-8') as outf:
        writer = csv.writer(outf)
        writer.writerow(['project_id', 'project_name', 'approved_cost_cr', 'revised_cost_cr'])
        for line in lines:
            line = line.strip()
            # Remove quotes
            if line.startswith('"') and line.endswith('"'):
                line = line[1:-1]
                
            m = alt_pattern.match(line)
            if m:
                pid = m.group(1)
                name = m.group(2).strip()
                # Find all numbers at the end
                numbers = re.findall(r'[\d,]+(?:\.\d+)?', line[m.end(2):])
                
                approved = numbers[0].replace(',','') if len(numbers) > 0 else '0'
                revised = numbers[1].replace(',','') if len(numbers) > 1 else approved
                
                # We'll map the PID to PRJ-{PID}
                prj_id = f"PRJ-{pid}"
                writer.writerow([prj_id, name, approved, revised])
                found += 1
                
    print(f"Extracted {found} projects to extracted_projects.csv")

if __name__ == '__main__':
    parse_flash_report('data/FlashReport_July_2026-_1_.csv', 'extracted_projects.csv')
