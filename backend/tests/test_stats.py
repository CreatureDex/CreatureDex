from backend.models import BiologicalTraits
from backend.services.stats import compute_stats


def _traits(**overrides) -> BiologicalTraits:  # type: ignore[no-untyped-def]
    """Helper that returns a default trait set with any field overridden."""
    defaults = dict(
        size_class="medium",
        predator=False,
        venomous=False,
        has_claws=False,
        has_shell=False,
        has_armour=False,
        camouflage=False,
        locomotion="running",
        top_speed_kmh=20.0,
        special_abilities=[],
    )
    defaults.update(overrides)
    return BiologicalTraits(**defaults)


# ---- HP (size class) -----------------------------------------------------

def test_hp_tiny():
    assert compute_stats(_traits(size_class="tiny")).hp == 30


def test_hp_small():
    assert compute_stats(_traits(size_class="small")).hp == 50


def test_hp_medium():
    assert compute_stats(_traits(size_class="medium")).hp == 75


def test_hp_large():
    assert compute_stats(_traits(size_class="large")).hp == 110


def test_hp_massive():
    assert compute_stats(_traits(size_class="massive")).hp == 150


# ---- Attack ---------------------------------------------------------------

def test_attack_base():
    assert compute_stats(_traits()).attack == 40


def test_attack_predator():
    assert compute_stats(_traits(predator=True)).attack == 75


def test_attack_venomous():
    assert compute_stats(_traits(venomous=True)).attack == 65


def test_attack_claws():
    assert compute_stats(_traits(has_claws=True)).attack == 60


def test_attack_all_offensive_traits():
    stats = compute_stats(_traits(predator=True, venomous=True, has_claws=True))
    assert stats.attack == 120  # 40 + 35 + 25 + 20


# ---- Defence --------------------------------------------------------------

def test_defence_base():
    assert compute_stats(_traits()).defence == 40


def test_defence_shell():
    assert compute_stats(_traits(has_shell=True)).defence == 75


def test_defence_all_defensive_traits():
    stats = compute_stats(_traits(has_shell=True, has_armour=True, camouflage=True))
    assert stats.defence == 115  # 40 + 35 + 25 + 15


# ---- Speed ----------------------------------------------------------------

def test_speed_crawling_slow():
    stats = compute_stats(_traits(locomotion="crawling", top_speed_kmh=2.0))
    assert stats.speed == 25  # base crawling, no bonus


def test_speed_flying_fast():
    stats = compute_stats(_traits(locomotion="flying", top_speed_kmh=120.0))
    assert stats.speed == 110  # 70 + 40


def test_speed_running_moderate():
    stats = compute_stats(_traits(locomotion="running", top_speed_kmh=50.0))
    assert stats.speed == 75  # 60 + 15


# ---- Special --------------------------------------------------------------

def test_special_no_abilities():
    assert compute_stats(_traits()).special == 30


def test_special_multiple_abilities():
    stats = compute_stats(
        _traits(special_abilities=["echolocation", "night_vision", "regeneration"])
    )
    assert stats.special == 90  # 30 + 3 * 20


# ---- Clamping -------------------------------------------------------------

def test_stats_never_exceed_255():
    traits = _traits(
        size_class="massive",
        predator=True,
        venomous=True,
        has_claws=True,
        has_shell=True,
        has_armour=True,
        camouflage=True,
        locomotion="flying",
        top_speed_kmh=300.0,
        special_abilities=[f"a{i}" for i in range(15)],
    )
    stats = compute_stats(traits)
    for val in (stats.hp, stats.attack, stats.defence, stats.speed, stats.special):
        assert 1 <= val <= 255


def test_stats_never_below_1():
    stats = compute_stats(_traits(size_class="unknown", locomotion="unknown"))
    for val in (stats.hp, stats.attack, stats.defence, stats.speed, stats.special):
        assert val >= 1