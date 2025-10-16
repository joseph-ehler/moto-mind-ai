# Canonical Vehicle Image Prompt Library
## Studio-Style AI Generation with Consistency

*Generated: 2024-09-24*

---

## Overview

This document contains the complete prompt library for generating consistent, professional vehicle images using AI. Each prompt is designed to produce studio-quality results with standardized lighting, angles, and backgrounds.

## Base Constraints (Applied to All Prompts)

```typescript
const baseConstraints = {
  canvas: '16:9 aspect ratio, 2048×1152 resolution',
  lighting: 'soft, even studio lighting with gentle floor shadow',
  background: 'seamless neutral light grey background (#F6F7F9)',
  quality: 'photorealistic, high detail, professional automotive photography',
  restrictions: 'no brand logos, no badges, no license plates, no watermarks, no people, no motion blur, no background props'
}
```

---

## Angle Specifications

### 1. Front Three-Quarter View (`front_3q`)
**Primary angle for vehicle cards and listings**

```
Angle: front three-quarter view, camera height ~1.5m, 35mm lens equivalent. 
Show front and driver side clearly with wheels centered and visible.
```

**Example Prompt:**
```
Render a photorealistic studio image of a 2013 Honda Civic LX sedan, exterior color Pearl White.

Angle: front three-quarter view, camera height ~1.5m, 35mm lens equivalent. Show front and driver side clearly with wheels centered and visible.

Studio setup: soft, even studio lighting with gentle floor shadow; seamless neutral light grey background (#F6F7F9).
Technical: 16:9 aspect ratio, 2048×1152 resolution, photorealistic, high detail, professional automotive photography.
Clean factory configuration, no aftermarket accessories.

Avoid: no brand logos, no badges, no license plates, no watermarks, no people, no motion blur, no background props.
```

### 2. Side Profile View (`side`)
**Perfect for showcasing vehicle proportions**

```
Angle: perfect side profile, camera height ~1.2m, 50mm lens equivalent. 
Show complete vehicle profile from driver side with all wheels visible.
```

**Example Prompt:**
```
Render a photorealistic studio image of a 2015 Ford F-150 SuperCrew pickup truck, 4WD, Oxford White.

Angle: perfect side profile, camera height ~1.2m, 50mm lens equivalent. Show complete vehicle profile from driver side with pickup bed and all wheels visible.

Studio setup: soft, even studio lighting with gentle floor shadow; seamless neutral light grey background (#F6F7F9).
Technical: 16:9 aspect ratio, 2048×1152 resolution, photorealistic, high detail, professional automotive photography.
Clean factory configuration, no aftermarket accessories.

Avoid: no brand logos, no badges, no license plates, no watermarks, no people, no motion blur, no background props.
```

### 3. Rear Three-Quarter View (`rear_3q`)
**Shows rear design and passenger side**

```
Angle: rear three-quarter view, camera height ~1.5m, 35mm lens equivalent. 
Show rear and passenger side clearly with taillights and rear wheels visible.
```

### 4. Interior Dashboard View (`interior`)
**For interior shots and cabin features**

```
Angle: interior dashboard view from driver seat position. 
Show steering wheel, instrument cluster, and center console. 
Soft lighting through windows, no direct sunlight.
```

---

## Vehicle-Specific Prompt Examples

### Sedan (Honda Civic)
```
Render a photorealistic studio image of a 2016 Honda Civic EX sedan, four-door sedan body style, exterior color Lunar Silver Metallic.

Angle: front three-quarter view, camera height ~1.5m, 35mm lens equivalent. Show front and driver side clearly.

Studio setup: soft, even studio lighting with gentle floor shadow; seamless neutral light grey background (#F6F7F9).
Technical: 16:9 aspect ratio, 2048×1152 resolution, photorealistic, high detail, professional automotive photography.
Clean factory configuration, no aftermarket accessories. Wheels centered and visible.

Avoid: no brand logos, no badges, no license plates, no watermarks, no people, no motion blur, no background props.
```

