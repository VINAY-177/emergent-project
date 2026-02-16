from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid
from database import db
from routes.auth import get_current_user

router = APIRouter(prefix="/api/listings", tags=["listings"])


class CreateListingRequest(BaseModel):
    food_name: str
    category: str
    quantity: float
    preparation_time: str = ""
    expiry_time: str
    storage_condition: str = "room_temp"
    pickup_address: str = ""
    latitude: float = 28.6139
    longitude: float = 77.2090
    urgent_flag: bool = False
    status: str = "available"


class UpdateListingRequest(BaseModel):
    food_name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    expiry_time: Optional[str] = None
    storage_condition: Optional[str] = None
    pickup_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    urgent_flag: Optional[bool] = None
    status: Optional[str] = None


@router.get("")
async def get_listings(
    status: Optional[str] = Query(None),
    donor_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    authorization: str = Header(None)
):
    await get_current_user(authorization)
    query = {}
    if status:
        query["status"] = status
    if donor_id:
        query["donor_id"] = donor_id
    if category:
        query["category"] = category

    listings = await db.food_listings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return listings


@router.post("")
async def create_listing(req: CreateListingRequest, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user["role"] not in ["donor", "admin"]:
        raise HTTPException(403, "Only donors can create listings")

    if req.quantity <= 0:
        raise HTTPException(400, "Quantity must be greater than 0")

    listing = {
        "id": str(uuid.uuid4()),
        "donor_id": user["id"],
        "donor_name": user.get("org_name", user["email"]),
        "food_name": req.food_name,
        "category": req.category,
        "quantity": req.quantity,
        "preparation_time": req.preparation_time,
        "expiry_time": req.expiry_time,
        "storage_condition": req.storage_condition,
        "pickup_address": req.pickup_address,
        "location": {"lat": req.latitude, "lng": req.longitude},
        "urgent_flag": req.urgent_flag,
        "status": req.status,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.food_listings.insert_one(listing)

    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "action": "create_listing",
        "details": f"Created listing: {req.food_name} ({req.quantity}kg)",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    result = await db.food_listings.find_one({"id": listing["id"]}, {"_id": 0})
    return result


@router.get("/{listing_id}")
async def get_listing(listing_id: str, authorization: str = Header(None)):
    await get_current_user(authorization)
    listing = await db.food_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    return listing


@router.put("/{listing_id}")
async def update_listing(listing_id: str, req: UpdateListingRequest, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    listing = await db.food_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["donor_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not authorized")

    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if "latitude" in updates or "longitude" in updates:
        loc = listing.get("location", {})
        if "latitude" in updates:
            loc["lat"] = updates.pop("latitude")
        if "longitude" in updates:
            loc["lng"] = updates.pop("longitude")
        updates["location"] = loc

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.food_listings.update_one({"id": listing_id}, {"$set": updates})

    result = await db.food_listings.find_one({"id": listing_id}, {"_id": 0})
    return result


@router.delete("/{listing_id}")
async def delete_listing(listing_id: str, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    listing = await db.food_listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["donor_id"] != user["id"] and user["role"] != "admin":
        raise HTTPException(403, "Not authorized")

    await db.food_listings.delete_one({"id": listing_id})
    return {"message": "Listing deleted"}
