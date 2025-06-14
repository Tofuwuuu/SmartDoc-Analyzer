import sqlite3
import os

def add_metrics_columns():
    """Add confidence_metrics and processing_metrics columns to the analysis_cache table."""
    # Connect to the database
    db_path = os.path.join(os.getcwd(), "smartdoc.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if columns already exist
    cursor.execute("PRAGMA table_info(analysis_cache)")
    columns = [column[1] for column in cursor.fetchall()]
    
    # Add confidence_metrics column if it doesn't exist
    if "confidence_metrics" not in columns:
        print("Adding confidence_metrics column...")
        cursor.execute("ALTER TABLE analysis_cache ADD COLUMN confidence_metrics TEXT")
    else:
        print("confidence_metrics column already exists.")
    
    # Add processing_metrics column if it doesn't exist
    if "processing_metrics" not in columns:
        print("Adding processing_metrics column...")
        cursor.execute("ALTER TABLE analysis_cache ADD COLUMN processing_metrics TEXT")
    else:
        print("processing_metrics column already exists.")
    
    # Commit changes and close connection
    conn.commit()
    conn.close()
    
    print("Database schema updated successfully!")

if __name__ == "__main__":
    add_metrics_columns() 