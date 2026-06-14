from datetime import datetime
from enum import Enum
from uuid import UUID
from pydantic import BaseModel, Field

# Biological traits of a creature
class BiologicalTraits(BaseModel):
    size_class: str  # tiny | small | medium | large | massive
    predator: bool
    venomous: bool
    has_claws: bool
    has_shell: bool
    has_armour: bool
    camouflage: bool
    locomotion: str  # flying | running | swimming | crawling | hopping
    top_speed_kmh: float
    special_abilities: list[str]


class CreatureStats(BaseModel):
    hp: int = Field(ge=1, le=255)
    attack: int = Field(ge=1, le=255)
    defence: int = Field(ge=1, le=255)
    speed: int = Field(ge=1, le=255)
    special: int = Field(ge=1, le=255)

class GeminiIdentification(BaseModel):
    species: str
    common_name: str
    description: str
    traits: BiologicalTraits

# Creature API schemas
class CreatureResponse(BaseModel):
    id: UUID
    user_id: UUID
    species: str
    common_name: str
    description: str | None = None
    image_url: str
    hp: int
    attack: int
    defence: int
    speed: int
    special: int
    created_at: datetime

# Battle API schemas
class BattleStatus(str, Enum):
    pending = "pending"
    active = "active"
    finished = "finished"
 
 
class BattleCreate(BaseModel):
    opponent_id: UUID
    creature_id: UUID
 
 
class BattleAccept(BaseModel):
    creature_id: UUID
 
 
class BattleAction(BaseModel):
    action: str = "attack"
 
 
class BattleCreatureState(BaseModel):
    creature_id: UUID
    species: str
    common_name: str
    current_hp: int
    max_hp: int
    attack: int
    defence: int
    speed: int
    special: int
 
 
class BattleState(BaseModel):
    challenger_creature: BattleCreatureState
    opponent_creature: BattleCreatureState | None = None
    log: list[str] = []
 
 
class BattleResponse(BaseModel):
    id: UUID
    challenger_id: UUID
    opponent_id: UUID
    status: BattleStatus
    turn: UUID | None = None
    state: BattleState | None = None
    winner_id: UUID | None = None
    created_at: datetime
    updated_at: datetime