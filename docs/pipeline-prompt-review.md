# Render Pipeline — Prompt and Timing Review

**Purpose:** a readable map of everything that happens between a customer submitting their photo and the finished plan landing in their inbox. Every Gemini prompt is reproduced verbatim so you can evaluate and redesign them. Timing figures come from the live Inngest run you captured (total 4m 04s).

**Source of truth:** `src/inngest/functions/pipeline.ts` (all line references below are to that file).

---

## 1. Pipeline at a glance

One run = **7 Gemini calls** (5 text/vision on `gemini-2.5-flash`, 2 image generations on `gemini-2.5-flash-image`), plus storage and database housekeeping. An 8th call (render retry) only fires if validation finds hallucinated structures.

| # | Inngest step | What it does | Model | Time (this run) |
|---|---|---|---|---|
| 1 | `download-image` | Pulls the customer's photo from Supabase Storage, converts to base64 | none | 1.5s |
| 2 | `spatial-fingerprint` | Vision survey: boundaries, structures, camera geometry, scale calibration, perspective numbers | gemini-2.5-flash | **33.0s** |
| 3 | `control-points` | Vision: finds the 4 ground-plane corner coordinates; code then derives the perspective grid (homography maths, no AI) | gemini-2.5-flash | **22.1s** |
| 4 | `garden-design` | The big one. Full design proposal as one giant JSON: plants, hardscape, costs, phasing, layout, visual prompt seed | gemini-2.5-flash | **1m 24s** |
| 5a | `validate-layout` (parallel with 5b) | Code projects every plant's grid cell to pixel coordinates; Gemini sanity-checks the positions against the photo | gemini-2.5-flash | 13.5s |
| 5b | `concept-base-plan` (parallel with 5a) | Generates the top-down watercolour sketch from the layout description | gemini-2.5-flash-image | 9.6s |
| 6 | `generate-render` | Code assembles the master visual prompt; Gemini generates the photorealistic After image from photo + sketch + prompt | gemini-2.5-flash-image | **1m 11s** |
| 7 | `validate-render` | Vision: compares Before and After, flags hallucinated structures | gemini-2.5-flash | 9.0s |
| 8 | `retry-if-needed` | Regenerates the render only if step 7 found hallucinations (it didn't here) | gemini-2.5-flash-image (conditional) | 1.2s (no retry) |
| 9 | `save-results` | Writes design JSON, image paths, validation result to `pipeline_jobs`; charges the render credit | none | 1.6s |
| 10 | `save-design-record` | Hydrates `design_records` + signed render URL so the email link works tab-or-no-tab | none | 1.4s |
| 11 | `email-plan-ready` | Sends the plan-ready email via Resend | none | 0.4s |

**Data flow in one line:** photo → fingerprint (geometry facts) → design JSON (the plan) → layout projection + sketch (spatial guides) → visual prompt (assembled by code, not AI) → render → validation → save → email.

---

## 2. Where the 4 minutes goes

Roughly **3m 50s of the 4m 04s is Gemini inference**. Everything else (downloads, uploads, DB writes, email) totals about 6 seconds. The pipeline is not slow because of your infrastructure; it's slow because you ask Gemini seven questions in a row and two of them are essays.

The two dominant costs:

- **`garden-design` (84s, 34% of the run).** Latency on text models is driven almost entirely by *output* length, not prompt length. This step demands a JSON document with minimum counts on everything (10+ plants each with 4 seasonal interest fields, 9+ tasks, 8+ maintenance items, 6+ cost lines, 8+ layout elements...). That's a 10–12k token output, and at Flash's generation speed that's 80–90 seconds. The 84s observed is exactly what the prompt asks for.
- **`generate-render` (71s, 29%).** Image generation is a mostly fixed cost — flash-image takes 60–75s for a high-detail scene regardless of prompt length. Editing this prompt will change *quality*, not speed.

The fixable middle:

- **`spatial-fingerprint` (33s)** — large structured output (~2k tokens) plus a lot of numeric estimation work (photogrammetry fields). Some headroom by trimming.
- **`control-points` (22s)** — suspicious. The requested output is ~12 lines of JSON. 22 seconds for that means the model is spending nearly all of it "thinking" (Flash 2.5 reasons by default). A `thinkingBudget: 0` config or a tighter prompt could cut this to ~5s. **Also worth asking: is this step earning its keep at all?** Its output (`controlPoints`, `g2Grid`) is only written to the DB in `save-results` — nothing downstream in the pipeline consumes it. If the frontend grid overlay uses it, fine; if not, that's 22 free seconds.
- **Sequencing.** `control-points` only uses the fingerprint as a *fallback* if its own call fails. It could run in parallel with `spatial-fingerprint`, saving ~22s, the same trick already applied to steps 5a/5b.

**Realistic optimisation ceiling without touching quality: ~3m 00–3m 10s** (parallelise control-points, kill its thinking budget). Going below ~2m 30s means shrinking the `garden-design` output, which is a product decision, not a tuning one. And remember the email safety net means nobody is staring at a spinner for the full duration anyway.

---

## 3. Step-by-step with verbatim prompts

Template variables appear as `${...}` — the key below each prompt explains what gets injected at runtime.

### Step 2 — `spatial-fingerprint` (lines 306–405)

**Job:** survey the photo, extract only permanent fixed facts plus the perspective/scale numbers the projection maths needs later. No design opinions allowed.
**Inputs:** customer photo + user-supplied orientation. **Output:** one JSON fingerprint. **Config:** temperature 0.1, JSON mode.

```text
You are a site surveyor. Study this garden photograph and extract ONLY permanent, fixed spatial data. Do not suggest any design.

Return ONLY valid JSON (no markdown):
{
  "cameraPosition": "where the camera is standing and looking",
  "cameraHeight": "ground level | raised | elevated",
  "viewDirection": "compass direction camera points, e.g. looking north",
  "fieldOfView": "narrow corridor view | wide open view | square garden view",
  "gardenShape": "precise shape description, e.g. narrow rectangle ~3m wide x 10m long",
  "gardenWidth": "approximate width at camera position",
  "gardenDepth": "approximate depth from camera to rear wall",
  "aspectRatio": "width:depth ratio, e.g. 1:3",
  "groundLevel": "flat | slopes away from camera | slopes toward camera | terraced",
  "leftBoundary": "material, height, condition, any features",
  "rightBoundary": "material, height, condition, any features",
  "rearBoundary": "material, height, condition, any features",
  "frontBoundary": "what is visible at the camera position",
  "boundaries": ["list every visible boundary wall, fence or edge with detail"],
  "immovableStructures": ["every fixed structure: type, position, approximate size, material, condition"],
  "existingVegetation": ["every large established plant that cannot easily be moved: species if known, position, approx size"],
  "accessPoints": ["every visible entry/exit point"],
  "groundSurface": "current ground covering and any existing path positions",
  "lightAspect": "apparent light direction, shadow patterns, obvious shade areas",
  "notes": "any other permanent constraints: utilities, drains, overhead wires, neighbouring structures",

  "cameraElevationAngle": (number, estimated angle in degrees between camera lens and the horizon — typical garden photos range 5 to 35),
  "horizonLinePercent": (number, 0–100 — vertical position of the horizon line as a percentage from the TOP of the image. If the true horizon is obscured, use the base of the rear boundary wall or fence as a proxy. e.g. 33 means horizon is one-third down),
  "vanishingPointXPercent": (number, 0–100 — horizontal position of the vanishing point as a percentage across the image width; straight-on photos ≈ 50),
  "foregroundToBackgroundRatio": (number, 0.0–1.0 — proportion of visible garden that is foreground vs distance; 1.0 = all foreground, 0.0 = all distance),
  "foregroundBoundaryYPercent": (number 0-100 — the vertical position of the foreground edge of the garden as a percentage from the TOP of the image. This is the bottom edge of the visible ground plane where the garden meets the camera position. For photos where the garden foreground fills the lower portion of the frame this will be 75-90. For elevated camera positions it may be 60-70.),

  "scaleCalibrationObject": "description of the object used to calibrate real-world scale — e.g. 'concrete block wall, 5 courses visible', 'standard fence panel', 'brick pier'",
  "scaleCalibrationHeightMetres": (number — estimated real-world height of the calibration object in metres. Concrete block course = 0.215m, brick course = 0.075m, standard fence panel = 1.8m, standard door = 2.0m),
  "scaleCalibrationPixelHeightPercent": (number 0–100 — the pixel height of the calibration object as a percentage of the total image height),

  "plotWidthMetres": (number — estimated real-world width of the garden plot in metres, derived from scale calibration and perspective geometry),
  "plotDepthMetres": (number — estimated real-world depth of the garden plot in metres, derived from scale calibration and perspective geometry),
  "perspectiveGridColumns": (number — estimated number of 1m-wide columns that fit across the plot width),
  "perspectiveGridRows": (number — estimated number of 1m-deep rows that fit from foreground to rear boundary),

  "elevationData": [
    {
      "elementType": "RetainingWall|RaisedBed|Steps|Terrace|Wall|Pergola|Arbour|Structure",
      "boundaryFace": "rear|left|right|freestanding",
      "baseHeightMetres": (number — height of the base of this element above the lowest site ground level),
      "elementHeightMetres": (number — height of this element itself, not cumulative),
      "gridPosition": "grid reference e.g. A1-A3 or B2",
      "description": "brief description of the element"
    }
  ],

  "boundaryPolygon": [
    {"x": (number 0.0–1.0, normalised from LEFT edge of photo), "y": (number 0.0–1.0, normalised from TOP edge of photo)}
  ]
}

PERSPECTIVE FIELD INSTRUCTIONS:
- cameraElevationAngle: look at where the camera is relative to the ground. A photo taken at near-ground level looking slightly up = ~5-10 degrees. A photo taken standing, looking down = ~20-35 degrees.
- horizonLinePercent: identify where the horizon (or the base of the rear wall/fence) sits in the image. If the rear wall base is at 30% from top, use 30. For typical garden photos taken standing up, this is usually 25-45.
- vanishingPointXPercent: for straight-ahead shots this is ~50. For gardens shot at an angle it shifts left or right.
- foregroundToBackgroundRatio: if most of the image shows the far end of the garden with little foreground, this is low (~0.3). If the foreground fills most of the image, this is high (~0.8).
- foregroundBoundaryYPercent: identify the lowest visible point of the garden ground plane in the image. This is typically near the bottom of the frame for ground-level photos. Express as a percentage from the top of the image.
- scaleCalibrationObject: find the most reliable scale reference in the photo. Prefer objects with standardised dimensions: fence panels (1.8m high), concrete block courses (0.215m each), brick courses (0.075m each), standard doors (2.0m). Count courses or panels visible to derive real-world height.
- scaleCalibrationPixelHeightPercent: measure the pixel height of the calibration object as a fraction of the total image height, expressed as a percentage 0–100.
- plotWidthMetres / plotDepthMetres: using the scale calibration and the perspective geometry (horizon line + vanishing point), estimate the real-world site dimensions. Cross-check against gardenWidth and gardenDepth text fields.
- perspectiveGridColumns / perspectiveGridRows: divide plotWidthMetres and plotDepthMetres by 1.0 to get grid counts. Round to nearest integer, minimum 2.
- elevationData: list every element that sits above the main ground plane. Include retaining walls, raised beds, steps, terraces, boundary walls with climbers, pergolas, and any structure that raises planting or features. For boundary walls, baseHeightMetres is typically 0.0 (they start at ground). For raised beds, baseHeightMetres is 0.0 and elementHeightMetres is the raised bed wall height (e.g. 0.45m). If no raised elements are visible, return an empty array [].

BOUNDARY POLYGON INSTRUCTIONS:
The boundaryPolygon must trace the inner edge of the VISIBLE GARDEN BOUNDARY in this perspective photo.
- Trace the fence line, wall line, or plot edge as it appears in the photo
- Include the left boundary wall/fence, rear boundary, right boundary wall/fence, and front edge (near camera position)
- Use at least 4 points, up to 12 for complex shapes
- Points must be in order (clockwise preferred)
- Normalise ALL coordinates: x=0.0 is LEFT edge of photo, x=1.0 is RIGHT edge; y=0.0 is TOP, y=1.0 is BOTTOM
- The polygon must enclose ONLY the actual garden space, NOT the sky, adjacent buildings, or areas outside the garden

Garden orientation (user-supplied): ${orientation || 'unknown'}
Be as precise as possible. This data will lock geometry in all subsequent generation steps.
```

**Evaluation notes:**
- This prompt is really two prompts stapled together: a *surveyor's notebook* (descriptive text fields) and a *photogrammetry rig* (the numeric perspective/scale fields). Both are needed downstream, but the mixing means one call carries two jobs and the output is large, which is most of the 33s.
- The standardised-dimension trick (block course = 0.215m etc.) is sound practice and worth keeping.
- `boundaryPolygon` and `elevationData`: check what actually consumes these. If nothing does yet, they're paid-for output tokens.

---

### Step 3 — `control-points` (lines 509–607)

**Job:** pin the four corners of the garden ground plane in pixel space. Code then computes a homography (proper matrix maths, lines 609–720) to derive a true perspective grid. The AI only finds corners; the geometry is deterministic.
**Inputs:** customer photo. **Output:** 4 corner coordinates + grid counts. **Config:** temperature 0.1, JSON mode. Falls back to fingerprint-derived estimates if it fails.

```text
You are a precise computer vision system analyzing a garden photograph.

Your task is to identify the exact pixel coordinates of four specific corner points that define the garden ground plane boundary. These four points are the corners of the actual garden area visible on the ground.

POINT 1 — FOREGROUND LEFT CORNER:
The exact point on the ground where the left boundary wall or fence meets the nearest edge of the garden to the camera. This is the bottom-left corner of the garden ground area. It sits at ground level where the left wall base meets the foreground.

POINT 2 — FOREGROUND RIGHT CORNER:
The exact point on the ground where the right boundary wall or fence meets the nearest edge of the garden to the camera. This is the bottom-right corner of the garden ground area. It sits at ground level where the right wall base meets the foreground.

POINT 3 — REAR LEFT CORNER:
The exact point on the ground where the left boundary wall or fence meets the base of the far boundary wall. This is the top-left corner of the garden ground area as seen from the camera.

POINT 4 — REAR RIGHT CORNER:
The exact point on the ground where the right boundary wall or fence meets the base of the far boundary wall. This is the top-right corner of the garden ground area as seen from the camera.

These four points form a quadrilateral that represents the garden ground plane in perspective.

Also estimate:
- How many 1m columns fit across the garden width
- How many 1m rows fit from foreground to rear boundary
- The approximate real-world width and depth in metres

Return ONLY this exact JSON with no markdown:
{
  "frontLeft":  { "xNorm": 0.0, "yNorm": 0.0 },
  "frontRight": { "xNorm": 0.0, "yNorm": 0.0 },
  "rearLeft":   { "xNorm": 0.0, "yNorm": 0.0 },
  "rearRight":  { "xNorm": 0.0, "yNorm": 0.0 },
  "gridColumnsCount": 6,
  "gridRowsCount": 6,
  "plotWidthMetres": 6.0,
  "plotDepthMetres": 8.0
}

All xNorm and yNorm values must be between 0.0 and 1.0 where:
- xNorm 0.0 = left edge of image, xNorm 1.0 = right edge of image
- yNorm 0.0 = top edge of image, yNorm 1.0 = bottom edge of image

Be as precise as possible. These coordinates will be used for geometric calculations.
```

**Evaluation notes:**
- Clear, well-scoped prompt. The 22s is not the prompt's fault — it's a tiny output, so the time is almost certainly Flash's default reasoning ("thinking") phase. Setting a zero/low thinking budget in the config should cut this dramatically.
- **The big question:** the resulting `g2Grid` is persisted to the DB but never used by any later pipeline step (the render's plant positions come from `projectToImage`, which uses the *fingerprint's* perspective fields, not the homography grid). Either wire the better grid into the projection, or accept this step is purely for the frontend overlay, or drop it.
- It duplicates `plotWidthMetres` / `plotDepthMetres` / grid counts already estimated by the fingerprint. Two estimates, no arbitration between them.

---

### Step 4 — `garden-design` (lines 808–1034)

**Job:** the full professional proposal. Everything the customer reads in the plan comes out of this single call.
**Inputs:** photo + fingerprint + style + region/currency/creativity settings. **Output:** one JSON matching `DESIGN_SCHEMA` (lines 118–294), typically 10–12k tokens. **Config:** temperature 0.4, JSON mode, maxOutputTokens 65,536.

**System instruction (verbatim):**

```text
You are a senior landscape architect and botanist producing a full professional garden design proposal document.

The site constraints (siteConstraints) have already been extracted by a separate spatial analysis step. Use the provided fingerprint verbatim for the siteConstraints field — do not re-derive it from the photo.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 1 — COMPLETENESS
═══════════════════════════════════════════════════════════════
Every single field in the schema MUST be populated with real, specific content.
Never return null, empty strings, empty arrays, or placeholder text like "TBD" or "N/A".
A proposal with empty fields is a FAILED response.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 2 — MINIMUM COUNTS (non-negotiable)
═══════════════════════════════════════════════════════════════
- overview.objectives: minimum 5 items
- siteAnalysis.existingFeatures: minimum 3 items
- siteAnalysis.microclimates: minimum 2 items
- spatialLayout.zones: minimum 4 zones
- spatialLayout.circulationRoutes: minimum 2 routes
- spatialLayout.focalPoints: minimum 3 items
- plantingSpecification.plants: minimum 10 species across all layers
- hardscapeSpecification.materials: minimum 5 materials
- hardscapeSpecification.lighting: minimum 3 fixtures
- soilAndIrrigation.irrigationZones: minimum 2 zones
- implementationPlan.tasks: minimum 9 tasks (3 per phase across 3 phases)
- maintenanceSchedule.tasks: minimum 8 tasks (2 per season across 4 seasons)
- costEstimate.lines: minimum 6 categories

═══════════════════════════════════════════════════════════════
CRITICAL RULE 3 — PLANT ACCURACY
═══════════════════════════════════════════════════════════════
All plants MUST be appropriate for the observed hardiness zone, sun conditions, and soil.
All plants MUST suit the selected design language.
Every plant MUST have all 4 seasonalInterest fields populated with specific detail.
Every plant MUST have realistic mature size, spacing, hardiness rating, sun and water requirements.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 4 — COSTS (self-implementation framing)
═══════════════════════════════════════════════════════════════
This plan is for a gardener doing the work themselves, not hiring contractors.
All cost lines MUST reflect what the homeowner will actually spend:
- Plants and bulbs (retail prices from garden centres)
- Compost, mulch, topsoil, and soil amendments
- Hard landscaping materials: gravel, paving slabs, timber, edging
- Tools and equipment they may need to buy or hire
- Irrigation fittings and hosepipe where relevant
DO NOT include: labour charges, contractor fees, or designer fees.
Category labels: "Plants & Bulbs", "Compost & Mulch", "Paving Materials", "Tools & Equipment" etc.
Use realistic retail pricing. Never use 0 for any cost value.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 5 — GEOGRAPHIC PLANT SUITABILITY
═══════════════════════════════════════════════════════════════
Only suggest plants that thrive in the specified climate zone.
For Ireland/UK: plants must be hardy to at least -10°C, tolerating wet winters and cool summers.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 6 — SITE BOUNDARIES
═══════════════════════════════════════════════════════════════
Every plant placement, hardscape suggestion, and layout change MUST work within and around the fixed structures from the fingerprint.
The visualPrompt field MUST begin with: "Photorealistic garden design render. PRESERVE EXACTLY: [list all walls, fences, buildings from fingerprint]. Work WITHIN these existing structures."

═══════════════════════════════════════════════════════════════
CRITICAL RULE 7 — GRID LOCATION ASSIGNMENT (non-negotiable)
═══════════════════════════════════════════════════════════════
For EVERY plant in plantingSpecification.plants, populate the gridLocation field on the plant object itself.
This gridLocation is NOT the same as layoutDescription — it is the specific grid cell this individual plant occupies.
It is mandatory on every plant object. It is separate from and in addition to layoutDescription.elements.

Format: exactly one column letter (A, B, C, D, E, or F) immediately followed by one row number (1, 2, 3, 4, 5, or 6).
Correct examples: "B3", "D1", "A6", "F4". Wrong examples: null, "", "e.g. B3", "B 3", "Grid B3", "B-3".

Grid orientation: Columns A–F run left to right (A = far left, F = far right). Rows 1–6 run top to bottom (1 = rear, 6 = front).
- Every plant object MUST have gridLocation set to a valid two-character string — never null, never empty, never missing
- Do not assign the same gridLocation to more than 2 plants
- Spread plants across the full A–F, 1–6 grid

HARD CONSTRAINT — GRID BOUNDS (absolutely non-negotiable):
- Valid columns are A, B, C, D, E, F ONLY. Never use G, H, or any letter beyond F.
- Valid rows are 1, 2, 3, 4, 5, 6 ONLY. Never use 7, 8, or any number higher than 6.
- Any gridLocation outside A–F × 1–6 is INVALID and must not appear in your output.
- If more than 12 plants are included, multiple plants MUST share grid squares or be grouped — do NOT invent out-of-range coordinates to fit them.

Each plant must include a 'location' field: a 2–5 word plain English description of where that plant is positioned in the garden (e.g. 'Rear left border', 'Central focal point', 'Along back wall'). Do not use grid codes.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 8 — LAYOUT DESCRIPTION (master spatial record)
═══════════════════════════════════════════════════════════════
The layoutDescription field declares the zones, paths, surfaces, and structural features of the design.
Note: layoutDescription.elements covers AREAS and FEATURES — NOT individual plants. Individual plants have their own gridLocation field on each plant object (Rule 7 above).
Populate layoutDescription.elements with EVERY spatial area or feature you are proposing:
- Every zone (entertainment area, lawn, vegetable bed, seating area, etc.) — with its grid location
- Every path and circulation route — with its grid location and surface material
- Every surface treatment (paving, gravel, decking, lawn, bark chip area) — with its grid location
- Every structural feature (pergola, raised bed, water feature, screen, trellis) — with its grid location
- Every distinct planting bed or area (as an area, not individual plants) — with its grid location
- Every focal point — with its grid location
Nothing may appear in the Concept Base Plan image or the photorealistic render that is not declared in layoutDescription.elements first.
The layoutNarrative must be a plain-language spatial walkthrough of the complete design.
Minimum 8 elements in layoutDescription.elements.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 9 — KEY CONSIDERATIONS
═══════════════════════════════════════════════════════════════
Populate keyConsiderations by evaluating EVERY heading in the master list below against the full design. Include a heading only if it has genuine bearing on this specific design. Omit any heading with no relevance. Always include "Measurements on Drawings" and "Maintenance Guidance" regardless of the design.

Minimum 3 items. Maximum 12 items.

[Evaluation criteria for 18 headings — Planning Permission, Protected Trees, Boundary & Neighbour Considerations, Underground Services, Soil Assessment, Ground Stability, Structural Integrity, Aspect & Microclimate, Wildlife & Ecology, Materials Specification, Measurements on Drawings, Drainage & Levels, Lighting & Electrical Implementation, Irrigation Specification, Phasing, Access for Plant & Machinery, Contractor Coordination, Maintenance Guidance — each with fixed verbatim guidance copy the model must reproduce exactly. Full text at lines 924–968.]

═══════════════════════════════════════════════════════════════
TONE
═══════════════════════════════════════════════════════════════
Plain, direct, technical English. No poetry or flowery language.

═══════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════
Return ONLY valid JSON. No markdown fences. No commentary.
```

**User message (verbatim):**

```text
Analyse this garden and produce a COMPLETE professional garden design proposal.

Client: ${clientName}
Design Language: ${style}

Design Language — Extended Brief:
${STYLE_DESCRIPTIONS[style]}   ← only injected if the style has an extended brief; currently only 'Urban Party Garden' has one (lines 776–806: plant palette, hardscape guidance, fire pit requirement, trailing-plant priority)

Geographic Region: ${region}
Plant Climate: ${hardinessZone ? 'Only suggest plants rated for USDA {zone} or colder...' : 'Only suggest plants proven to thrive in {country} — hardy to at least -10°C, tolerating wet winters and cool summers for this region.'}
Cost Currency: All cost estimates must be provided in ${currency}. Use realistic local market prices for ${country}.
Garden Orientation: ${orientation} — The garden faces ${orientation}. Factor sun exposure accordingly.

CREATIVITY LEVEL: ${creativityLevel} of 5 — ${creativityDescription}
This creativity level is NON-NEGOTIABLE. It defines the scope and ambition of every part of the proposal:
- The plant list must reflect this level: Level 1 = containers/pots only; Level 5 = full in-ground scheme with architectural specimens.
- The hardscape specification must reflect this level: Level 1 = minor surface changes only; Level 5 = extensive new hard landscaping.
- The implementation plan phasing must reflect this level of work.
- The cost estimate must reflect this scope: Level 1 should be modest; Level 5 should reflect full transformation costs.
- The visualPrompt field must explicitly describe the scope of change matching this level.

PRE-EXTRACTED SITE FINGERPRINT (use this verbatim for siteConstraints):
${JSON.stringify(fingerprint, null, 2)}

Return a single JSON object matching this exact schema. Every field must be populated. No nulls. No empty arrays. No empty strings.

Minimum counts you must meet:
- objectives: 5+, existingFeatures: 3+, microclimates: 2+, zones: 4+
- circulationRoutes: 2+, focalPoints: 3+, plants: 10+ across all layers
- hardscape materials: 5+, lighting: 3+, irrigationZones: 2+
- implementationPlan tasks: 9+ across 3 phases
- maintenanceSchedule tasks: 8+ across 4 seasons
- costEstimate lines: 6+ with realistic non-zero ${currency} values
- recommendations: 2–4 optional enhancements that would benefit this specific garden — drip irrigation, smart lighting, edging systems, composting, water harvesting etc. Each must include a genuine justification tied to this garden's specific conditions. Do not include anything already specified in the main design.

SCHEMA:
${DESIGN_SCHEMA}   ← the full 175-line schema from lines 118–294: overview, siteAnalysis, designConcept, spatialLayout, plantingSpecification, hardscapeSpecification, soilAndIrrigation, implementationPlan, maintenanceSchedule, recommendations, costEstimate, climateZone, siteConstraints, layoutDescription, visualPrompt, confidence, caveats, keyConsiderations
```

**Evaluation notes:**
- This is the engine room and the bottleneck. The 84s is the *output* being written, so prompt clarity edits won't change the speed; only cutting required output will.
- The minimum counts appear **twice** (Rule 2 in the system instruction, again in the user message). Redundant but harmless; pick one home if you're tidying.
- Several format instructions live *inside* schema string values (e.g. `colourPalette` describes its own structure in prose, the `cultivar` field carries "never use the word null"). It works, but it makes the schema part contract and part instruction manual — worth deciding which it is. Code already defends against the known failure modes (`clampGridLocations` fixes invalid grid refs and "null" cultivars after the fact).
- Rule 9's 18 fixed guidance paragraphs (~800 words) are reproduced verbatim by the model into the output. That's paid output tokens for static copy. Cheaper pattern: have the model return only the heading *names* it deems relevant, and have code attach the canonical copy. Same result, hundreds of tokens saved, zero risk of paraphrase drift.
- Only one style has an Extended Brief. The other styles run on their name alone, which means much weaker steer on plant palette and features. If Urban Party renders look better than the rest, this is why.

### Step 4½ — `clampGridLocations` (code, no AI, lines 1036–1090)

Post-processing safety net: normalises every plant's `gridLocation` to A–F × 1–6, assigns fallback cells to plants missing one (max 2 per cell), scrubs "null" cultivars, defaults `gridZ` to 0. Zero cost, catches the model's known failure modes.

---

### Step 5a — `validate-layout` (lines 1337–1391, projection maths 407–507)

**Job:** code converts each plant's grid cell to real metres, then projects to pixel coordinates using the fingerprint's perspective numbers (`projectToImage`). Gemini then sanity-checks the projected list against the photo. Runs in parallel with 5b.
**Output:** pass/fail + plain-text corrections that get appended to the visual prompt.

```text
You are a spatial accuracy checker. You are given a garden photograph and a list of projected element positions derived mathematically from the camera geometry. Check whether each position makes spatial sense for this garden.

Garden fingerprint summary: plot width ${plotWidthMetres}m, depth ${plotDepthMetres}m, horizon at ${horizonLinePercent}% from top, foreground at ${foregroundBoundaryYPercent}% from top.

Projected positions to validate:
${elementList}   ← one line per plant: "Plant 3 (Fatsia japonica, grid B2): 38% across, 41% down — at 1.5m × 6.2m × 0m"

For each element, check: is this position inside the garden boundary? Is the depth (Y position) consistent with the row number — rear elements should be near the top of the frame, foreground elements near the bottom? Is the height offset (Z) plausible for this element type?

Return ONLY valid JSON:
{
  "passed": true,
  "confidence": 85,
  "corrections": "any specific corrections needed as a plain text string, or empty string if passed"
}
```

**Evaluation notes:** sensible cheap check. Note it validates positions produced by `projectToImage` (fingerprint-based), not the homography grid from `control-points` — reinforcing that the homography work is currently orphaned.

---

### Step 5b — `concept-base-plan` (lines 722–772) — *image generation*

**Job:** the top-down watercolour sketch. Doubles as the spatial guide image fed into the final render. Runs in parallel with 5a.

```text
You are given the original garden photograph and the spatial fingerprint below. Draw a precise top-down orthogonal sketch of THIS SPECIFIC GARDEN. Study the photo carefully — your drawing must match the actual boundaries, shape, and permanent structures visible in this photo.

Draw ONLY the following design elements at their stated positions. Do not invent anything not listed here:
${layoutNarrative}

${layoutElements}   ← one line per layoutDescription element: "- [B2-C3] Fire Pit Zone (Zone): circular gravel area with built-in seating — porcelain paving"

STYLE: Clean black ink outlines on cream/off-white paper background. Light watercolour fills: lawn = soft green, paving = warm sand/grey, planting beds = terracotta blush. Hand-drawn sketch quality.

CRITICAL — DO NOT DRAW ANY OF THE FOLLOWING:
- No grid lines of any kind
- No column letters (A, B, C, D, E, F)
- No row numbers (1, 2, 3, 4, 5, 6)
- No numbered circles or plant markers
- No compass rose
- No scale bar
- No text labels of any kind except zone names if they help clarify the layout
- No annotations

The sketch must have clean empty margins on all four sides — no more than 3% of the image width on each side — so that grid labels can be added programmatically after generation.

Geometric accuracy of the garden boundary shape is the top priority. The boundary outline must match the actual garden shape from the photo.
```

**Evaluation notes:** despite the comment "(shared with Step 3)" in the code, this prompt does *not* actually inject the fingerprint text — only the photo and layout list (the `_fingerprint` parameter is unused). The opening line "and the spatial fingerprint below" is therefore a small lie to the model. Harmless, but tidy it if you redesign.

---

### Step 6 — `generate-render` — *the After image*

Two parts: a **master visual prompt assembled by code** (`step4_buildVisualPrompt`, lines 1092–1242 — no AI involved in writing it), then the **image call** (`step5_generateRender`, lines 1244–1284) which wraps it in a further constraint preamble. The model receives: Before photo + sketch + combined text.

**Constraint preamble (from step5, verbatim):**

```text
TASK: Redesign THIS EXACT GARDEN shown in the reference photo. Do not invent a new garden. Do not change the camera position. Do not change the garden width or shape.

CRITICAL CONSTRAINTS — YOU MUST NOT VIOLATE THESE:
1. DO NOT add any buildings, house extensions, conservatories, outbuildings, sheds, garages, or any structure that does not exist in the original photo.
2. DO NOT add or alter any neighbouring houses, rooflines, chimneys, walls, or structures visible beyond the garden boundary.
3. The sky must match the original photograph exactly — same sky, same clouds, same colour, same horizon. Do not alter anything above the garden boundary.
4. Everything beyond the garden boundary (neighbouring properties, sky, trees outside the boundary, roads) must be pixel-for-pixel identical to the original photo. Do not touch it.
5. Only modify what is strictly inside the garden boundary: planting, lawn, paving, paths, garden structures (pergolas, raised beds, water features) that were already present or are explicitly requested.
6. The garden boundary walls, fences, and edges must remain in exactly the same position as in the original photo. Do not extend, shrink, or reshape the garden footprint.
7. If in any doubt whether something is inside or outside the garden boundary, leave it unchanged.

GEOMETRY CHECK — before generating, confirm:
- Is the garden the same width as the photo? If the photo shows a narrow plot, the render must show a narrow plot.
- Is the camera at the same height and angle as the photo?
- Are the same boundary walls visible at the same heights?
If any answer is NO, correct it before generating.

Image 1 is the BEFORE photo. Image 2 is the top-down layout sketch showing exactly where each zone, path, and planting area should appear. Use Image 2 as the spatial layout guide — the perspective render must reflect this layout.

This is the BEFORE photo of the garden. Generate an AFTER version of THIS EXACT SAME GARDEN with the following design applied. The garden must be immediately recognisable as the same space.

[master visual prompt follows]
```

**Master visual prompt (assembled by `step4_buildVisualPrompt`, verbatim with injection key):**

```text
Full-frame wide-angle photorealistic garden photograph. The entire garden space must fill the complete image frame from edge to edge with no empty borders, no letterboxing, and no partial views. All boundaries of the garden — every wall, fence, path edge, and planting bed — must be visible and fully rendered within the frame.

SPATIAL LOCK — THIS RENDER MUST SHOW THE SAME GARDEN AS THE BEFORE PHOTO:

CAMERA POSITION: ${fingerprint.cameraPosition}
The After render must be photographed from EXACTLY the same position and height as the Before photo. Same viewpoint. Same angle.

GARDEN GEOMETRY TO PRESERVE EXACTLY:
- Shape: ${fingerprint.gardenShape}
- Width: ${fingerprint.gardenWidth}
- Depth: ${fingerprint.gardenDepth}
- Aspect ratio: ${fingerprint.aspectRatio}
- Ground level: ${fingerprint.groundLevel}
DO NOT change the garden dimensions. DO NOT widen or shorten it. DO NOT change the perspective or camera angle.

BOUNDARIES — PRESERVE EXACTLY AS PHOTOGRAPHED:
- Left boundary: ${fingerprint.leftBoundary}
- Right boundary: ${fingerprint.rightBoundary}
- Rear boundary: ${fingerprint.rearBoundary}
Every wall and fence must appear at the same height and position.

FIXED STRUCTURES — THESE MUST APPEAR IN THE AFTER IMAGE:
${fingerprint.immovableStructures as bullet list}
Do not remove, hide or replace these structures.

EXISTING LARGE PLANTS — RETAIN UNLESS EXPLICITLY REMOVED:
${fingerprint.existingVegetation as bullet list}

${creativityBlock}   ← one of 5 fixed blocks by level, e.g. Level 4: "A significant garden transformation introducing structural elements and bold planting choices... Rotate from this feature pool and pick up to 2-3 per generation but never allow the garden to appear overcrowded: pergola or garden arch with climbing plants, raised timber or sleeper beds, built-in seating or bench wall, defined dining area with paving, fire pit or chiminea zone, curved or shaped lawn edges with bold border planting, retaining walls creating a gentle level change." (full text of all 5 at lines 1110–1143)

GRAVEL SURFACES — HARD CONSTRAINT:
Gravel surfaces may only appear when the design style is Japanese Zen or Mediterranean. Even then, gravel should be used as an accent only — between stepping stones or around a focal plant — never covering the majority of the garden floor. For all other design styles, do not use gravel as a ground surface under any circumstances.

DESIGN LAYOUT — THIS IS THE MASTER SPATIAL RECORD (the render is a photorealistic version of this layout):
${layoutNarrative}

SPATIAL ELEMENTS TO SHOW (every element listed here must appear at its stated depth in the scene — nothing else may be added):
${spatialElements}   ← each layoutDescription element with a code-derived depth phrase: rows 1-2 → "in the upper distance near the rear boundary", rows 3-4 → "at mid-distance in the garden", rows 5-6 → "close in the foreground"

PLANT PLACEMENT IN SCENE (place each species at its correct perspective position):
${plantPositions}   ← first 15 plants, same depth-phrase treatment

PRECISE ELEMENT POSITIONS IN THIS IMAGE FRAME:
The following positions are mathematically derived from the camera geometry. Place each element as close as possible to these positions:
${projectedPositionsText}   ← from validate-layout: "Plant 3 (Fatsia japonica, grid B2): 38% across, 41% down the image frame, at 1.5m × 6.2m × 0m" — plus any SPATIAL CORRECTIONS appended if validation flagged issues

These percentages represent position across (left-right) and down (top-bottom) the image frame. An element at 50% across and 40% down sits in the horizontal centre of the frame roughly one third down from the top.

WHAT YOU MUST NOT CHANGE:
- The shape or size of the garden space
- The position or height of any boundary wall or fence
- Any fixed building or permanent structure
- The camera viewpoint or angle

The person looking at the Before and After must immediately recognise it as the SAME garden.

DESIGN STYLE: ${designJSON.visualPrompt} ${style} style.   ← the model-authored visualPrompt from garden-design, which itself begins "Photorealistic garden design render. PRESERVE EXACTLY: [walls/fences/buildings]..."

FINAL CHECK BEFORE GENERATING:
- Is the garden the same shape as the Before? Must be YES
- Is the camera at the same position? Must be YES
- Are all boundary walls in the same place? Must be YES
- Does it look like the same garden? Must be YES
- Does the planting style match creativity level ${creativityLevel}? Must be YES

Style: Photorealistic garden photography. Natural daylight. No text overlays. No compass. No grid. No annotations.

IMAGE CLEANLINESS — MANDATORY:
Do NOT draw any grid lines, column letters, row numbers, reference numbers, scale bars, numbered circles, or any alphanumeric annotation on the generated image.
Do NOT add any markers, labels, or text inside the image.
The image must contain ONLY the photorealistic garden scene — no overlays of any kind.
```

**Evaluation notes:**
- The "same garden" constraint is stated **four separate times** (SPATIAL LOCK, the numbered CRITICAL CONSTRAINTS, WHAT YOU MUST NOT CHANGE, FINAL CHECK). With image models repetition genuinely helps adherence, so this is defensible — but four phrasings of the same rule also create surface area for contradiction. If you redesign, consolidate to two: one hard list up top, one final check.
- The `DESIGN STYLE` line re-injects the model-authored `visualPrompt`, which *itself* repeats the PRESERVE EXACTLY structure list — so the structures appear three times in the final text. Pick one canonical source (the fingerprint) and strip it from the design JSON's visualPrompt.
- Note the asymmetry: the retry path (`retry-if-needed`) calls `step5_generateRender` **without the sketch image**, so a retried render has weaker spatial guidance than the original attempt. Probably unintended.
- The 71s is the image model working; the prompt length is not the cost.

---

### Step 7 — `validate-render` (lines 1286–1333)

**Job:** Before/After comparison, hallucination detection. Drives the conditional retry.

```text
You are a quality checker for a garden design app.

Compare these two images:
Image 1: The original garden photo (Before)
Image 2: The AI-generated render (After)

Answer these questions:
1. Is the garden the same shape in both images?
2. Are the boundary walls in the same position in both images?
3. Is the camera viewpoint the same in both images?
4. Could a person standing in the Before garden recognise the After image as the same space?
5. Are there any structures in the After that do not exist in the Before (invented staircases, pergolas, buildings etc)?

Return ONLY valid JSON, no markdown:
{
  "sameGarden": true,
  "sameViewpoint": true,
  "boundariesRespected": true,
  "recognisableSameSpace": true,
  "hallucinatedStructures": [],
  "overallPass": true,
  "failReasons": []
}
```

**Evaluation notes:** clean and cheap. One wrinkle: question 5's examples include "pergolas" as a hallucination, yet creativity levels 4 and 5 *deliberately* introduce pergolas from the feature pool. A legitimate level 5 pergola can get flagged as a hallucination and trigger a needless retry (which then runs sketch-less, see above). The validator should be told the creativity level and the declared layout elements so it only flags structures that were never specified.

### Step 8 — `retry-if-needed` (lines 1560–1588)

Only fires on `hallucinatedStructures.length > 0`. Reuses the full visual prompt plus:

```text
PREVIOUS ATTEMPT FAILED — THESE SPECIFIC ISSUES MUST BE CORRECTED:
${failReasons}
HALLUCINATED STRUCTURES DETECTED — REMOVE THESE COMPLETELY: ${hallucinatedStructures}. These do not exist in the original garden photo and must not appear in the generated image.
Fix all of these in this new attempt. The result must pass all checks.
```

Falls back to the first render on any retry failure. Retried renders are **not re-validated** — one retry, take it or leave it. Reasonable cost control.

### Steps 9–11 — persistence and delivery (no AI)

- `save-results`: writes everything to `pipeline_jobs`; only charges the render credit if a render actually exists.
- `save-design-record`: upserts `design_records` keyed by session, mints the reference number, signs a 30-day render URL.
- `email-plan-ready`: the Phase 1a safety net email via Resend. Failure never fails the job.

---

## 4. Diagnosis — what takes so long, in plain terms

1. **It's all Gemini.** 95% of wall time is model inference. Infra is 6 seconds of a 244 second run.
2. **Text latency = output length.** `garden-design` (84s) and `spatial-fingerprint` (33s) are slow because of what they're asked to *write*, not what they're asked to read. The schema's minimum counts are a quality decision with a direct latency price tag: every extra mandatory plant costs roughly 2 to 3 seconds.
3. **Image generation is a fixed toll.** ~71s for the render, ~10s for the sketch. Prompt redesign here buys quality and consistency, not speed.
4. **`control-points` is the anomaly.** 22s to output 12 lines of JSON means Flash is reasoning hard before answering. And its output is currently orphaned within the pipeline — confirm whether the frontend uses `g2_grid` before spending another second on it.
5. **One parallelisation already banked** (validate-layout ∥ concept-base-plan, the code comment says it saved 60–90s). One more is available free: `control-points` ∥ `spatial-fingerprint` (~22s back).

## 5. Redesign opportunities, ranked

What we've found works best is changing one thing per run and comparing renders, so these are ordered by payoff against risk:

1. **No-risk speed (~25–30s saved):** run `control-points` in parallel with `spatial-fingerprint`; set thinking budget to zero/low on `control-points` and both validators. No output change.
2. **Decide control-points' fate:** wire `g2Grid` into the projection maths (it's better geometry than the fingerprint approximation), or delete the step if only the frontend overlay needs it and the fallback suffices.
3. **Stop paying for static copy:** Rule 9's 18 guidance paragraphs should be attached by code, with the model returning only the relevant heading names. Saves output tokens and removes paraphrase risk.
4. **Fix the validator/creativity conflict:** tell `validate-render` the creativity level and declared layout elements, so intentional pergolas and fire pits stop risking false-positive retries.
5. **Fix the retry asymmetry:** pass the sketch into the retry render call.
6. **Consolidate the visual prompt's repetition:** one canonical PRESERVE list (from the fingerprint), stated twice not four times; strip the duplicate from the design JSON's `visualPrompt` field.
7. **Extend the style briefs:** only Urban Party Garden has an extended brief with a plant palette. The other styles are running on vibes. Writing briefs for the rest is probably the highest *quality* lever in the whole pipeline.
8. **(Bigger surgery, only if 4 minutes becomes a real problem):** split `garden-design` into two parallel calls — spatial/planting vs. costs/implementation/maintenance — and merge in code. Could halve the 84s but adds merge complexity and a consistency risk between the halves.

