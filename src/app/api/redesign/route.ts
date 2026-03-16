import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

// ─── DESIGN SCHEMA (shared with Step 3) ────────────────────────────────────────

const DESIGN_SCHEMA = `{
  "overview": {
    "tagline": "one factual headline",
    "scopeDescription": "3-4 sentences on project scope",
    "objectives": ["min 5 specific measurable objectives"],
    "estimatedAreaSqm": 0
  },
  "siteAnalysis": {
    "sunProfile": {
      "primaryOrientation": "N|NE|E|SE|S|SW|W|NW",
      "morningLight": "Full Sun|Partial Shade|Full Shade|Variable",
      "afternoonLight": "Full Sun|Partial Shade|Full Shade|Variable",
      "shadingElements": ["every visible shading element"]
    },
    "soil": {
      "type": "Clay|Sandy|Loam|Chalky|Peaty|Silty|Unknown",
      "drainageRating": 3,
      "drainageNotes": "specific drainage observations",
      "recommendedAmendments": ["specific soil improvement steps"]
    },
    "hardinessZone": "e.g. USDA Zone 8b / RHS H4",
    "existingFeatures": [
      { "id": "F1", "label": "specific name", "type": "Tree|Structure|Wall|Path|Water|Utility|Other", "disposition": "Retain|Remove|Relocate|Repurpose", "notes": "reason for decision" }
    ],
    "microclimates": [
      { "zone": "named location", "description": "specific condition", "impact": "Positive|Negative|Neutral" }
    ],
    "topographyNotes": "slope, levels, terracing description",
    "accessConstraints": "machinery or delivery access limitations"
  },
  "designConcept": {
    "conceptStatement": "3-4 sentences on design approach",
    "rationale": "why this design language suits this specific site",
    "principles": ["5-6 specific guiding design principles"],
    "colourPalette": ["5-8 colours as named descriptions"],
    "materialMoods": ["4-6 defining material types"]
  },
  "spatialLayout": {
    "zones": [
      { "id": "Z1", "name": "zone name", "type": "Entertainment|Contemplation|Utility|Planting Bed|Water Feature|Children Area|Kitchen Garden|Entrance|Transition", "areaSqm": 0, "description": "what happens here", "sightLineNotes": "views to and from" }
    ],
    "circulationRoutes": [
      { "id": "R1", "from": "zone name", "to": "zone name", "surfaceTreatment": "specific material", "widthM": 1.2, "notes": "design intent" }
    ],
    "compositionNotes": "paragraph on spatial composition, proportions and scale",
    "focalPoints": ["specific focal point descriptions"]
  },
  "plantingSpecification": {
    "plants": [
      {
        "id": "P1",
        "botanicalName": "Genus species",
        "commonName": "common name",
        "cultivar": "cultivar or null",
        "type": "Tree|Shrub|Perennial|Annual|Grass|Groundcover|Climber|Fern|Bamboo|Bulb",
        "quantity": 1,
        "matureSize": "e.g. 3-4m H x 2m W",
        "spacingM": 1.5,
        "sunRequirement": "Full Sun|Partial Shade|Full Shade|Variable",
        "waterRequirement": "Low|Moderate|High",
        "hardinessRating": "e.g. RHS H5 / USDA 7a",
        "growthRate": "Slow|Moderate|Fast",
        "seasonalInterest": {
          "spring": "specific interest",
          "summer": "specific interest",
          "autumn": "specific interest",
          "winter": "specific interest"
        },
        "designRationale": "why this plant suits this site",
        "existingElement": "what currently exists at this grid location in the before photo",
        "layer": "Canopy|Understorey|Shrub|Ground|Climber",
        "gridLocation": "e.g. B3",
        "zoneIds": ["Z1"]
      }
    ],
    "layeringStrategy": "specific canopy/understorey/shrub/ground layering description",
    "densityNotes": "planting density and spacing rationale",
    "seasonalNarrative": "how the garden performs across all four seasons"
  },
  "hardscapeSpecification": {
    "materials": [
      { "id": "M1", "element": "e.g. Main Terrace Paving", "material": "specific material", "finish": "specific finish", "colour": "colour description", "unitCostRange": "e.g. £65-85 per m²", "notes": "installation notes" }
    ],
    "boundaryTreatments": ["specific descriptions with dimensions"],
    "waterFeatures": ["specific descriptions or None specified"],
    "focalStructures": ["pergola, screens, sculptures with dimensions"],
    "lighting": [
      { "id": "L1", "type": "Uplighter|Path Light|Flood|String|Feature|Underwater", "location": "specific location", "colourTempK": 2700, "notes": "design intent" }
    ],
    "paletteNarrative": "how materials work together and relate to the design language"
  },
  "soilAndIrrigation": {
    "soilPreparationPlan": "step-by-step — excavation, amendments, topsoil spec",
    "drainageStrategy": "specific solution — French drain, soakaway, grading",
    "mulchingRecommendation": "mulch type, depth, timing",
    "irrigationZones": [
      { "id": "I1", "name": "zone name", "type": "Drip|Spray|Micro-spray|Soaker Hose|Manual", "coverageAreaSqm": 0, "notes": "plants served and scheduling" }
    ],
    "rainwaterHarvestingNotes": "recommendations or reason not applicable"
  },
  "implementationPlan": {
    "tasks": [
      { "id": "T1", "phase": "Phase 1 — Hardscape|Phase 2 — Planting|Phase 3 — Finishing", "task": "specific task", "estimatedDays": 2, "notes": "sequencing notes" }
    ],
    "totalWeeks": 12,
    "criticalPathNotes": "key sequencing dependencies"
  },
  "maintenanceSchedule": {
    "tasks": [
      { "season": "Spring|Summer|Autumn|Winter", "task": "specific task", "frequency": "Weekly|Fortnightly|Monthly|Annually|As Required", "notes": "species or area" }
    ],
    "annualPruningRegime": "species-by-species pruning schedule with timing",
    "feedingSchedule": "fertiliser types, application rates, timing by plant group",
    "longTermManagementNotes": "5-10 year management and renewal strategy",
    "professionalVisitsPerYear": 2
  },
  "costEstimate": {
    "currency": "GBP",
    "lines": [
      { "category": "category", "description": "what this covers", "low": 1000, "high": 1500, "notes": "basis of estimate" }
    ],
    "contingencyPercent": 15,
    "costingNotes": "basis of pricing, market, exclusions"
  },
  "climateZone": "geographic region and climate description used to select plants",
  "siteConstraints": {
    "cameraPosition": "standing at garden entrance, ground level, looking toward rear of garden",
    "cameraHeight": "ground level|raised|elevated",
    "viewDirection": "compass direction camera is pointing",
    "fieldOfView": "narrow corridor view|wide open view|square garden view",
    "gardenShape": "e.g. narrow rectangle approximately 3m wide x 10m long",
    "gardenWidth": "e.g. approximately 4m wide at camera position",
    "gardenDepth": "e.g. approximately 12m deep from camera to rear wall",
    "aspectRatio": "e.g. 1:3 (width:depth)",
    "groundLevel": "flat|slopes away from camera|slopes toward camera|terraced",
    "leftBoundary": "material, height, condition",
    "rightBoundary": "material, height, condition",
    "rearBoundary": "material, height, condition",
    "frontBoundary": "what is at camera position",
    "boundaries": ["description of each boundary wall, fence, or site edge"],
    "immovableStructures": ["each fixed structure: type, position, size, material, condition"],
    "existingVegetation": ["each large established plant: species if known, position, approx size"],
    "accessPoints": ["gate location", "door location", "path entry points"],
    "groundSurface": "current ground covering and any existing paths",
    "lightAspect": "apparent light direction and any obvious shade areas",
    "notes": "any other permanent constraints or utility features"
  },
  "layoutDescription": {
    "elements": [
      {
        "id": "LE1",
        "type": "Zone|Path|Surface|Structure|PlantingArea|WaterFeature|FocalPoint",
        "label": "descriptive name",
        "gridLocation": "e.g. B2 or C3-E5 for areas spanning multiple squares",
        "description": "what this element is, what it looks like, its materials or plants",
        "material": "specific paving material, plant type, or surface treatment"
      }
    ],
    "layoutNarrative": "2-3 sentence plain-language description of the complete spatial layout reading from front (row 6) to rear (row 1), and left (column A) to right (column F)"
  },
  "visualPrompt": "PRESERVE EXACTLY: [list all walls, fences, buildings from photo]. Work WITHIN these structures. Only change planting, paving, and soft landscaping within the existing footprint.",
  "confidence": 0.85,
  "caveats": ["any assumptions made or limitations of this proposal"]
}`;

