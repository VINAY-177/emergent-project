from fastapi import APIRouter, Header, Query
from typing import Optional
from database import db
from routes.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users")
async def get_all_users(
    role: Optional[str] = Query(None),
    authorization: str = Header(None)
):
    await require_admin(authorization)
    query = {}
    if role:
        query["role"] = role
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users


@router.get("/audit-logs")
async def get_audit_logs(
    limit: int = Query(100),
    authorization: str = Header(None)
):
    await require_admin(authorization)
    logs = await db.audit_logs.find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).to_list(limit)
    return logs


@router.get("/stats")
async def get_admin_stats(authorization: str = Header(None)):
    await require_admin(authorization)

    total_users = await db.users.count_documents({})
    total_donors = await db.users.count_documents({"role": "donor"})
    total_ngos = await db.users.count_documents({"role": "ngo"})
    total_listings = await db.food_listings.count_documents({})
    total_pickups = await db.pickups.count_documents({})

    return {
        "total_users": total_users,
        "total_donors": total_donors,
        "total_ngos": total_ngos,
        "total_listings": total_listings,
        "total_pickups": total_pickups
    }
