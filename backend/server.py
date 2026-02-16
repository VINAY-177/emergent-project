from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import logging
from database import db, client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


async def seed_admin_user():
    from passlib.context import CryptContext
    import uuid
    from datetime import datetime, timezone
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    admin = await db.users.find_one({"email": "bishtvinay131@gmail.com"})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": "bishtvinay131@gmail.com",
            "password_hash": pwd_context.hash("vinay_17"),
            "role": "admin",
            "org_name": "Platform Admin",
            "service_area": "All",
            "phone": "",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Admin user seeded successfully")
    else:
        logger.info("Admin user already exists")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed_admin_user()
    await db.users.create_index("email", unique=True)
    await db.users.create_index("role")
    await db.food_listings.create_index("donor_id")
    await db.food_listings.create_index("status")
    await db.pickups.create_index("listing_id")
    await db.pickups.create_index("ngo_id")
    yield
    client.close()


app = FastAPI(lifespan=lifespan)

from routes.auth import router as auth_router
from routes.listings import router as listings_router
from routes.pickups import router as pickups_router
from routes.analytics import router as analytics_router
from routes.evaluation import router as evaluation_router
from routes.admin import router as admin_router

app.include_router(auth_router)
app.include_router(listings_router)
app.include_router(pickups_router)
app.include_router(analytics_router)
app.include_router(evaluation_router)
app.include_router(admin_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