// ─── STEP 1 — Spatial Fingerprint ─────────────────────────────────────────────
// Reads only the permanent, fixed features of the garden from the photo.
// Output is used to lock geometry for all subsequent steps.

async function step1_spatialFingerprint(
  imageBase64: string,
  mimeType: string,
  orientation: string,
): Promise<Record<string, any>> {
  const prompt = `You are a site surveyor. Study this garden photograph and extract ONLY permanent, fixed spatial data. Do not suggest any design.

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
  "horizonLinePercent": (number, 0–100 — vertical position of the horizon line as a percentage from the TOP of the image, e.g. 33 means horizon is one-third down),
  "vanishingPointXPercent": (number, 0–100 — horizontal position of the vanishing point as a percentage across the image width; straight-on photos ≈ 50),
  "foregroundToBackgroundRatio": (number, 0.0–1.0 — proportion of visible garden that is foreground vs distance; 1.0 = all foreground, 0.0 = all distance),

  "boundaryPolygon": [
    {"x": (number 0.0–1.0, normalised from LEFT edge of photo), "y": (number 0.0–1.0, normalised from TOP edge of photo)}
  ]
}

PERSPECTIVE FIELD INSTRUCTIONS:
- cameraElevationAngle: look at where the camera is relative to the ground. A photo taken at near-ground level looking slightly up = ~5-10 degrees. A photo taken standing, looking down = ~20-35 degrees.
- horizonLinePercent: identify where the horizon (or the base of the rear wall/fence) sits in the image. If the rear wall base is at 30% from top, use 30. For typical garden photos taken standing up, this is usually 25-45.
- vanishingPointXPercent: for straight-ahead shots this is ~50. For gardens shot at an angle it shifts left or right.
- foregroundToBackgroundRatio: if most of the image shows the far end of the garden with little foreground, this is low (~0.3). If the foreground fills most of the image, this is high (~0.8).

BOUNDARY POLYGON INSTRUCTIONS:
The boundaryPolygon must trace the inner edge of the VISIBLE GARDEN BOUNDARY in this perspective photo.
- Trace the fence line, wall line, or plot edge as it appears in the photo
- Include the left boundary wall/fence, rear boundary, right boundary wall/fence, and front edge (near camera position)
- Use at least 4 points, up to 12 for complex shapes
- Points must be in order (clockwise preferred)
- Normalise ALL coordinates: x=0.0 is LEFT edge of photo, x=1.0 is RIGHT edge; y=0.0 is TOP, y=1.0 is BOTTOM
- The polygon must enclose ONLY the actual garden space, NOT the sky, adjacent buildings, or areas outside the garden

Garden orientation (user-supplied): ${orientation || 'unknown'}
Be as precise as possible. This data will lock geometry in all subsequent generation steps.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [
      { inlineData: { mimeType, data: imageBase64 } },
      { text: prompt },
    ]}],
    config: { responseMimeType: 'application/json', temperature: 0.1 },
  });

  const text = response.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '{}';
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(clean);
}

// ─── STEP 3 — Concept Base Plan ────────────────────────────────────────────────
// Generates a hand-drawn top-down architectural sketch with a labelled A–F × 1–6 grid.
// Receives the full design JSON from Step 2 and draws its layoutDescription exactly —
// it must not invent anything that is not declared in the design synthesis.

async function step3_conceptBasePlan(
  fingerprint: Record<string, any>,
  designJSON: Record<string, any>,
  orientation: string,
): Promise<string | null> {
  const structuresList = (fingerprint.immovableStructures || []).map((s: string) => `- ${s}`).join('\n') || '- None identified';
  const vegetationList = (fingerprint.existingVegetation || []).map((v: string) => `- ${v}`).join('\n') || '- None identified';

  const layoutElements = (designJSON.layoutDescription?.elements || [])
    .map((el: any) => `- [${el.gridLocation || '?'}] ${el.label} (${el.type}): ${el.description}${el.material ? ' — ' + el.material : ''}`)
    .join('\n') || '- No layout elements specified';
  const layoutNarrative = designJSON.layoutDescription?.layoutNarrative || '';

  const prompt = `Generate a precise architectural garden base plan — a hand-drawn top-down 2D sketch.

SPATIAL FINGERPRINT (use these exact dimensions and positions):
- Garden shape: ${fingerprint.gardenShape || 'rectangular plot'}
- Aspect ratio: ${fingerprint.aspectRatio || '1:1'}
- Left boundary: ${fingerprint.leftBoundary || 'as in photo'}
- Right boundary: ${fingerprint.rightBoundary || 'as in photo'}
- Rear boundary: ${fingerprint.rearBoundary || 'as in photo'}
- Front boundary: ${fingerprint.frontBoundary || 'open entrance'}
- Fixed structures:
${structuresList}
- Existing vegetation:
${vegetationList}
- Ground surface: ${fingerprint.groundSurface || 'mixed'}

DESIGN LAYOUT — draw exactly these elements and nothing else:
${layoutNarrative}

ELEMENTS TO DRAW (each positioned on the A–F × 1–6 grid at the stated location):
${layoutElements}

CRITICAL DRAWING RULE: Every element listed above must appear on the plan at its stated grid position. Do not draw any zone, path, surface, structure, or feature that is not listed above. The plan is a faithful drawing of the design synthesis output — it must not invent anything independently.

VIEWPOINT: Directly vertical, 90° straight down. Pure 2D orthographic top-down. No perspective. No 3D. Completely flat.

ORIENTATION: Garden faces ${orientation || 'N'}
- Top of plan = rear boundary (furthest from camera, row 1)
- Bottom of plan = front boundary (closest to camera, row 6)

GRID — draw a faint reference grid over the whole plan:
- 6 columns labelled A–F left to right
- 6 rows labelled 1–6 top to bottom (1 = rear, 6 = front)
- Grid lines: light grey, thin (0.5px), inside the garden boundary only
- Column letters A–F: small grey text at top
- Row numbers 1–6: small grey text at left

GARDEN BOUNDARY: Bold black outline (3px) matching the exact shape from the fingerprint.

STYLE:
- Clean black ink outlines
- Light watercolour fills: lawn = soft green, paving = warm sand/grey, beds = terracotta blush
- Cream/off-white paper background
- Hand-drawn sketch quality — precise but with slight hand-drawn character

DO NOT add any plant markers, numbered circles, or plant labels.
DO NOT add zone text labels.
DO NOT add a compass rose or scale bar.
DO NOT draw any element not listed in the ELEMENTS TO DRAW section above.
The grid letters and numbers are the ONLY text on the image.
Geometric accuracy of the boundary and garden shape is the top priority.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { responseModalities: ['Text', 'Image'] },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!imagePart?.inlineData?.data) return null;
  const mime = imagePart.inlineData.mimeType || 'image/png';
  return `data:${mime};base64,${imagePart.inlineData.data}`;
}

