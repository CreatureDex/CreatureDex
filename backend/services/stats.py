from ..models import BiologicalTraits, CreatureStats

# Lookup tables
_SIZE_HP: dict[str, int] = {
    "tiny": 30,
    "small": 50,
    "medium": 75,
    "large": 110,
    "massive": 150,
}

_LOCOMOTION_SPEED: dict[str, int] = {
    "flying": 70,
    "running": 60,
    "hopping": 55,
    "swimming": 50,
    "crawling": 25,
}


def _clamp(value: int, lo: int = 1, hi: int = 255) -> int:
    return max(lo, min(hi, value))

# Public API
def compute_stats(traits: BiologicalTraits) -> CreatureStats:
    """Convert biological traits into deterministic battle stats.

    The same species always produces the same stats because every input
    field is objective (size class, predator flag, etc.) and the mapping
    uses fixed arithmetic — no randomness.
    """

    # HP — derived from body mass / size class
    hp = _SIZE_HP.get(traits.size_class, 60)

    # Attack — predator status, venom, claws
    attack = 40
    if traits.predator:
        attack += 35
    if traits.venomous:
        attack += 25
    if traits.has_claws:
        attack += 20

    # Defence — shell, armour, camouflage
    defence = 40
    if traits.has_shell:
        defence += 35
    if traits.has_armour:
        defence += 25
    if traits.camouflage:
        defence += 15

    # Speed — locomotion type + top speed bonus
    speed = _LOCOMOTION_SPEED.get(traits.locomotion, 40)
    if traits.top_speed_kmh > 100:
        speed += 40
    elif traits.top_speed_kmh > 60:
        speed += 25
    elif traits.top_speed_kmh > 30:
        speed += 15
    elif traits.top_speed_kmh > 10:
        speed += 5

    # Special — unique biological abilities
    special = 30 + len(traits.special_abilities) * 20

    return CreatureStats(
        hp=_clamp(hp),
        attack=_clamp(attack),
        defence=_clamp(defence),
        speed=_clamp(speed),
        special=_clamp(special),
    )