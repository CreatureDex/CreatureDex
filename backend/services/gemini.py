import json

import google.generativeai as genai

from ..config import get_settings
from ..models import GeminiIdentification

_PROMPT = """\
Analyse this image and identify the animal or insect.

NAMING RULES (follow exactly):
- common_name: Use the most specific common English name. For domestic animal
  breeds, use the breed name (e.g. "Chihuahua", "Labrador Retriever", "Persian
  Cat", "Holland Lop Rabbit"). For wild animals, use the standard common name
  (e.g. "Red Fox", "Monarch Butterfly", "European Robin").
- species: Use the standard binomial name (Genus + species) in italicised form.
  Always use the most widely accepted name. For domestic dogs always use
  "Canis lupus familiaris", for domestic cats always use "Felis catus".
  Never vary between synonyms across different calls.
- common_name must be title-cased (e.g. "Red Fox", not "red fox").

Return your response as a JSON object with exactly this structure (no markdown
fences, no extra text — only valid JSON):

{
    "species": "Genus species",
    "common_name": "Title Cased Common Name",
    "description": "Brief 1-2 sentence description of the species or breed",
    "traits": {
        "size_class": "tiny | small | medium | large | massive",
        "predator": true or false,
        "venomous": true or false,
        "has_claws": true or false,
        "has_shell": true or false,
        "has_armour": true or false,
        "camouflage": true or false,
        "locomotion": "flying | running | swimming | crawling | hopping",
        "top_speed_kmh": <number>,
        "special_abilities": ["list", "of", "abilities"]
    }
}

Size class guide:
  tiny    = < 10 g        (e.g. ant, ladybird)
  small   = 10 g – 1 kg   (e.g. sparrow, frog)
  medium  = 1 – 50 kg     (e.g. fox, eagle)
  large   = 50 – 500 kg   (e.g. lion, horse)
  massive = > 500 kg      (e.g. elephant, whale)

Special ability examples: echolocation, electric_shock, bioluminescence,
venom_spit, ink_cloud, regeneration, night_vision, sonar, camouflage_shift.
"""


async def identify_creature(image_data: bytes) -> GeminiIdentification:
    """Send an image to Gemini 2.5 Flash and return structured identification."""
    settings = get_settings()
    genai.configure(api_key=settings.gemini_api_key)

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(
        [_PROMPT, {"mime_type": "image/jpeg", "data": image_data}]
    )

    text = response.text.strip()

    # Strip markdown code fences if the model wraps them anyway
    if text.startswith("```"):
        text = text.split("\n", 1)[1]
        text = text.rsplit("```", 1)[0].strip()

    data = json.loads(text)
    return GeminiIdentification(**data)