import sqlite3
import argparse
import os
from datasets import load_from_disk
from tqdm import tqdm

def create_table(cursor):
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS personas (
            uuid TEXT PRIMARY KEY,
            persona TEXT,
            professional_persona TEXT,
            hobbies_and_interests TEXT,
            age INTEGER,
            sex TEXT,
            occupation TEXT,
            education_level TEXT,
            marital_status TEXT,
            housing_type TEXT,
            district TEXT,
            province TEXT,
            country TEXT
        )
    ''')

def insert_data(cursor, batch):
    cursor.executemany('''
        INSERT OR IGNORE INTO personas (
            uuid, persona, professional_persona, hobbies_and_interests,
            age, sex, occupation, education_level, marital_status,
            housing_type, district, province, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', batch)

def main():
    parser = argparse.ArgumentParser(description='Build SQLite DB from Nemotron-Personas-Korea dataset')
    parser.add_argument('--input', type=str, default='./Nemotron-Personas-Korea', help='Local dataset directory')
    parser.add_argument('--db', type=str, default='personas.db', help='Output SQLite database file')
    parser.add_argument('--limit', type=int, default=10000, help='Limit the number of records to insert (0 for all)')
    args = parser.parse_args()

    print(f"Loading dataset from {args.input}...")
    try:
        dataset = load_from_disk(args.input)
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return

    ds = dataset['train'] if 'train' in dataset else dataset
    total_records = len(ds)
    print(f"Total records in dataset: {total_records}")

    if args.limit > 0:
        print(f"Applying limit: Only inserting {args.limit} records.")
        ds = ds.select(range(min(args.limit, total_records)))
        total_records = len(ds)

    print(f"Connecting to SQLite DB: {args.db}")
    conn = sqlite3.connect(args.db)
    cursor = conn.cursor()
    
    create_table(cursor)
    
    batch_size = 1000
    batch = []
    
    print("Inserting data into SQLite...")
    for item in tqdm(ds, total=total_records):
        batch.append((
            str(item.get('uuid', '')),
            str(item.get('persona', '')),
            str(item.get('professional_persona', '')),
            str(item.get('hobbies_and_interests', '')),
            item.get('age', 0),
            str(item.get('sex', '')),
            str(item.get('occupation', '')),
            str(item.get('education_level', '')),
            str(item.get('marital_status', '')),
            str(item.get('housing_type', '')),
            str(item.get('district', '')),
            str(item.get('province', '')),
            str(item.get('country', ''))
        ))
        
        if len(batch) >= batch_size:
            insert_data(cursor, batch)
            batch = []
            
    if batch:
        insert_data(cursor, batch)
        
    conn.commit()
    conn.close()
    
    print(f"Successfully inserted {total_records} records into {args.db}")

if __name__ == '__main__':
    main()
