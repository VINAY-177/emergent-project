from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from passlib.context import CryptContext
from datetime import datetime, timezone, timedelta
import jwt
import uuid
import os
from database import db

router = APIRouter(prefix="/api/auth", tags=["auth"])

JWT_SECRET = os.environ.get("JWT_SECRET", "foodwaste_redistribution_secret_2024")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str
    org_name: str = ""
    service_area: str = ""
    phone: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


def create_token(user_id: str, role: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one(
            {"id": payload["user_id"]},
            {"_id": 0, "password_hash": 0}
        )
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


async def require_admin(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user["role"] != "admin":
        raise HTTPException(403, "Admin access required")
    return user


@router.post("/register")
async def register(req: RegisterRequest):
    if req.role not in ["donor", "ngo"]:
        raise HTTPException(400, "Role must be donor or ngo")

    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(400, "Email already registered")

    user = {
        "id": str(uuid.uuid4()),
        "email": req.email,
        "password_hash": pwd_context.hash(req.password),
        "role": req.role,
        "org_name": req.org_name,
        "service_area": req.service_area,
        "phone": req.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)

    token = create_token(user["id"], user["role"], user["email"])

    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "action": "register",
        "details": f"New {req.role} registered: {req.org_name}",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "org_name": user["org_name"],
            "service_area": user["service_area"],
            "phone": user["phone"]
        }
    }


@router.post("/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Invalid credentials")

    if not pwd_context.verify(req.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")

    token = create_token(user["id"], user["role"], user["email"])

    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "action": "login",
        "details": f"{user['role']} logged in",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "org_name": user.get("org_name", ""),
            "service_area": user.get("service_area", ""),
            "phone": user.get("phone", "")
        }
    }


@router.get("/me")
async def get_me(user=None):
    from fastapi import Depends
    return {"error": "Use dependency injection"}


@router.get("/profile")
async def get_profile(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    return user


@router.put("/profile")
async def update_profile(authorization: str = Header(None), body: dict = {}):
    user = await get_current_user(authorization)
    allowed = {"org_name", "service_area", "phone"}
    updates = {k: v for k, v in body.items() if k in allowed}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated
