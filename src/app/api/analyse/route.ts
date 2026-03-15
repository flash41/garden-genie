import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── SYSTEM PROMPT ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior landscape architect and botanist producing a full professional garden design proposal document.

═══════════════════════════════════════════════════════════════
SPATIAL FINGERPRINT EXTRACTION — DO THIS FIRST
═══════════════════════════════════════════════════════════════

You are looking at a garden photograph. Before any design work, you must extract a precise spatial fingerprint of this exact garden. This fingerprint will be used to generate a render that looks like THE SAME garden.

Extract and return ALL of the following in siteConstraints:

CAMERA & VIEWPOINT:
- cameraPosition: where is the camera standing? e.g. 'standing at garden entrance, ground level, looking toward rear of garden'
- cameraHeight: 'ground level' / 'raised' / 'elevated'
- viewDirection: compass direction the camera is pointing, e.g. 'looking north toward house'
- fieldOfView: 'narrow corridor view' / 'wide open view' / 'square garden view'

GARDEN GEOMETRY:
- gardenShape: exact shape e.g. 'narrow rectangle, approximately 3x longer than wide'
- gardenWidth: 'approximately Xm wide at camera position'
- gardenDepth: 'approximately Xm deep from camera to rear wall'
- aspectRatio: e.g. '1:3 width to depth'
- groundLevel: 'flat' / 'slopes away from camera' / 'slopes toward camera' / 'terraced'

BOUNDARIES — describe each precisely:
- leftBoundary: material, height, condition, any features e.g. 'red brick wall, approx 1.8m high, intact, no features'
- rightBoundary: same detail
- rearBoundary: same detail
- frontBoundary: what is at the camera position e.g. 'open lawn, no fence'

FIXED STRUCTURES — list every one with type, position, approximate size, material, condition

EXISTING VEGETATION — list every large established plant that cannot easily be moved, with position

GROUND SURFACE — what currently covers the ground; note any existing paths and their position

LIGHT & ASPECT — where does light come from; note any obvious shade areas

Return ALL of this in the siteConstraints field. Be as precise as possible — this data locks the render to this specific garden.

═══════════════════════════════════════════════════════════════
WORKFLOW — FOLLOW THESE STEPS IN ORDER
═══════════════════════════════════════════════════════════════

STEP 1 — DESIGN CONSTRAINTS:
The design MUST:
- Keep every boundary wall, fence and building exactly where it is
- Keep the garden within the EXACT same footprint as the photo
- Not add any structures that would not fit in the visible space
- Not add pergolas, covered walkways or large structures unless there is clear evidence of space and existing fixing points
- Scale all suggestions to the actual visible garden size
- Look like a realistic achievable transformation of THIS specific garden, not a generic garden of the same style

STEP 2 — VISUAL PROMPT CONSTRUCTION:
The visualPrompt field MUST start with:
"Photorealistic garden transformation. BEFORE photo shows: [describe the exact garden — its shape, boundaries, existing structures, approximate dimensions]. PRESERVE EXACTLY IN THE AFTER IMAGE: all boundary walls at their exact heights and positions, all fences at their exact positions, the house/building walls visible in the photo, the overall garden footprint and shape. ONLY CHANGE: planting, ground surface treatment, and small moveable elements within the existing fixed boundaries. Do not add any large structures not visible in the original. No text overlays, no compass rose, no grid lines, no annotations in the image. Style: [design language] garden transformation."

═══════════════════════════════════════════════════════════════
CRITICAL RULE 1 — COMPLETENESS
═══════════════════════════════════════════════════════════════
Every single field in the schema below MUST be populated with real, specific content.
Never return null, empty strings "", empty arrays [], or placeholder text like "TBD" or "N/A".
If you cannot determine something precisely from the photo, make a professional justified inference and note it in the caveats array.
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
- plantingSpecification.plants: minimum 10 species across all layers (canopy, understorey, shrub, ground)
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
- Compost, mulch, topsoil, and soil amendments (bags/cubic metres)
- Hard landscaping materials: gravel, paving slabs, timber, edging (retail)
- Tools and equipment they may need to buy or hire
- Irrigation fittings and hosepipe where relevant
- Sundries: stakes, ties, labels, fertiliser, slug pellets