## Open questions for you

- Does the frontend actually consume `g2_grid` / `control_points` from `pipeline_jobs`? (Determines item 2.)
- Are `boundaryPolygon` and `elevationData` from the fingerprint used anywhere yet?
- Is 4 minutes a customer problem in practice, given the email safety net — or is quality-per-run the only thing worth optimising?

---

# Part 2 — Reliability risks not yet flagged, fixes, and a re-laid-out process

Constraint applied throughout: zero or near-zero cash cost. Everything below is prompt edits, code edits, or config changes.

## 6. New problem items (not previously flagged)

### 6.1 The whole run has zero retries — one bad Gemini response kills everything

`inngest.createFunction({ id: 'design-pipeline', retries: 0, ... })`. Any transient Gemini error, rate limit, or malformed JSON in any of the 7 calls fails the entire job. The customer sees a failure after waiting, and all the successful steps before it are wasted spend.

**Fix options:**
- **(a) Set `retries: 1` or `2` on the function.** Inngest retries only the failed step, not the whole run — completed steps are checkpointed. One line. The main reason retries was set to 0 was probably fear of double-charging; the credit is only charged in `save-results`, which is idempotent, so this is safe.
- **(b)** Per-step try/once-more wrappers around each Gemini call (more code, same effect, finer control).
- Recommendation: (a). Cheapest reliability win in the whole document.

