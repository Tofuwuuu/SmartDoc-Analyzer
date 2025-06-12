from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Get database URL from environment variable or use default SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smartdoc.db")

# For PostgreSQL in production
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    echo=False,  # Set to True for SQL query logging
    pool_pre_ping=True,  # Health check for connections
    pool_size=5,  # Connection pool size
    max_overflow=10  # Max extra connections
)

# Create SessionLocal class with factory pattern
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for declarative models
Base = declarative_base()

# Function to get database session
def get_db():
    """
    Dependency function to get DB session for FastAPI dependency injection.
    Usage in route: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 