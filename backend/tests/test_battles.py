from typing import Any
from uuid import uuid4

from backend.models import BattleCreatureState, BattleState
from backend.routers.battles import _calculate_damage


def _creature(**overrides: Any) -> BattleCreatureState:
    defaults: dict[str, Any] = dict(
        creature_id=uuid4(),
        species="Test",
        common_name="Test Creature",
        current_hp=100,
        max_hp=100,
        attack=50,
        defence=50,
        speed=50,
        special=50,
    )
    defaults.update(overrides)
    return BattleCreatureState(**defaults)


# ---- Damage calculation ---------------------------------------------------

def test_damage_always_at_least_one() -> None:
    attacker = _creature(attack=1)
    defender = _creature(defence=255)
    for _ in range(50):
        assert _calculate_damage(attacker, defender) >= 1


def test_high_attack_beats_low_attack_on_average() -> None:
    weak = _creature(attack=30)
    strong = _creature(attack=150)
    target = _creature(defence=50)

    weak_avg = sum(_calculate_damage(weak, target) for _ in range(200)) / 200
    strong_avg = sum(_calculate_damage(strong, target) for _ in range(200)) / 200
    assert strong_avg > weak_avg


def test_high_defence_reduces_damage() -> None:
    attacker = _creature(attack=100)
    soft = _creature(defence=20)
    tough = _creature(defence=200)

    soft_avg = sum(_calculate_damage(attacker, soft) for _ in range(200)) / 200
    tough_avg = sum(_calculate_damage(attacker, tough) for _ in range(200)) / 200
    assert soft_avg > tough_avg


# ---- Battle state model ---------------------------------------------------

def test_battle_state_initialises_with_one_creature() -> None:
    c = _creature()
    state = BattleState(challenger_creature=c)
    assert state.opponent_creature is None
    assert state.log == []


def test_battle_state_log_appends() -> None:
    state = BattleState(challenger_creature=_creature())
    state.log.append("Battle started!")
    state.log.append("Fox attacks Pigeon for 12 damage!")
    assert len(state.log) == 2


def test_battle_state_serialises_round_trip() -> None:
    c1 = _creature(common_name="Fox")
    c2 = _creature(common_name="Hawk")
    state = BattleState(
        challenger_creature=c1,
        opponent_creature=c2,
        log=["Battle started!"],
    )
    dumped = state.model_dump(mode="json")
    restored = BattleState(**dumped)
    assert restored.challenger_creature.common_name == "Fox"
    assert restored.opponent_creature is not None
    assert restored.opponent_creature.common_name == "Hawk"
    assert restored.log == ["Battle started!"]