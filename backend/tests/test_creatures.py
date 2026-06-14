from datetime import datetime, timezone
from uuid import uuid4

from backend.models import CreatureResponse, GeminiIdentification


def test_creature_response_round_trip():
    """CreatureResponse should accept a valid dict and expose every field."""
    data = {
        "id": uuid4(),
        "user_id": uuid4(),
        "species": "Vulpes vulpes",
        "common_name": "Red Fox",
        "description": "A common omnivorous canid found across the Northern Hemisphere.",
        "image_url": "https://example.supabase.co/storage/v1/object/public/creature-images/fox.jpg",
        "hp": 75,
        "attack": 95,
        "defence": 55,
        "speed": 85,
        "special": 50,
        "created_at": datetime.now(tz=timezone.utc),
    }
    creature = CreatureResponse(**data)
    assert creature.species == "Vulpes vulpes"
    assert creature.common_name == "Red Fox"
    assert creature.hp == 75


def test_creature_response_optional_description():
    """description should default to None when omitted."""
    data = {
        "id": uuid4(),
        "user_id": uuid4(),
        "species": "Apis mellifera",
        "common_name": "Honey Bee",
        "image_url": "https://example.com/bee.jpg",
        "hp": 30,
        "attack": 65,
        "defence": 40,
        "speed": 70,
        "special": 50,
        "created_at": datetime.now(tz=timezone.utc),
    }
    creature = CreatureResponse(**data)
    assert creature.description is None


def test_gemini_identification_parses_traits():
    """GeminiIdentification should parse nested traits correctly."""
    raw = {
        "species": "Panthera leo",
        "common_name": "Lion",
        "description": "A large apex predator native to Africa.",
        "traits": {
            "size_class": "large",
            "predator": True,
            "venomous": False,
            "has_claws": True,
            "has_shell": False,
            "has_armour": False,
            "camouflage": True,
            "locomotion": "running",
            "top_speed_kmh": 80.0,
            "special_abilities": ["night_vision"],
        },
    }
    ident = GeminiIdentification(**raw)
    assert ident.species == "Panthera leo"
    assert ident.traits.predator is True
    assert ident.traits.has_claws is True
    assert ident.traits.special_abilities == ["night_vision"]


def test_gemini_identification_no_special_abilities():
    raw = {
        "species": "Columba livia",
        "common_name": "Rock Pigeon",
        "description": "A common city bird.",
        "traits": {
            "size_class": "small",
            "predator": False,
            "venomous": False,
            "has_claws": True,
            "has_shell": False,
            "has_armour": False,
            "camouflage": False,
            "locomotion": "flying",
            "top_speed_kmh": 77.0,
            "special_abilities": [],
        },
    }
    ident = GeminiIdentification(**raw)
    assert ident.traits.special_abilities == []