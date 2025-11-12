"""
Common Dependencies
"""
from typing import Generator
from sqlalchemy.orm import Session
from app.database import get_db

# Re-export get_db for convenience
__all__ = ["get_db"]
