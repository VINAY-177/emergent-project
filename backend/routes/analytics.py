from fastapi import APIRouter, Header
from datetime import datetime, timezone, timedelta
from database import db
from routes.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/dashboard")
async def get_dashboard(authorization: str = Header(None)):
    user = await get_current_user(authorization)
    role = user["role"]

    if role == "donor":
        listings = await db.food_listings.find(
            {"donor_id": user["id"]}, {"_id": 0}
        ).to_list(1000)
        total_qty = sum(l.get("quantity", 0) for l in listings)
        pickups = await db.pickups.find(
            {"listing_id": {"$in": [l["id"] for l in listings]}}, {"_id": 0}
        ).to_list(1000)
        completed = [p for p in pickups if p["status"] == "delivered"]

        return {
            "kpis": {
                "total_donated_kg": round(total_qty, 1),
                "completed_pickups": len(completed),
                "meals_served": int(total_qty * 2),
                "co2_avoided_kg": round(total_qty * 2.5, 1),
                "active_listings": len([l for l in listings if l["status"] == "available"]),
                "total_listings": len(listings)
            },
            "recent_listings": sorted(listings, key=lambda x: x.get("created_at", ""), reverse=True)[:10]
        }

    elif role == "ngo":
        pickups = await db.pickups.find(
            {"ngo_id": user["id"]}, {"_id": 0}
        ).to_list(1000)
        completed = [p for p in pickups if p["status"] == "delivered"]
        pending = [p for p in pickups if p["status"] in ["pending", "accepted", "en_route"]]

        redistributions = await db.redistribution.find(
            {"ngo_id": user["id"]}, {"_id": 0}
        ).to_list(1000)
        total_beneficiaries = sum(r.get("beneficiaries_count", 0) for r in redistributions)

        total_qty = sum(p.get("listing_quantity", 0) for p in completed)

        return {
            "kpis": {
                "pickups_completed": len(completed),
                "pending_pickups": len(pending),
                "beneficiaries_served": total_beneficiaries,
                "total_collected_kg": round(total_qty, 1),
                "meals_served": int(total_qty * 2),
                "co2_avoided_kg": round(total_qty * 2.5, 1)
            },
            "recent_pickups": sorted(pickups, key=lambda x: x.get("created_at", ""), reverse=True)[:10]
        }

    else:
        total_listings = await db.food_listings.count_documents({})
        available = await db.food_listings.count_documents({"status": "available"})
        all_listings = await db.food_listings.find({}, {"_id": 0}).to_list(5000)
        total_qty = sum(l.get("quantity", 0) for l in all_listings)

        total_donors = await db.users.count_documents({"role": "donor"})
        total_ngos = await db.users.count_documents({"role": "ngo"})
        total_pickups = await db.pickups.count_documents({})
        completed_pickups = await db.pickups.count_documents({"status": "delivered"})
        pending_pickups = await db.pickups.count_documents(
            {"status": {"$in": ["pending", "accepted", "en_route"]}}
        )

        redistributions = await db.redistribution.find({}, {"_id": 0}).to_list(5000)
        total_beneficiaries = sum(r.get("beneficiaries_count", 0) for r in redistributions)

        return {
            "kpis": {
                "total_food_recovered_kg": round(total_qty, 1),
                "active_donors": total_donors,
                "active_ngos": total_ngos,
                "total_listings": total_listings,
                "available_listings": available,
                "completed_pickups": completed_pickups,
                "pending_pickups": pending_pickups,
                "total_co2_saved_kg": round(total_qty * 2.5, 1),
                "meals_served": int(total_qty * 2),
                "beneficiaries_served": total_beneficiaries
            }
        }


@router.get("/charts")
async def get_chart_data(authorization: str = Header(None)):
    user = await get_current_user(authorization)

    all_listings = await db.food_listings.find({}, {"_id": 0}).to_list(5000)

    # Donations over time (last 30 days)
    now = datetime.now(timezone.utc)
    donations_over_time = []
    for i in range(30, -1, -1):
        day = now - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_qty = sum(
            l.get("quantity", 0)
            for l in all_listings
            if l.get("created_at", "").startswith(day_str)
        )
        donations_over_time.append({"date": day_str, "quantity": round(day_qty, 1)})

    # Category distribution
    categories = {}
    for l in all_listings:
        cat = l.get("category", "other")
        categories[cat] = categories.get(cat, 0) + l.get("quantity", 0)
    category_distribution = [
        {"category": k, "quantity": round(v, 1)}
        for k, v in categories.items()
    ]

    # Top donors
    donor_totals = {}
    donor_names = {}
    for l in all_listings:
        did = l.get("donor_id", "")
        donor_totals[did] = donor_totals.get(did, 0) + l.get("quantity", 0)
        donor_names[did] = l.get("donor_name", "Unknown")
    top_donors = sorted(
        [{"donor_id": k, "donor_name": donor_names.get(k, "Unknown"), "total_kg": round(v, 1)}
         for k, v in donor_totals.items()],
        key=lambda x: x["total_kg"],
        reverse=True
    )[:10]

    return {
        "donations_over_time": donations_over_time,
        "category_distribution": category_distribution,
        "top_donors": top_donors
    }