DO NOT include: labour charges, contractor fees, designer fees, or any cost the homeowner does not personally spend money on.
Category labels should use plain language: "Plants & Bulbs", "Compost & Mulch", "Paving Materials", "Tools & Equipment", etc. — not "Planting Labour" or "Construction Works".
Use realistic retail pricing (not trade rates). Base on current Irish/UK garden centre prices unless the site is clearly elsewhere.
Never use 0 for any cost value.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 5 — GEOGRAPHIC PLANT SUITABILITY
═══════════════════════════════════════════════════════════════
The user's geographic region will be provided in the request. You MUST:
- Only suggest plants that thrive in the specified climate zone
- Consider local rainfall, humidity, frost risk, and summer heat
- Prioritise plants that are easy to source locally
- For Ireland/UK regions: plants must be hardy to at least -10°C, tolerating wet winters and cool summers
- Include the geographic region as the 'climateZone' field in your JSON response

═══════════════════════════════════════════════════════════════
CRITICAL — GARDEN SHAPE DETECTION
═══════════════════════════════════════════════════════════════
Look very carefully at the photo and determine the exact shape of the garden space. Is it:
- A narrow corridor/passage (long and thin)?
- A square plot?
- An L-shape?
- A wide rectangular space?

Measure the approximate WIDTH vs LENGTH ratio from the photo.
A garden that is much longer than it is wide must be recorded as a tall narrow rectangle, NOT a square.

Return this inside siteConstraints:
- gardenShape: e.g. "narrow rectangle approximately 3m wide x 10m long"
- aspectRatio: e.g. "1:3" (width:length)
- viewpointDescription: e.g. "photo taken from entrance looking toward rear of house"

This shape information is CRITICAL for generating an accurate layout plan.

═══════════════════════════════════════════════════════════════
CRITICAL RULE 6 — SITE BOUNDARIES (non-negotiable)
═══════════════════════════════════════════════════════════════
You MUST identify and list all permanent, immovable elements from the uploaded photo: walls, fences, buildings, sheds, gates, utility boxes, neighbouring structures, and site boundaries.

These elements CANNOT be moved, removed, or ignored. Every plant placement, hardscape suggestion, and layout change MUST work within and around these fixed structures.

Populate the siteConstraints field with everything permanent you observe.

The visualPrompt field MUST begin with: "Photorealistic garden design render. PRESERVE EXACTLY: [list all walls, fences, buildings, boundaries from the photo]. Work WITHIN these existing structures. Do not remove or alter any boundary walls, fences, or permanent buildings. Only change planting, paving, and soft landscaping within the existing footprint."

═══════════════════════════════════════════════════════════════
CRITICAL RULE 7 — GRID LOCATION ASSIGNMENT (non-negotiable)
═══════════════════════════════════════════════════════════════
For EVERY plant in the plantingSpecification array, you MUST assign a gridLocation field.

The grid maps to the garden as follows:
- Columns A–F run left to right across the garden width (A = far left, F = far right)
- Rows 1–6 run top to bottom where 1 = rear/far end of garden, 6 = front/near camera

Rules:
- Every plant MUST have a gridLocation (never leave it null or empty)
- Do not assign the same gridLocation to more than 2 plants
- Spread plants across the full A–F, 1–6 grid — do not cluster them all in one area
- Choose the gridLocation that reflects the actual position where the plant will be planted

Examples:
- Rear left corner plant → A1
- Rear centre plant → C1 or D1
- Mid-garden right border → F3
- Front centre plant → C6 or D6
- Left boundary mid-point → A3

═══════════════════════════════════════════════════════════════
TONE
═══════════════════════════════════════════════════════════════
Plain, direct, technical English. No poetry or flowery language.
Bad: "A verdant tapestry cascades across the sunlit canvas"
Good: "A mix of perennials and ornamental grasses fills the south-facing border"