### Pickup Truck (Ford F-150)
```
Render a photorealistic studio image of a 2019 Ford F-150 SuperCrew pickup truck, 4WD, Magnetic Metallic.

Show pickup truck proportions with visible bed and crew cab doors. Ensure higher ride height typical of 4WD trucks.

Angle: front three-quarter view, camera height ~1.5m, 35mm lens equivalent. Show front and driver side clearly.

Studio setup: soft, even studio lighting with gentle floor shadow; seamless neutral light grey background (#F6F7F9).
Technical: 16:9 aspect ratio, 2048×1152 resolution, photorealistic, high detail, professional automotive photography.
Clean factory configuration, no aftermarket accessories. Wheels centered and visible.

Avoid: no brand logos, no badges, no license plates, no watermarks, no people, no motion blur, no background props.
```

### SUV (Toyota RAV4)
```
Render a photorealistic studio image of a 2020 Toyota RAV4 XLE SUV, AWD, Blueprint exterior color.

Show SUV body style with higher ride height and ground clearance typical of compact SUVs. Ensure proportions are taller than sedan.

Angle: front three-quarter view, camera height ~1.5m, 35mm lens equivalent. Show front and driver side clearly.

Studio setup: soft, even studio lighting with gentle floor shadow; seamless neutral light grey background (#F6F7F9).
Technical: 16:9 aspect ratio, 2048×1152 resolution, photorealistic, high detail, professional automotive photography.
Clean factory configuration, no aftermarket accessories. Wheels centered and visible.

Avoid: no brand logos, no badges, no license plates, no watermarks, no people, no motion blur, no background props.
```

### Hatchback (Volkswagen Golf)
```
Render a photorealistic studio image of a 2018 Volkswagen Golf SE hatchback, FWD, Pure White exterior color.

Show hatchback body style with rear liftgate and compact proportions. Ensure rear roofline slopes down to hatch.

Angle: front three-quarter view, camera height ~1.5m, 35mm lens equivalent. Show front and driver side clearly.

Studio setup: soft, even studio lighting with gentle floor shadow; seamless neutral light grey background (#F6F7F9).
Technical: 16:9 aspect ratio, 2048×1152 resolution, photorealistic, high detail, professional automotive photography.
Clean factory configuration, no aftermarket accessories. Wheels centered and visible.

Avoid: no brand logos, no badges, no license plates, no watermarks, no people, no motion blur, no background props.
```

### Coupe (BMW 3 Series)
```
Render a photorealistic studio image of a 2017 BMW 3 Series 330i coupe, RWD, Jet Black exterior color.

Show two-door coupe body style with longer doors and lower roofline than sedan. Ensure sporty proportions.

Angle: front three-quarter view, camera height ~1.5m, 35mm lens equivalent. Show front and driver side clearly.

Studio setup: soft, even studio lighting with gentle floor shadow; seamless neutral light grey background (#F6F7F9).
Technical: 16:9 aspect ratio, 2048×1152 resolution, photorealistic, high detail, professional automotive photography.
Clean factory configuration, no aftermarket accessories. Wheels centered and visible.

Avoid: no brand logos, no badges, no license plates, no watermarks, no people, no motion blur, no background props.
```

---

## Color Specifications

### Standard Colors
- **Pearl White**: `Pearl White` or `Summit White`
- **Jet Black**: `Jet Black` or `Obsidian Black Pearl`
- **Neutral Silver**: `Neutral Silver Metallic` (default)
- **Deep Blue**: `Deep Blue Pearl` or `Mystic Blue Metallic`
- **Crimson Red**: `Crimson Red Pearl` or `Ruby Red Metallic`

### Color Prompt Additions
```typescript
const colorPrompts = {
  pearl_white: ", exterior color Pearl White with subtle metallic flake",
  jet_black: ", exterior color Jet Black with deep gloss finish", 
  neutral_silver: ", exterior color Neutral Silver Metallic",
  deep_blue: ", exterior color Deep Blue Pearl with metallic finish",
  crimson_red: ", exterior color Crimson Red Pearl"
}
```

---

## Verification Prompts

