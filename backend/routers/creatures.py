import base64
import uuid as uuid_mod
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from uuid import UUID

from ..config import get_settings
from ..database import get_supabase
from ..models import Base64ImageRequest, CreatureResponse
from ..routers.auth import get_current_user
from ..services.gemini import identify_creature
from ..services.stats import compute_stats

router = APIRouter(prefix="/creatures", tags=["creatures"])


async def _identify_and_store(image_data: bytes, user_id: str) -> Any:
    """Shared logic: Gemini ID → duplicate check → stat gen → storage upload → DB insert."""
    identification = await identify_creature(image_data)

    # Reject duplicates: same common name (case-insensitive) in user's collection.
    # We match on common_name rather than species because Gemini can return
    # different valid scientific names for the same animal (e.g. "Canis familiaris"
    # vs "Canis lupus familiaris" for a Chihuahua).
    supabase = get_supabase()
    existing = (
        supabase.table("creatures")
        .select("id")
        .eq("user_id", user_id)
        .ilike("common_name", identification.common_name)
        .execute()
    )
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"You already have a {identification.common_name} "
                f"in your collection!"
            ),
        )

    stats = compute_stats(identification.traits)

    settings = get_settings()
    file_name = f"{user_id}/{uuid_mod.uuid4()}.jpg"
    supabase.storage.from_("creature-images").upload(file_name, image_data)
    image_url = (
        f"{settings.supabase_url}/storage/v1/object/public/"
        f"creature-images/{file_name}"
    )

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


@router.post(
    "/identify",
    response_model=CreatureResponse,
    status_code=status.HTTP_201_CREATED,
)
async def identify_from_upload(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
) -> Any:
    """Identify from multipart file upload."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload must be an image",
        )
    image_data = await file.read()
    return await _identify_and_store(image_data, user_id)


@router.post(
    "/identify-base64",
    response_model=CreatureResponse,
    status_code=status.HTTP_201_CREATED,
)
async def identify_from_base64(
    body: Base64ImageRequest,
    user_id: str = Depends(get_current_user),
) -> Any:
    """Identify from base64-encoded image (used by mobile app)."""
    try:
        image_data = base64.b64decode(body.image_base64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 image data",
        )
    return await _identify_and_store(image_data, user_id)


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