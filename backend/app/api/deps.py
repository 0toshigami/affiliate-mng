"""
API Dependencies for Authentication and Authorization
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.models.user import User, UserRole
from app.schemas.auth import TokenPayload

# HTTP Bearer token scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Get current authenticated user from JWT token
    """
    token = credentials.credentials
    payload = decode_token(token)

    if not payload:
        raise AuthenticationError("Could not validate credentials")

    token_data = TokenPayload(**payload)

    if token_data.type != "access":
        raise AuthenticationError("Invalid token type")

    user = db.query(User).filter(User.id == token_data.sub).first()

    if not user:
        raise AuthenticationError("User not found")

    if user.status != "active":
        raise AuthenticationError("User account is not active")

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Get current active user
    """
    if current_user.status != "active":
        raise AuthenticationError("User account is not active")
    return current_user


def require_role(allowed_roles: list[UserRole]):
    """
    Dependency factory for role-based access control
    Usage: Depends(require_role([UserRole.ADMIN]))
    """

    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise AuthorizationError(
                f"Access denied. Required roles: {', '.join([r.value for r in allowed_roles])}"
            )
        return current_user

    return role_checker


# Convenience dependencies for specific roles
def get_admin_user(current_user: User = Depends(require_role([UserRole.ADMIN]))) -> User:
    """Require admin role"""
    return current_user


def get_affiliate_user(
    current_user: User = Depends(require_role([UserRole.AFFILIATE, UserRole.ADMIN]))
) -> User:
    """Require affiliate or admin role"""
    return current_user
