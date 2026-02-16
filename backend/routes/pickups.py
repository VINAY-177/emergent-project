from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional
import uuid
from database import db
from routes.auth import get_current_user

router = APIRouter(prefix="/api/pickups", tags=["pickups"])


class CreatePickupRequest(BaseModel):
    listing_id: str
    notes: str = ""


class UpdatePickupStatusRequest(BaseModel):
    status: str
    notes: str = ""


class RedistributionRequest(BaseModel):
    beneficiaries_count: int
    portion_size: float = 0.5
    notes: str = ""


@router.get("")
async def get_pickups(
    ngo_id: Optional[str] = Query(None),
    listing_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    authorization: str = Header(None)
):
    user = await get_current_user(authorization)
    query = {}

    if user["role"] == "ngo":
        query["ngo_id"] = user["id"]
    elif user["role"] == "donor":
        donor_listings = await db.food_listings.find(
            {"donor_id": user["id"]}, {"id": 1, "_id": 0}
        ).to_list(1000)
        listing_ids = [l["id"] for l in donor_listings]
        query["listing_id"] = {"$in": listing_ids}

    if ngo_id:
        query["ngo_id"] = ngo_id
    if listing_id:
        query["listing_id"] = listing_id
    if status:
        query["status"] = status

    pickups = await db.pickups.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return pickups


@router.post("")
async def create_pickup(req: CreatePickupRequest, authorization: str = Header(None)):
    user = await get_current_user(authorization)
    if user["role"] not in ["ngo", "admin"]:
        raise HTTPException(403, "Only NGOs can create pickups")

    listing = await db.food_listings.find_one({"id": req.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["status"] != "available":
        raise HTTPException(400, "Listing is not available")

    now = datetime.now(timezone.utc).isoformat()
    pickup = {
        "id": str(uuid.uuid4()),
        "listing_id": req.listing_id,
        "listing_name": listing["food_name"],
        "listing_quantity": listing["quantity"],
        "donor_name": listing.get("donor_name", ""),
        "ngo_id": user["id"],
        "ngo_name": user.get("org_name", user["email"]),
        "status": "pending",
        "assigned_to": user.get("org_name", user["email"]),
        "notes": req.notes,
        "timestamps": {
            "created": now,
            "accepted": None,
            "en_route": None,
            "collected": None,
            "delivered": None
        },
        "created_at": now
    }
    await db.pickups.insert_one(pickup)
    await db.food_listings.update_one({"id": req.listing_id}, {"$set": {"status": "reserved"}})

    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "action": "create_pickup",
        "details": f"Pickup created for listing: {listing['food_name']}",
        "timestamp": now
    })

    result = await db.pickups.find_one({"id": pickup["id"]}, {"_id": 0})
    return result


@router.put("/{pickup_id}/status")
async def update_pickup_status(
    pickup_id: str,
    req: UpdatePickupStatusRequest,
    authorization: str = Header(None)
):
    user = await get_current_user(authorization)
    pickup = await db.pickups.find_one({"id": pickup_id}, {"_id": 0})
    if not pickup:
        raise HTTPException(404, "Pickup not found")

    valid_transitions = {
        "pending": ["accepted"],
        "accepted": ["en_route"],
        "en_route": ["collected"],
        "collected": ["delivered"]
    }

    current = pickup["status"]
    if req.status not in valid_transitions.get(current, []):
        raise HTTPException(400, f"Cannot transition from {current} to {req.status}")

    now = datetime.now(timezone.utc).isoformat()
    timestamps = pickup.get("timestamps", {})
    timestamps[req.status] = now

    updates = {
        "status": req.status,
        "timestamps": timestamps,
    }
    if req.notes:
        updates["notes"] = req.notes

    await db.pickups.update_one({"id": pickup_id}, {"$set": updates})

    if req.status == "collected":
        await db.food_listings.update_one(
            {"id": pickup["listing_id"]},
            {"$set": {"status": "picked_up"}}
        )
    elif req.status == "delivered":
        await db.food_listings.update_one(
            {"id": pickup["listing_id"]},
            {"$set": {"status": "delivered"}}
        )

    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "action": "update_pickup_status",
        "details": f"Pickup {pickup_id} status: {current} -> {req.status}",
        "timestamp": now
    })

    result = await db.pickups.find_one({"id": pickup_id}, {"_id": 0})
    return result


@router.post("/{pickup_id}/redistribution")
async def create_redistribution(
    pickup_id: str,
    req: RedistributionRequest,
    authorization: str = Header(None)
):
    user = await get_current_user(authorization)
    pickup = await db.pickups.find_one({"id": pickup_id}, {"_id": 0})
    if not pickup:
        raise HTTPException(404, "Pickup not found")
    if pickup["status"] != "delivered":
        raise HTTPException(400, "Pickup must be delivered first")

    redistribution = {
        "id": str(uuid.uuid4()),
        "pickup_id": pickup_id,
        "listing_id": pickup["listing_id"],
        "ngo_id": user["id"],
        "beneficiaries_count": req.beneficiaries_count,
        "portion_size": req.portion_size,
        "notes": req.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.redistribution.insert_one(redistribution)

    result = await db.redistribution.find_one({"id": redistribution["id"]}, {"_id": 0})
    return result