### 6.2 `garden-design` JSON has no truncation guard and no repair path

A 10–12k token output parsed with a bare `JSON.parse`. `validate-layout` has truncation recovery logic; the far more expensive `garden-design` call has none. If output hits a stop or truncates, the run dies (see 6.1).

**Fix options:**
- **(a) Use Gemini structured output properly:** pass a `responseSchema` in the config instead of describing the schema in prose. The API then guarantees parseable JSON matching the shape. This also lets you cut most of the schema text from the prompt. Free, supported on Flash.
- **(b)** Check `finishReason` before parsing; if `MAX_TOKENS`, re-request just once.
- **(c)** Add a JSON repair pass (`jsonrepair` npm package) as last resort before failing.
- Recommendation: (a) + (c). (a) is the structural fix; (c) catches stragglers.

### 6.3 The render prompt contradicts itself: "add nothing" vs "pick 2-3 from this feature pool"

This is likely the true root cause of the hallucinated-structures problem. The render prompt says spatial elements are the master record and "nothing else may be added" — then the creativity block (levels 4 and 5) tells the same model to "Rotate from this feature pool and pick up to 2-3 per generation: pergola... fire pit... outdoor kitchen...". The image model is being explicitly invited to invent structures that aren't in the layout, and then the validator punishes it for obeying.

