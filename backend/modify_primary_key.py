import sqlite3

# Connect to the database
conn = sqlite3.connect('smartdoc.db')
cursor = conn.cursor()

# Execute the SQL statements to modify the primary key
try:
    # Create a new table with the desired schema
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS analysis_cache_new (
        file_hash VARCHAR(64) NOT NULL,
        analysis_type VARCHAR(50) NOT NULL DEFAULT 'text_extraction',
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INTEGER NOT NULL,
        storage_path VARCHAR(255),
        ocr_text TEXT,
        sentiment JSON,
        entities JSON,
        summary TEXT,
        classification JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed TIMESTAMP,
        expiry_time TIMESTAMP,
        PRIMARY KEY (file_hash, analysis_type)
    )
    ''')

    # Copy data from the old table to the new one
    cursor.execute('''
    INSERT OR IGNORE INTO analysis_cache_new 
    SELECT * FROM analysis_cache
    ''')

    # Drop the old table
    cursor.execute('DROP TABLE analysis_cache')

    # Rename the new table to the original name
    cursor.execute('ALTER TABLE analysis_cache_new RENAME TO analysis_cache')

    # Create index
    cursor.execute('CREATE INDEX idx_file_hash ON analysis_cache(file_hash)')

    conn.commit()
    print("Primary key successfully modified to (file_hash, analysis_type)")
except sqlite3.Error as e:
    conn.rollback()
    print(f"Error modifying primary key: {e}")

# Close the connection
conn.close() 