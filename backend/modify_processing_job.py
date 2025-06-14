import sqlite3

# Connect to the database
conn = sqlite3.connect('smartdoc.db')
cursor = conn.cursor()

# Execute the SQL statements to modify the processing_jobs table
try:
    # Check if the analysis_type column exists
    cursor.execute("PRAGMA table_info(processing_jobs)")
    columns = cursor.fetchall()
    column_names = [column[1] for column in columns]
    
    # Add analysis_type column if it doesn't exist
    if 'analysis_type' not in column_names:
        cursor.execute('ALTER TABLE processing_jobs ADD COLUMN analysis_type VARCHAR(50) NOT NULL DEFAULT "text_extraction"')
        print("Added analysis_type column to processing_jobs table")
    else:
        print("analysis_type column already exists in processing_jobs table")
    
    conn.commit()
except sqlite3.Error as e:
    conn.rollback()
    print(f"Error modifying processing_jobs table: {e}")

# Close the connection
conn.close() 