// ─── STEP 2 — Garden Design ────────────────────────────────────────────────────
// Produces the full design JSON (including layoutDescription — the master spatial
// record) from the original photo and fingerprint. Runs before the Concept Base
// Plan so the design decisions are made once and both visual outputs draw from them.

async function step2_gardenDesign(
  imageBase64: string,
  imageMimeType: string,
  fingerprint: Record<string, any>,
  style: string,
  orientation: string,
  region: string,
  country: string,
  currency: string,
  clientName: string,
  creativityLevel: number,
  creativityDescription: string,
): Promise<Record<string, any>> {
  const systemInstruction = `You are a senior landscape architect and botanist producing a full professional garden design proposal document.

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
For EVERY plant, assign a gridLocation field.
Grid: Columns A–F run left to right (A = far left, F = far right). Rows 1–6 run top to bottom (1 = rear, 6 = front).
- Every plant MUST have a gridLocation (never null or empty)
- Do not assign the same gridLocation to more than 2 plants
- Spread plants across the full A–F, 1–6 grid

HARD CONSTRAINT — GRID BOUNDS (absolutely non-negotiable):
- Valid columns are A, B, C, D, E, F ONLY. Never use G, H, or any letter beyond F.
- Valid rows are 1, 2, 3, 4, 5, 6 ONLY. Never use 7, 8, or any number higher than 6.
- Any gridLocation outside A–F × 1–6 is INVALID and must not appear in your output.
- If more than 12 plants are included, multiple plants MUST share grid squares or be grouped — do NOT invent out-of-range coordinates to fit them.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 8 — LAYOUT DESCRIPTION (master spatial record)
═══════════════════════════════════════════════════════════════
The layoutDescription field is the single source of truth for everything that appears in this garden design.
Populate layoutDescription.elements with EVERY spatial element you are proposing:
- Every zone (entertainment area, lawn, vegetable bed, seating area, etc.) — with its grid location
- Every path and circulation route — with its grid location and surface material
- Every surface treatment (paving, gravel, decking, lawn, bark chip area) — with its grid location
- Every structural feature (pergola, raised bed, water feature, screen, trellis) — with its grid location
- Every distinct planting bed or area — with its grid location
- Every focal point — with its grid location
Nothing may appear in the Concept Base Plan image or the photorealistic render that is not declared in layoutDescription.elements first.
The layoutNarrative must be a plain-language spatial walkthrough of the complete design.
Minimum 8 elements in layoutDescription.elements.

═══════════════════════════════════════════════════════════════
TONE
═══════════════════════════════════════════════════════════════
Plain, direct, technical English. No poetry or flowery language.

═══════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════
Return ONLY valid JSON. No markdown fences. No commentary.`;

  const userText = `Analyse this garden and produce a COMPLETE professional garden design proposal.

Client: ${clientName}
Design Language: ${style}
Geographic Region: ${region}
Plant Climate: Only suggest plants proven to thrive in ${country} — hardy to at least -10°C, tolerating wet winters and cool summers for this region.
Cost Currency: All cost estimates must be provided in ${currency}. Use realistic local market prices for ${country}.${orientation ? `\nGarden Orientation: ${orientation} — The garden faces ${orientation}. Factor sun exposure accordingly.` : ''}

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

SCHEMA:
${DESIGN_SCHEMA}`;

  const parts: any[] = [
    { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
    { text: userText },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.4,
      maxOutputTokens: 65536,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '';
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const design = JSON.parse(clean);
  clampGridLocations(design);
  return design;
}

// ─── Grid location validator/clamper ──────────────────────────────────────────
// Ensures every plant gridLocation is within A–F × 1–6, clamping any out-of-range
// value before it reaches the frontend.
const VALID_COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F'];

function clampGridLocation(loc: string | undefined | null): string {
  if (!loc || typeof loc !== 'string') return 'A1';
  const match = loc.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return 'A1';
  const [, colRaw, rowRaw] = match;
  // Clamp column: treat A=0…F=5, anything beyond F maps to F
  const colIndex = Math.min(colRaw.charCodeAt(0) - 65, 5); // 65 = 'A'
  const col = VALID_COLUMNS[Math.max(0, colIndex)];
  // Clamp row: 1–6
  const row = Math.min(Math.max(parseInt(rowRaw, 10), 1), 6);
  return `${col}${row}`;
}

function clampGridLocations(design: Record<string, any>): void {
  const plants: any[] = design?.plantingSpecification?.plants ?? [];
  for (const plant of plants) {
    if ('gridLocation' in plant) {
      plant.gridLocation = clampGridLocation(plant.gridLocation);
    }
  }
}

// ─── STEP 4 — Build Visual Prompt (pure function) ─────────────────────────────
// Constructs a spatial-locked render prompt from the fingerprint + design output.

function step4_buildVisualPrompt(
  fingerprint: Record<string, any>,
  designJSON: Record<string, any>,
  style: string,
  orientation: string,
  creativityLevel: number,
): string {
  const sc = fingerprint;
  const structuresList = (sc.immovableStructures || []).map((s: string) => `- ${s}`).join('\n') || '- None identified';
  const vegetationList = (sc.existingVegetation || []).map((v: string) => `- ${v}`).join('\n') || '- None identified';

  const visualPromptBase = designJSON.visualPrompt
    ? `${designJSON.visualPrompt} ${style} style.`
    : `Photorealistic ${style} garden transformation. Professional landscape photography. Natural lighting.`;

  // Creativity-level-specific planting and scope instructions
  const creativityInstructions: Record<number, string> = {
    1: `CREATIVITY LEVEL 1 — MINIMAL CHANGE:
All plants must be in containers or pots only. No in-ground planting anywhere in the scene.
No structural changes of any kind. No new paving, no new beds cut into the ground.
Existing lawn, soil, and paving surfaces remain unchanged.
Only add portable decorative elements: pots, containers, gravel on existing surfaces.
The garden must look almost identical to the Before — just tidied and decorated with pots.`,
    2: `CREATIVITY LEVEL 2 — SUBTLE:
In-ground border planting is permitted along boundary walls and fences only.
The lawn must be retained as the primary ground surface.
No new structural elements, no raised beds, no new paving areas.
Only one or two new surface materials may appear (e.g., gravel edging strip or stepping stones).
No containers or pots visible. All plants are in-ground in border beds.`,
    3: `CREATIVITY LEVEL 3 — CONSIDERED REDESIGN:
Lawn may be partially replaced with ground cover, gravel, or defined planting beds.
New path edging, defined bed edges, or a simple path treatment is visible.
Moderate planting variety across multiple beds. A clearly designed garden.
No large structural additions. Changes are clearly intentional but not radical.
All plants are in-ground. No containers or pots.`,
    4: `CREATIVITY LEVEL 4 — AMBITIOUS TRANSFORMATION:
All planting is fully in-ground throughout the garden. No containers or pots.
New hard surface areas are clearly visible (paved zone, gravel area, or decking).
Structural shrubs and small trees are planted in-ground.
A raised bed, level change, or defined structural feature may be present if space allows.
The garden is clearly transformed. Maximum practical redesign within the existing boundaries.`,
    5: `CREATIVITY LEVEL 5 — FULL TRANSFORMATION:
All planting is fully in-ground. Absolutely no containers or pots anywhere in the scene.
Extensive hard landscaping is visible: paved terraces, paths, gravel, edging, steps.
Architectural plants and structural specimens dominate. Formal or dramatic planting scheme.
A water feature, focal structure, or architectural element may be present.
The garden is unrecognisable from the original. Maximum design ambition.
Every square metre of ground is deliberately treated — no bare soil, no remnant lawn unless designed.`,
  };

  const creativityBlock = creativityInstructions[creativityLevel] || creativityInstructions[3];

  // Build spatial layout from the design's master layoutDescription
  const layoutElements: any[] = designJSON.layoutDescription?.elements || [];
  const layoutNarrative = designJSON.layoutDescription?.layoutNarrative || '';

  const spatialElements = layoutElements.map((el: any) => {
    const loc = (el.gridLocation || '').toUpperCase();
    const rowMatch = loc.match(/(\d)/);
    const row = rowMatch ? parseInt(rowMatch[1]) : 3;
    const depth = row <= 2 ? 'in the upper distance near the rear boundary'
      : row <= 4 ? 'at mid-distance in the garden'
      : 'close in the foreground';
    return `- [${el.gridLocation || '?'}] ${el.label} (${el.type}) — ${depth}: ${el.description}${el.material ? ', ' + el.material : ''}`;
  }).join('\n');

  // Also list plant positions as supplementary detail
  const plants: any[] = designJSON.plantingSpecification?.plants || [];
  const plantPositions = plants.slice(0, 15).map((p: any, i: number) => {
    const loc = (p.gridLocation || '').toUpperCase();
    const rowMatch = loc.match(/\d/);
    const row = rowMatch ? parseInt(rowMatch[0]) : 3;
    const depth = row <= 2 ? 'in the upper distance near the rear boundary'
      : row <= 4 ? 'at mid-distance in the garden'
      : 'close in the foreground';
    return `- Plant ${i + 1}: ${p.botanicalName || p.commonName} (${p.type}) — ${depth}, grid ${p.gridLocation || '—'}`;
  }).join('\n');

  return `SPATIAL LOCK — THIS RENDER MUST SHOW THE SAME GARDEN AS THE BEFORE PHOTO:

CAMERA POSITION: ${sc.cameraPosition || 'ground level at garden entrance'}
The After render must be photographed from EXACTLY the same position and height as the Before photo. Same viewpoint. Same angle.

GARDEN GEOMETRY TO PRESERVE EXACTLY:
- Shape: ${sc.gardenShape || 'rectangular'}
- Width: ${sc.gardenWidth || 'as in photo'}
- Depth: ${sc.gardenDepth || 'as in photo'}
- Aspect ratio: ${sc.aspectRatio || 'as in photo'}
- Ground level: ${sc.groundLevel || 'flat'}
DO NOT change the garden dimensions. DO NOT widen or shorten it. DO NOT change the perspective or camera angle.

BOUNDARIES — PRESERVE EXACTLY AS PHOTOGRAPHED:
- Left boundary: ${sc.leftBoundary || 'as in photo'}
- Right boundary: ${sc.rightBoundary || 'as in photo'}
- Rear boundary: ${sc.rearBoundary || 'as in photo'}
Every wall and fence must appear at the same height and position.

FIXED STRUCTURES — THESE MUST APPEAR IN THE AFTER IMAGE:
${structuresList}
Do not remove, hide or replace these structures.

EXISTING LARGE PLANTS — RETAIN UNLESS EXPLICITLY REMOVED:
${vegetationList}

${creativityBlock}

DESIGN LAYOUT — THIS IS THE MASTER SPATIAL RECORD (the render is a photorealistic version of this layout):
${layoutNarrative}

SPATIAL ELEMENTS TO SHOW (every element listed here must appear at its stated depth in the scene — nothing else may be added):
${spatialElements || '- Place elements as described in the design concept'}

PLANT PLACEMENT IN SCENE (place each species at its correct perspective position):
${plantPositions || '- Place plants as described in the design concept'}

WHAT YOU MUST NOT CHANGE:
- The shape or size of the garden space
- The position or height of any boundary wall or fence
- Any fixed building or permanent structure
- The camera viewpoint or angle

The person looking at the Before and After must immediately recognise it as the SAME garden.

DESIGN STYLE: ${visualPromptBase}${orientation ? ` The garden entrance faces ${orientation}.` : ''}

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
The image must contain ONLY the photorealistic garden scene — no overlays of any kind.`;
}

// ─── STEP 5 — Generate Render ──────────────────────────────────────────────────
// img2img: original photo as reference, applies the spatial-locked design prompt.

async function step5_generateRender(
  visualPrompt: string,
  originalBase64: string,
  originalMimeType: string,
): Promise<string | null> {
  const parts: any[] = [
    {
      inlineData: { mimeType: originalMimeType || 'image/jpeg', data: originalBase64 },
    },
    {
      text: `This is the BEFORE photo of the garden. Generate an AFTER version of THIS EXACT SAME GARDEN with the following design applied. The garden must be immediately recognisable as the same space.\n\n${visualPrompt}`,
    },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['Text', 'Image'] },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (!imagePart?.inlineData?.data) return null;
  const mime = imagePart.inlineData.mimeType || 'image/png';
  return `data:${mime};base64,${imagePart.inlineData.data}`;
}

// ─── VALIDATE RENDER ──────────────────────────────────────────────────────────

async function validateRender(
  originalBase64: string,
  originalMimeType: string,
  generatedBase64: string,
): Promise<any> {
  const validationPrompt = `You are a quality checker for a garden design app.

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
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: originalMimeType, data: originalBase64 } },
        { inlineData: { mimeType: 'image/png', data: generatedBase64 } },
        { text: validationPrompt },
      ],
    }],
    config: { responseMimeType: 'application/json', temperature: 0.1 },
  });

  const text = response.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '';
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return JSON.parse(clean);
}

// ─── POST HANDLER ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GOOGLE_API_KEY is not set' }, { status: 500 });
  }

  // ── Geographic region detection ──────────────────────────────────────────────
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0';
  let region = 'temperate Western Europe';
  let country = 'Ireland';
  try {
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,lat,lon`);
    const geo = await geoRes.json();
    if (geo.country) {
      country = geo.country;
      region = `${geo.regionName}, ${geo.country} (lat: ${geo.lat}, lon: ${geo.lon})`;
    }
  } catch {
    console.log('Geo lookup failed, using default region');
  }

  try {
    const {
      originalImageBase64,
      originalImageMimeType,
      style,
      orientation,
      clientName,
      turnstileToken,
      currency,
      creativityLevel: rawCreativityLevel,
    } = await request.json();

    const creativityLevel: number = typeof rawCreativityLevel === 'number'
      ? Math.max(1, Math.min(5, Math.round(rawCreativityLevel)))
      : 3;

    const CREATIVITY_DESCRIPTIONS: Record<number, string> = {
      1: 'Minimal: Potted plants, loose stone or gravel surfaces, minor soft landscaping only. No structural changes. Garden remains recognisably the same.',
      2: 'Subtle: In-ground border planting added, lawn retained, simple low-maintenance planting scheme. One or two new surface materials introduced.',
      3: 'Considered: Lawn partially replaced, defined planting zones, new path or edging treatment, moderate planting variety. A clearly designed garden but not radically different.',
      4: 'Ambitious: Significant replanting, new hard surface areas, structural planting including shrubs and small trees, possible level change or raised bed. Garden transformed but practical.',
      5: 'Full transformation: Complete redesign. Extensive hard landscaping, architectural planting, water features or focal structures possible, full in-ground planting scheme. Garden unrecognisable from original.',
    };
    const creativityDescription = CREATIVITY_DESCRIPTIONS[creativityLevel];

    // ── Turnstile verification ──────────────────────────────────────────────────
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: turnstileSecret, response: turnstileToken || '' }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ error: 'Security check failed. Please refresh and try again.' }, { status: 403 });
      }
    }

    if (!originalImageBase64 || !style) {
      return NextResponse.json({ error: 'Missing required fields: originalImageBase64, style' }, { status: 400 });
    }

    const effectiveMimeType = originalImageMimeType || 'image/jpeg';
    const effectiveOrientation = orientation || 'N';
    const effectiveClientName = clientName || 'Private Client';
    const effectiveCurrency = currency || 'GBP';

    // ── Step 1 — Spatial Fingerprint ────────────────────────────────────────────
    console.log('[Pipeline] Step 1: Spatial fingerprint...');
    let fingerprint: Record<string, any> = {};
    try {
      fingerprint = await step1_spatialFingerprint(originalImageBase64, effectiveMimeType, effectiveOrientation);
      console.log('[Pipeline] Step 1 complete:', JSON.stringify(fingerprint).slice(0, 200));
    } catch (err) {
      console.error('[Pipeline] Step 1 failed, continuing with empty fingerprint:', err);
    }

    // ── Step 2 — Garden Design JSON (master source of truth) ───────────────────
    // Runs before the Concept Base Plan so layoutDescription drives both visual outputs.
    console.log('[Pipeline] Step 2: Garden design...');
    let designJSON: Record<string, any> = {};
    try {
      designJSON = await step2_gardenDesign(
        originalImageBase64,
        effectiveMimeType,
        fingerprint,
        style,
        effectiveOrientation,
        region,
        country,
        effectiveCurrency,
        effectiveClientName,
        creativityLevel,
        creativityDescription,
      );
      console.log('[Pipeline] Step 2 complete, keys:', Object.keys(designJSON).join(', '));
    } catch (err) {
      console.error('[Pipeline] Step 2 failed:', err);
      return NextResponse.json({ error: 'Garden design generation failed. Please try again.' }, { status: 500 });
    }

    // ── Step 3 — Concept Base Plan (draws the design layout description) ────────
    // Receives designJSON so the plan is a faithful drawing of Step 2's decisions.
    console.log('[Pipeline] Step 3: Concept base plan...');
    let aerialImageBase64: string | null = null;
    try {
      aerialImageBase64 = await step3_conceptBasePlan(fingerprint, designJSON, effectiveOrientation);
      console.log('[Pipeline] Step 3 complete, size:', aerialImageBase64?.length ?? 0);
    } catch (err) {
      console.error('[Pipeline] Step 3 failed:', err);
    }

    // ── Step 4 — Build Visual Prompt ────────────────────────────────────────────
    console.log('[Pipeline] Step 4: Building visual prompt...');
    const visualPrompt = step4_buildVisualPrompt(fingerprint, designJSON, style, effectiveOrientation, creativityLevel);

    // ── Step 5 — Generate Render ────────────────────────────────────────────────
    console.log('[Pipeline] Step 5: Generating render...');
    let imageBase64: string | null = null;
    try {
      imageBase64 = await step5_generateRender(visualPrompt, originalImageBase64, effectiveMimeType);
      console.log('[Pipeline] Step 5 complete, size:', imageBase64?.length ?? 0);
    } catch (err) {
      console.error('[Pipeline] Step 5 failed:', err);
    }

    // ── Validate & retry ────────────────────────────────────────────────────────
    let validationResult: any = null;
    let retried = false;

    if (imageBase64) {
      const generatedRaw = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      try {
        validationResult = await validateRender(originalImageBase64, effectiveMimeType, generatedRaw);
        console.log('[Pipeline] Validation result:', JSON.stringify(validationResult));

        if (!validationResult?.overallPass) {
          retried = true;
          const failReasons = (validationResult?.failReasons || []).join('; ');
          const retryPrompt = `${visualPrompt}\n\nPREVIOUS ATTEMPT FAILED — THESE SPECIFIC ISSUES MUST BE CORRECTED:\n${failReasons}\nFix all of these in this new attempt. The result must pass all checks.`;

          console.log('[Pipeline] Retrying render after validation failure...');
          try {
            imageBase64 = await step5_generateRender(retryPrompt, originalImageBase64, effectiveMimeType);
          } catch (err) {
            console.error('[Pipeline] Retry render failed:', err);
          }
        }
      } catch (err) {
        console.error('[Pipeline] Validation failed:', err);
      }
    }

    if (!imageBase64 && !aerialImageBase64 && !Object.keys(designJSON).length) {
      return NextResponse.json({ imageError: true });
    }

    return NextResponse.json({ designJSON, imageBase64, aerialImageBase64, validationResult, retried, fingerprint });

  } catch (error: unknown) {
    console.error('[Pipeline] Unhandled error:', error);
    const message = error instanceof Error ? error.message : 'Unexpected error';

    if (message.includes('API_KEY') || message.includes('api key')) {
      return NextResponse.json({ imageError: true, error: 'Invalid or missing Google API key.' }, { status: 500 });
    }
    if (message.includes('quota') || message.includes('429')) {
      return NextResponse.json({ imageError: true, error: 'API quota exceeded. Please wait and try again.' }, { status: 429 });
    }
    if (message.includes('503') || message.includes('overloaded')) {
      return NextResponse.json({ imageError: true, error: 'Google AI service is over capacity. Please try again shortly.' }, { status: 503 });
    }

    return NextResponse.json({ imageError: true, error: message }, { status: 500 });
  }
}
