from fastapi import APIRouter, Header
from database import db
from routes.auth import get_current_user

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])


def compute_scores(total_food_kg, total_donors, total_ngos, total_pickups, completed_pickups):
    """Rule-based evaluation for 3 redistribution models."""

    pickup_rate = (completed_pickups / max(total_pickups, 1)) * 100
    donor_density = total_donors / max(total_ngos, 1)
    scale_factor = min(total_food_kg / 1000, 1.0) if total_food_kg > 0 else 0.1

    # Model 1: Food Recovery Hubs
    hub_feasibility = min(95, 40 + donor_density * 10 + scale_factor * 30)
    hub_cost = min(90, 30 + scale_factor * 20 + pickup_rate * 0.3)
    hub_environmental = min(95, 50 + pickup_rate * 0.4 + scale_factor * 20)
    hub_social = min(90, 45 + total_ngos * 5 + scale_factor * 15)

    # Model 2: Waste Technology (composting, biogas)
    tech_feasibility = min(85, 25 + scale_factor * 40 + donor_density * 5)
    tech_cost = min(75, 20 + scale_factor * 30)
    tech_environmental = min(98, 60 + scale_factor * 25 + pickup_rate * 0.2)
    tech_social = min(70, 30 + total_ngos * 3 + scale_factor * 10)

    # Model 3: Hybrid Model
    hybrid_feasibility = min(92, (hub_feasibility + tech_feasibility) / 2 + 10)
    hybrid_cost = min(85, (hub_cost + tech_cost) / 2 + 5)
    hybrid_environmental = min(96, (hub_environmental + tech_environmental) / 2 + 5)
    hybrid_social = min(88, (hub_social + tech_social) / 2 + 8)

    def weighted_score(f, c, e, s):
        return round(f * 0.3 + e * 0.3 + c * 0.2 + s * 0.2, 1)

    models = [
        {
            "name": "Food Recovery Hubs",
            "description": "Centralized collection points where donors drop off surplus food for NGOs to pick up and redistribute.",
            "feasibility": round(hub_feasibility, 1),
            "cost": round(hub_cost, 1),
            "environmental": round(hub_environmental, 1),
            "social": round(hub_social, 1),
            "overall": weighted_score(hub_feasibility, hub_cost, hub_environmental, hub_social)
        },
        {
            "name": "Waste Technology",
            "description": "Composting and biogas solutions to convert non-redistributable food waste into useful resources.",
            "feasibility": round(tech_feasibility, 1),
            "cost": round(tech_cost, 1),
            "environmental": round(tech_environmental, 1),
            "social": round(tech_social, 1),
            "overall": weighted_score(tech_feasibility, tech_cost, tech_environmental, tech_social)
        },
        {
            "name": "Hybrid Model",
            "description": "Combines food recovery hubs with waste technology for maximum impact and efficiency.",
            "feasibility": round(hybrid_feasibility, 1),
            "cost": round(hybrid_cost, 1),
            "environmental": round(hybrid_environmental, 1),
            "social": round(hybrid_social, 1),
            "overall": weighted_score(hybrid_feasibility, hybrid_cost, hybrid_environmental, hybrid_social)
        }
    ]

    recommended = max(models, key=lambda m: m["overall"])

    return {
        "models": models,
        "recommended": recommended["name"],
        "data_sufficient": total_food_kg > 0 or total_donors > 0
    }


@router.get("")
async def get_evaluation(authorization: str = Header(None)):
    user = await get_current_user(authorization)

    all_listings = await db.food_listings.find({}, {"_id": 0, "quantity": 1}).to_list(5000)
    total_food_kg = sum(l.get("quantity", 0) for l in all_listings)
    total_donors = await db.users.count_documents({"role": "donor"})
    total_ngos = await db.users.count_documents({"role": "ngo"})
    total_pickups = await db.pickups.count_documents({})
    completed_pickups = await db.pickups.count_documents({"status": "delivered"})

    result = compute_scores(total_food_kg, total_donors, total_ngos, total_pickups, completed_pickups)
    return result