**Fix options:**
- **(a) Move feature pool selection upstream into `garden-design`.** The text model picks the 2-3 features and writes them into `layoutDescription.elements` (add the pool to the style/creativity section of that prompt). The render creativity block then describes only *character* (scale of transformation, planting density, no element nominations). Render adds nothing; validator validates against the declared list; the contradiction disappears.
- **(b)** Minimal version: delete the "rotate from this pool" sentences from the render creativity blocks and leave feature variety to garden-design's temperature.
- Recommendation: (a). It also makes the plan document and the render agree with each other, which they currently aren't guaranteed to do — a customer can receive a render with a fire pit that appears nowhere in their written plan or costings.

### 6.4 No "is this even a garden photo?" gate

Nothing checks the upload before committing 4 minutes of inference. A photo of a cat, a kitchen, or a blurry thumbnail goes all the way through and produces a confident nonsense plan with costings.

**Fix options:**
- **(a) Fold a gate into `spatial-fingerprint`:** add `"isOutdoorGardenSpace": boolean, "photoQualityIssues": [...], "surveyConfidence": 0-100` to its schema (it's already looking at the photo — marginal cost ~zero). Code bails after the step with a friendly "we couldn't read this photo" before the expensive calls, credit untouched.
- **(b)** Separate tiny pre-flight call. Cleaner separation, but adds ~5-10s and another call.
- Recommendation: (a).

### 6.5 Two geometry estimates, no arbitration, no sanity bounds

The fingerprint and control-points both estimate plot width/depth and grid counts independently. Nothing compares them, and nothing sanity-checks the fingerprint numbers that drive `projectToImage` (a horizon estimated *below* the foreground, or a 2m × 40m plot, silently warps every projected plant position).

**Fix options:**
- **(a) Code-level arbitration:** after both steps, clamp to plausible bounds (plot 2–30m each way, horizon above foreground, etc.); where the two estimates disagree by more than ~40%, prefer control-points (it's the more targeted measurement) and log the disagreement.
- **(b)** Use the homography grid (`g2Grid`) as the projection source and let the fingerprint perspective fields be the fallback — this also resolves the orphaned-step question from Part 1 in favour of keeping it.
- Recommendation: (b), with (a)'s clamps. Pure code, no new calls.

### 6.6 The same plant position is told to the render model three different ways

Each plant arrives as: a depth phrase ("at mid-distance"), a grid reference, and a mathematically projected percentage. When the fingerprint numbers are off, the percentages contradict the depth phrase and the sketch, and the model picks whichever signal it likes.

**Fix options:**
- **(a) Gate the percentages:** only include `PRECISE ELEMENT POSITIONS` when `validate-layout` passed with confidence above a threshold (say 70). One `if` statement.
- **(b)** Drop grid refs from the render prompt entirely (the model can't see your grid; they're meaningless to it) and keep depth phrase + percentage only.
- Recommendation: both. They're free and reduce conflicting instructions.

### 6.7 Validation corrections are injected as free prose

When `validate-layout` fails, its `corrections` string (Gemini-authored prose) is appended raw into the render prompt. Unbounded text written by one model is steering another, with no structure and possible contradiction of the numbered constraints.

**Fix options:**
- **(a)** Change the validation schema to return structured per-plant corrections (`{plantIndex, correctedXPct, correctedYPct}`) and patch the positions list in code. The render prompt then never carries prose corrections.
- **(b)** Cap and sanitise the prose (length limit, strip imperatives that conflict with the constraint list).
- Recommendation: (a).

### 6.8 Retry only fires on hallucinations — other validation failures sail through

The retry condition is `hallucinatedStructures.length > 0`. A render where `sameGarden: false` or `boundariesRespected: false` but with an empty hallucination list is delivered to the customer unchallenged, despite `overallPass: false`.

**Fix options:**
- **(a)** Retry on `!overallPass`, building the correction text from `failReasons` (the prompt scaffolding for this already exists in `retry-if-needed`).
- **(b)** Keep hallucinations as the only *retry* trigger but persist `overallPass: false` to the job row and surface a soft warning in the UI ("we're not fully happy with this render — regenerate free of charge").
- Recommendation: (a) now; (b) is a nice product touch later.

### 6.9 Climate fallback assumes everyone gardens in Ireland

When no hardiness zone is supplied, the plant climate instruction is "hardy to at least -10°C, tolerating wet winters and cool summers" regardless of country — wrong for most of the US and all of Australia, and at odds with the market-neutral positioning (UK first, IE second, US third).

**Fix options:**
- **(a)** Small country→climate-sentence lookup in code (5 entries covers UK, IE, US, AUS, default). One template string each.
- **(b)** Derive a default hardiness zone from country/region in code and always pass the zone branch.
- Recommendation: (a) immediately, (b) when regions get more granular.

### 6.10 `gridZ` is requested but never defined

The schema asks every plant for `"gridZ": 0.0` with no explanation of units or meaning. The model guesses; `projectToImage` then treats the guess as metres of height and shifts the plant's position in the frame accordingly.

**Fix options:**
- **(a)** One line in the schema: "gridZ: height in metres above the main ground level at which this plant's base sits (0.0 unless planted in a raised bed or on a terrace listed in elevationData)".
- **(b)** Drop it from the schema and compute it in code by cross-referencing the plant's grid cell against `elevationData` — which would finally give elevationData a consumer.
- Recommendation: (a) now, (b) if you keep elevationData.

### 6.11 The sketch is generated with no aspect ratio instruction

`concept-base-plan` never tells the image model the plot's real proportions, so a 3m × 12m corridor garden tends to come back as a comfortable square-ish drawing — and that wrong-shaped sketch is then fed to the render as the spatial guide.

**Fix options:**
- **(a)** Inject one line: "The plot is approximately ${plotWidthMetres}m wide × ${plotDepthMetres}m deep. The drawn plot outline must match this ${aspectRatio} proportion."
- Recommendation: do it; it's one template line and directly improves the render's geometry anchor.

### 6.12 Style brief lookup is a silent exact-string match

`STYLE_DESCRIPTIONS[style]` fails silently on any casing or naming drift between frontend and pipeline ("Urban party garden" gets no brief, no warning).

**Fix options:**
- **(a)** Normalise the key (trim/lowercase lookup) and log a warning when a style arrives with no brief.
- Recommendation: fold into the style-brief work in 7.3 below.

## 7. Fixes for the three items flagged in Part 1

### 7.1 Validator flags deliberate features as hallucinations

- **(a) Context-aware validator (preferred):** pass the creativity level and the declared `layoutDescription.elements` list into the `validate-render` prompt, and redefine question 5: "Are there any structures in the After that are neither visible in the Before photo NOR declared in the design element list below?" Costs nothing; removes the false-positive retries entirely.
- **(b) Code-side filter:** before deciding to retry, drop any flagged structure whose name fuzzy-matches a declared layout element (pergola/arch, fire pit/chiminea, etc.).
- **(c)** Do both — (a) fixes the judgement, (b) catches phrasing mismatches.
- Note: if 6.3(a) is done, declared features and rendered features converge, and this problem mostly evaporates on its own.

### 7.2 Retry render runs without the sketch

- **(a) One-line fix:** in `retry-if-needed`, fetch the aerial via `fetchStoredBase64(aerialStoragePath)` and pass it as the fourth argument to `step5_generateRender`, exactly as `generate-render` does.
- **(b)** While in there: re-validate the retried render with the cheap `validateRender` call (9s) and keep whichever of the two renders scored better, instead of blindly preferring the retry.
- Recommendation: (a) is mandatory; (b) is a 9-second quality insurance policy worth taking.

### 7.3 Only Urban Party Garden has an extended style brief

- **(a) Write the missing briefs (preferred, zero cash):** I draft extended briefs for the remaining styles in the same structure as Urban Party (character paragraph, plant palette by role, hardscape guidance, avoid-list), you review with your garden-design hat on, they go into `STYLE_DESCRIPTIONS`. The avoid-lists matter as much as the palettes — "avoid" lines are what stop style bleed.
- **(b)** Bootstrap with Gemini: generate draft briefs once, human-edit, hardcode. Faster to first draft, same review burden.
- **(c)** Interim stopgap if (a) waits: a 5-line mini-brief per style (3 signature plants, 1 signature hardscape, 2 avoids) — even this dramatically tightens style coherence.
- Recommendation: (a), one style per session alongside other work.

## 8. The re-laid-out process — same outcomes, more dependable

No new paid services, no new models, same number of Gemini calls (one fewer in the common case). Changes are sequencing, arbitration, and contract enforcement.

```
0. download-image                                          (unchanged)

1. PARALLEL:  spatial-fingerprint  ∥  control-points
   - fingerprint gains the "is this a garden?" gate (6.4a)
   - control-points gets thinkingBudget: 0
   - BAIL EARLY here if not a garden photo                 (~25s saved, garbage filtered)

2. geometry-merge (pure code, new, ~0s)
   - sanity clamps on all numbers (6.5a)
   - arbitrate fingerprint vs control-points; homography grid
     becomes the projection source (6.5b)
   - resolve gridZ from elevationData if adopting 6.10b

3. garden-design
   - responseSchema structured output (6.2a)
   - feature pool selection moved here (6.3a)
   - keyConsiderations returns heading names only; code attaches copy
   - country-aware climate fallback (6.9a)
   - minimum counts stated once

4. PARALLEL:  validate-layout  ∥  concept-base-plan        (unchanged pattern)
   - validate-layout returns structured corrections (6.7a)
   - sketch prompt gains plot aspect ratio line (6.11a)

5. generate-render
   - one canonical PRESERVE list, stated twice not four times
   - creativity block describes character only — no feature nominations
   - percentages included only when validation confidence ≥ 70 (6.6a)
   - grid refs removed from prompt (6.6b)

6. validate-render (context-aware: creativity level + declared elements) (7.1a)

7. retry-if-needed
   - triggers on !overallPass, not just hallucinations (6.8a)
   - retry includes the sketch (7.2a)
   - retried render re-validated; best of two kept (7.2b)

8. save-results → save-design-record → email-plan-ready    (unchanged)

Function config: retries: 1                                 (6.1a)
```

**What this buys, in order of importance:** runs stop dying to single transient errors; the written plan and the render are guaranteed to describe the same garden; bad uploads cost 30 seconds instead of 4 minutes; retries become rarer (contradiction removed) and better (sketch included, re-validated); and the run drops to roughly 3m 05s as a side effect.

**Suggested implementation order (each independently shippable, smallest risk first):**
1. `retries: 1` + retry-includes-sketch + retry-on-!overallPass — config and ~10 lines.
2. Parallelise step 1 + thinking budget — ~20 lines, pure speed.
3. Context-aware validator — prompt edit only.
4. Garden-photo gate — schema addition + one bail check.
5. Feature pool relocation + render prompt consolidation — the big coherence win; test before/after on the same photo.
6. responseSchema migration + keyConsiderations headings-only — contract hardening.
7. Geometry merge + structured corrections + sketch aspect ratio — the spatial accuracy bundle.
8. Style briefs, one per session.

---

*Assumptions made in Part 2: Inngest step checkpointing means function-level retries re-run only failed steps (standard Inngest behaviour); `responseSchema` structured output is available on your `@google/genai` SDK version for gemini-2.5-flash (it is on current versions); the hallucination reports you've seen correlate with creativity levels 4–5 (worth confirming against `validation_result` rows in `pipeline_jobs` before crediting 6.3 as the root cause); "zero cost" is read as no new paid services — developer time via Claude Code is assumed acceptable.*
