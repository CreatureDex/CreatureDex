import uuid as uuid_mod
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from uuid import UUID

from ..config import get_settings
from ..database import get_supabase
from ..models import CreatureResponse
from ..routers.auth import get_current_user
from ..services.gemini import identify_creature
from ..services.stats import compute_stats

router = APIRouter(prefix="/creatures", tags=["creatures"])


@router.post(
    "/identify",
    response_model=CreatureResponse,
    status_code=status.HTTP_201_CREATED,
)
async def identify_and_store(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
) -> Any:
    """Photograph an animal/insect → AI identifies it → stats generated → stored."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload must be an image",
        )

    image_data = await file.read()

    # 1. AI identification
    identification = await identify_creature(image_data)

    # 2. Deterministic stat generation
    stats = compute_stats(identification.traits)

    # 3. Upload image to Supabase Storage
    settings = get_settings()
    supabase = get_supabase()
    file_name = f"{user_id}/{uuid_mod.uuid4()}.jpg"
    supabase.storage.from_("creature-images").upload(file_name, image_data)
    image_url = (
        f"{settings.supabase_url}/storage/v1/object/public/"
        f"creature-images/{file_name}"
    )

    # 4. Persist creature
    row: dict[str, Any] = {
        "user_id": user_id,
        "species": identification.species,
        "common_name": identification.common_name,
        "description": identification.description,
        "image_url": image_url,
        "hp": stats.hp,
        "attack": stats.attack,
        "defence": stats.defence,
        "speed": stats.speed,
        "special": stats.special,
    }
    result = supabase.table("creatures").insert(row).execute()
    return result.data[0]


@router.get("/", response_model=list[CreatureResponse])
async def list_creatures(
    user_id: str = Depends(get_current_user),
) -> Any:
    """Return every creature in the authenticated user's collection."""
    supabase = get_supabase()
    result = (
        supabase.table("creatures")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/{creature_id}", response_model=CreatureResponse)
async def get_creature(
    creature_id: UUID,
    user_id: str = Depends(get_current_user),
) -> Any:
    """Get a single creature (must belong to the requesting user)."""
    supabase = get_supabase()
    result = (
        supabase.table("creatures")
        .select("*")
        .eq("id", str(creature_id))
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Creature not found")
    return result.data[0]