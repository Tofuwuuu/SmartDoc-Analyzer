import sqlite3

# Connect to the database
conn = sqlite3.connect('smartdoc.db')
cursor = conn.cursor()

# Add the analysis_type column
try:
    cursor.execute('ALTER TABLE analysis_cache ADD COLUMN analysis_type VARCHAR(50)')
    conn.commit()
    print("Column 'analysis_type' successfully added to 'analysis_cache' table")
except sqlite3.Error as e:
    print(f"Error adding column: {e}")

# Close the connection
conn.close() 