### Standard Verification
```
Analyze this image and answer: Is this a {year} {make} {model} {bodyStyle}? 

Check for:
1. Correct body style ({bodyStyle})
2. Appropriate proportions for {make} {model}
3. Year range accuracy ({year} era styling)
4. Angle matches request ({angle})
5. Background is neutral grey studio setting
6. No visible brand logos or badges

Respond with JSON: { 
  "match": true/false, 
  "confidence": 0-100, 
  "bodyStyleCorrect": true/false,
  "proportionsAccurate": true/false,
  "yearAppropriate": true/false,
  "angleCorrect": true/false,
  "backgroundClean": true/false,
  "issues": ["list of problems if any"] 
}
```

### Body Style Specific Verification
```typescript
const bodyStyleChecks = {
  sedan: "four doors, traditional trunk, lower ride height",
  hatchback: "rear liftgate, no separate trunk, compact proportions", 
  suv: "higher ride height, larger ground clearance, taller proportions",
  truck: "visible pickup bed, higher ride height, cab and bed separation",
  coupe: "two doors, longer door panels, lower sporty roofline",
  wagon: "extended rear cargo area, longer body than sedan"
}
```

---

## Error Handling & Regeneration

### Common Issues & Solutions

**Wrong Body Style Generated:**
```
// Add stronger body style constraints
"Ensure this is specifically a {bodyStyle} with {bodyStyleDescription}. 
Do NOT generate a {wrongBodyStyle}. 
The vehicle must have {specificFeatures}."
```

**Incorrect Proportions:**
```
// Add manufacturer-specific guidance
"Ensure proportions match {make} design language. 
{make} {model} typically has {specificProportions}."
```

**Brand Logos Visible:**
```
// Strengthen logo removal
"CRITICAL: Remove all brand badges, logos, and emblems. 
Show clean grille and body panels without any manufacturer branding."
```

### Regeneration Strategy
1. **First attempt**: Standard prompt
2. **Second attempt**: Add specific constraints for detected issues
3. **Third attempt**: Simplify prompt, focus on basic accuracy
4. **Fallback**: Use generic body style template

---

## Implementation Examples

### TypeScript Integration
```typescript
import { PromptBuilder } from '@/lib/canonical-images'

const builder = new PromptBuilder()

// Generate front 3/4 view
const prompt = builder.buildPrompt({
  year: 2020,
  make: 'Toyota',
  model: 'Camry', 
  bodyStyle: 'sedan',
  color: 'Pearl White'
}, 'front_3q')

// Generate verification prompt
const verifyPrompt = builder.buildVerificationPrompt({
  year: 2020,
  make: 'Toyota', 
  model: 'Camry',
  bodyStyle: 'sedan'
}, 'front_3q')
```

### API Usage
```bash
# Get canonical image
curl "http://localhost:3000/api/canonical-image?year=2020&make=toyota&model=camry&bodyStyle=sedan&angle=front_3q"

# Generate new image
curl -X POST "http://localhost:3000/api/canonical-image" \
  -H "Content-Type: application/json" \
  -d '{
    "specs": {
      "year": 2020,
      "make": "Toyota",
      "model": "Camry",
      "bodyStyle": "sedan",
      "color": "Pearl White"
    },
    "angles": ["front_3q", "side"],
    "async": true
  }'
```

---

## Quality Assurance Checklist

### Pre-Generation
- [ ] Vehicle specs validated (year, make, model, body style)
- [ ] Generation mapping exists for year range
- [ ] Color normalized to standard palette
- [ ] Canonical key generated correctly

### Post-Generation
- [ ] Image matches requested body style
- [ ] Proportions appropriate for make/model
- [ ] Background is clean neutral grey
- [ ] No brand logos or badges visible
- [ ] Lighting and shadows consistent
- [ ] Resolution and aspect ratio correct

### Verification Thresholds
- **Confidence > 80%**: Auto-approve and cache
- **Confidence 60-80%**: Manual review queue
- **Confidence < 60%**: Auto-regenerate with stronger constraints

---

This prompt library ensures consistent, professional vehicle images across the entire fleet while maintaining legal compliance and cost efficiency through the canonical key system.
