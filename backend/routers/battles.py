import random
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID

from ..database import get_supabase
from ..models import (
    BattleAccept,
    BattleAction,
    BattleCreate,
    BattleCreatureState,
    BattleResponse,
    BattleState,
)
from ..routers.auth import get_current_user

router = APIRouter(prefix="/battles", tags=["battles"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _calculate_damage(
    attacker: BattleCreatureState,
    defender: BattleCreatureState,
) -> int:
    """Simplified damage formula with ±20 % variance. Always ≥ 1."""
    base = (attacker.attack * 2) // 3
    reduction = defender.defence // 4
    raw = max(1, base - reduction)
    variance = random.randint(80, 120) / 100
    return max(1, int(raw * variance))


def _fetch_creature(user_id: str, creature_id: UUID) -> dict[str, Any]:
    """Fetch a creature row or raise 404."""
    supabase = get_supabase()
    result = (
        supabase.table("creatures")
        .select("*")
        .eq("id", str(creature_id))
        .eq("user_id", user_id)
        .execute()
    )
    rows: list[dict[str, Any]] = result.data  # type: ignore[assignment]
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Creature not found in your collection",
        )
    return rows[0]


def _creature_to_state(creature: dict[str, Any], creature_id: UUID) -> BattleCreatureState:
    return BattleCreatureState(
        creature_id=creature_id,
        species=creature["species"],
        common_name=creature["common_name"],
        current_hp=creature["hp"],
        max_hp=creature["hp"],
        attack=creature["attack"],
        defence=creature["defence"],
        speed=creature["speed"],
        special=creature["special"],
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/", response_model=BattleResponse, status_code=status.HTTP_201_CREATED)
async def create_battle(
    body: BattleCreate,
    user_id: str = Depends(get_current_user),
) -> Any:
    """Challenge another player. Caller picks their creature; status → pending."""
    if str(body.opponent_id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot battle yourself")

    creature = _fetch_creature(user_id, body.creature_id)
    challenger_state = _creature_to_state(creature, body.creature_id)
    state = BattleState(challenger_creature=challenger_state)

    supabase = get_supabase()
    row: dict[str, Any] = {
        "challenger_id": user_id,
        "opponent_id": str(body.opponent_id),
        "status": "pending",
        "state": state.model_dump(mode="json"),
    }
    result = supabase.table("battles").insert(row).execute()
    return result.data[0]


@router.post("/{battle_id}/accept", response_model=BattleResponse)
async def accept_battle(
    battle_id: UUID,
    body: BattleAccept,
    user_id: str = Depends(get_current_user),
) -> Any:
    """Opponent accepts and picks their creature; status → active."""
    supabase = get_supabase()
    battle = supabase.table("battles").select("*").eq("id", str(battle_id)).execute()
    rows: list[dict[str, Any]] = battle.data  # type: ignore[assignment]
    if not rows:
        raise HTTPException(status_code=404, detail="Battle not found")

    b = rows[0]
    if b["opponent_id"] != user_id:
        raise HTTPException(status_code=403, detail="You are not the opponent")
    if b["status"] != "pending":
        raise HTTPException(status_code=400, detail="Battle is not pending")

    creature = _fetch_creature(user_id, body.creature_id)
    opponent_state = _creature_to_state(creature, body.creature_id)

    state = BattleState(**b["state"])
    state.opponent_creature = opponent_state

    # Faster creature goes first; coin-flip on tie
    challenger_speed = state.challenger_creature.speed
    if opponent_state.speed > challenger_speed:
        first = user_id
    elif opponent_state.speed < challenger_speed:
        first = b["challenger_id"]
    else:
        first = random.choice([b["challenger_id"], user_id])

    state.log.append(
        f"Battle started! {state.challenger_creature.common_name} "
        f"vs {opponent_state.common_name}."
    )

    update: dict[str, Any] = {
        "status": "active",
        "turn": first,
        "state": state.model_dump(mode="json"),
    }
    result = (
        supabase.table("battles").update(update).eq("id", str(battle_id)).execute()
    )
    return result.data[0]


@router.post("/{battle_id}/action", response_model=BattleResponse)
async def take_action(
    battle_id: UUID,
    body: BattleAction,
    user_id: str = Depends(get_current_user),
) -> Any:
    """Execute a turn. Currently only 'attack' is supported."""
    supabase = get_supabase()
    battle = supabase.table("battles").select("*").eq("id", str(battle_id)).execute()
    rows: list[dict[str, Any]] = battle.data  # type: ignore[assignment]
    if not rows:
        raise HTTPException(status_code=404, detail="Battle not found")

    b = rows[0]
    if b["status"] != "active":
        raise HTTPException(status_code=400, detail="Battle is not active")
    if b["turn"] != user_id:
        raise HTTPException(status_code=400, detail="It is not your turn")

    state = BattleState(**b["state"])
    is_challenger = user_id == b["challenger_id"]

    attacker = state.challenger_creature if is_challenger else state.opponent_creature
    defender = state.opponent_creature if is_challenger else state.challenger_creature

    if attacker is None or defender is None:
        raise HTTPException(status_code=400, detail="Battle state is invalid")

    damage = _calculate_damage(attacker, defender)
    defender.current_hp = max(0, defender.current_hp - damage)
    state.log.append(
        f"{attacker.common_name} attacks {defender.common_name} for {damage} damage!"
    )

    update: dict[str, Any] = {}

    if defender.current_hp <= 0:
        state.log.append(
            f"{defender.common_name} is defeated! {attacker.common_name} wins!"
        )
        update["status"] = "finished"
        update["winner_id"] = user_id
        update["turn"] = None
    else:
        next_turn = b["opponent_id"] if is_challenger else b["challenger_id"]
        update["turn"] = next_turn

    update["state"] = state.model_dump(mode="json")
    result = (
        supabase.table("battles").update(update).eq("id", str(battle_id)).execute()
    )
    return result.data[0]


@router.get("/", response_model=list[BattleResponse])
async def list_battles(
    user_id: str = Depends(get_current_user),
) -> Any:
    """List all battles the authenticated user is involved in."""
    supabase = get_supabase()
    result = (
        supabase.table("battles")
        .select("*")
        .or_(f"challenger_id.eq.{user_id},opponent_id.eq.{user_id}")
        .order("updated_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/{battle_id}", response_model=BattleResponse)
async def get_battle(
    battle_id: UUID,
    user_id: str = Depends(get_current_user),
) -> Any:
    """Get a single battle (must be a participant)."""
    supabase = get_supabase()
    result = (
        supabase.table("battles").select("*").eq("id", str(battle_id)).execute()
    )
    rows: list[dict[str, Any]] = result.data  # type: ignore[assignment]
    if not rows:
        raise HTTPException(status_code=404, detail="Battle not found")

    b = rows[0]
    if b["challenger_id"] != user_id and b["opponent_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not your battle")
    return b