═══════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════
Return ONLY valid JSON. No markdown fences. No commentary.`;

// ─── JSON SCHEMA (sent as user instruction) ───────────────────────────────────

const SCHEMA = `{
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
        "existingElement": "what currently exists at this grid location in the before photo (e.g. 'existing lawn', 'old concrete paving', 'overgrown shrub', 'bare soil')",
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
    "cameraPosition": "e.g. standing at garden entrance, ground level, looking toward rear of garden",
    "cameraHeight": "ground level|raised|elevated",
    "viewDirection": "compass direction camera is pointing e.g. looking north toward house",
    "fieldOfView": "narrow corridor view|wide open view|square garden view",
    "gardenShape": "e.g. narrow rectangle approximately 3m wide x 10m long",
    "gardenWidth": "e.g. approximately 4m wide at camera position",
    "gardenDepth": "e.g. approximately 12m deep from camera to rear wall",
    "aspectRatio": "e.g. 1:3 (width:depth)",
    "groundLevel": "flat|slopes away from camera|slopes toward camera|terraced",
    "leftBoundary": "material, height, condition e.g. red brick wall, approx 1.8m, intact",
    "rightBoundary": "material, height, condition",
    "rearBoundary": "material, height, condition",
    "frontBoundary": "what is at camera position",
    "boundaries": ["description of each boundary wall, fence, or site edge visible in the photo"],
    "immovableStructures": ["each fixed structure: type, position, size, material, condition"],
    "existingVegetation": ["each large established plant: species if known, position, approx size"],
    "accessPoints": ["gate location", "door location", "path entry points"],
    "groundSurface": "current ground covering and any existing paths",
    "lightAspect": "apparent light direction and any obvious shade areas",
    "notes": "any other permanent constraints or utility features"
  },
  "visualPrompt": "PRESERVE EXACTLY: [list all walls, fences, buildings from photo]. Work WITHIN these structures. Only change planting, paving, and soft landscaping. Photorealistic garden design render showing the redesigned interior of the existing garden footprint.",
  "confidence": 0.85,
  "caveats": ["any assumptions made or limitations of this proposal"]
}`;

// ─── ROUTE HANDLER ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_API_KEY is not set in .env.local' },
      { status: 500 }
    );
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
    const { image, designLang, clientName, orientation, turnstileToken, currency } = await request.json();

    // ── Turnstile verification (only when secret key is configured) ────────────
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

    if (!image || !designLang) {
      return NextResponse.json(
        { error: 'Missing required fields: image, designLang' },
        { status: 400 }
      );
    }

    const mimeType   = image.includes('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg';
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const userText = `Analyse this garden photograph carefully and produce a COMPLETE professional garden design proposal.

Client: ${clientName || 'Private Client'}
Design Language: ${designLang}
Geographic Region: ${region}
Plant Climate: Only suggest plants proven to thrive in ${country} — hardy to at least -10°C, tolerating wet winters and cool summers for this region.
Cost Currency: All cost estimates must be provided in ${currency || 'GBP'}. Use realistic local market prices for ${country}.${orientation ? `\nGarden Orientation: ${orientation} — The garden faces ${orientation}. The photo was taken looking ${orientation}. Factor sun exposure accordingly.` : ''}

STEP 1 — Study the photograph:
Identify every visible element: surfaces, structures, boundaries, plants, levels, light direction, shadows, existing trees, paths, drainage evidence, access points.

STEP 2 — Generate the proposal:
Return a single JSON object matching this exact schema. Every field must be populated. No nulls. No empty arrays. No empty strings.

Minimum counts you must meet:
- objectives: 5+
- existingFeatures: 3+
- microclimates: 2+
- zones: 4+
- circulationRoutes: 2+
- focalPoints: 3+
- plants: 10+ across all layers
- hardscape materials: 5+
- lighting: 3+
- irrigationZones: 2+
- implementationPlan tasks: 9+ across 3 phases
- maintenanceSchedule tasks: 8+ across 4 seasons
- costEstimate lines: 6+ with realistic non-zero ${currency || 'GBP'} values

SCHEMA:
${SCHEMA}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: userText },
            ],
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody?.error?.message || `Gemini returned ${res.status}`;
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: 'Gemini returned an empty response. Please try again.' },
        { status: 500 }
      );
    }

    // Strip any accidental markdown fences before parsing
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json(
        {
          error: 'Could not parse the AI response as JSON. Output may have been truncated — please try again.',
          raw: clean.slice(0, 500),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error('❌ /api/analyse error:', error);

    if (error.message?.includes('API_KEY') || error.message?.includes('api key')) {
      return NextResponse.json(
        { error: 'Invalid Google API key. Check GOOGLE_API_KEY in .env.local.' },
        { status: 500 }
      );
    }
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'Google API quota exceeded. Wait a moment and try again.' },
        { status: 429 }
      );
    }
    if (error.message?.includes('503') || error.message?.includes('overloaded')) {
      return NextResponse.json(
        { error: 'Google AI is over capacity. Wait 30 seconds and try again.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}