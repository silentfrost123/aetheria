# Chatworld showcase artwork — Grok prompts (v2)

v2 master block reverse-engineered from the approved Jessa render
(`public/avatars/jessa.jpg`, generated 18 Sep 2026). Paste each prompt into
Grok as-is, square 1:1. Upload results here; they slot into `public/avatars/`
under the filenames shown.

Done: **jessa.jpg** ✔ (Grok, approved)

## Master style block (already merged into every prompt below)

> Beautiful highly detailed semi-realistic painterly anime illustration, dark
> fantasy key visual. Dramatic warm orange firelight glowing from behind the
> figure, floating ember sparks and soft bokeh in a dark smoky black
> background. Extremely fine hair strand detail with glossy highlights,
> intricate luminous irises with layered catchlights, natural skin texture,
> ornate textured leather and metal costume details with embossed filigree.
> Rich saturated color depth, cinematic rim light, subtle film grain.
> Head-and-shoulders portrait, centered, square 1:1. No text, no watermark,
> no borders.

---

## 1. Hana Kirishima → hana.jpg

Beautiful anime girl with a disdainful tsundere glare and chin lifted, long
flowing ash-blonde hair in a high half-ponytail with loose face-framing
strands, sharp amber-orange eyes, immaculate black school uniform blazer with
ornate gold filigree trim, crisp white shirt, loosened black necktie. [Master
style block]

## 2. Lady Seraphine Valcor → seraphine.jpg

Elegant anime noblewoman with a cool composed expression and posture like a
drawn blade, platinum-silver hair in a precise braided updo, piercing
ice-blue eyes, midnight-blue gown with intricate silver embroidery and a high
ornate collar, small sapphire earrings. [Master style block]

## 3. Sora Amagai → sora.jpg

Beautiful anime girl with a clipped aloof expression and a faint blush of
annoyance, sleek dark-indigo hair in a precise low ponytail, cool violet eyes
behind rimless glasses, one loose hairpin she never notices, immaculate
school uniform with a red president's armband. [Master style block]

## 4. Vivian "Vee" Marcone → vee.jpg

Striking anime woman with a low amused unhurried smile, wavy burgundy-dark
hair falling over one shoulder, crimson-brown eyes, bold red lipstick,
tailored black suit with a thin gold necklace, mafia-heiress poise, moving
quietly for someone in heels. [Master style block]

---

# v3 — legacy cast + story banner

Characters are square 1:1. The Ashen Kingdom story banner is **9:2 ultrawide**.

## Elena → elena.jpg (1:1)

Beautiful anime vampire queen with pale skin like moonlight, very long
straight black hair, eyes the color of old blood, tall regal bearing, dark
velvet gown with ornate silver embroidery, predator's grace and a faint
ancient melancholy. Beautiful highly detailed semi-realistic painterly anime
illustration, dark fantasy key visual. Dramatic warm orange firelight glowing
from behind the figure, floating ember sparks and soft bokeh in a dark smoky
black background. Extremely fine hair strand detail with glossy highlights,
intricate luminous irises with layered catchlights, natural skin texture,
ornate textured velvet and silver costume details with embossed filigree.
Rich saturated color depth, cinematic rim light, subtle film grain.
Head-and-shoulders portrait, centered, square 1:1. No text, no watermark,
no borders.

## Raven → raven.jpg (1:1)

Beautiful anime cyberpunk hacker girl, short dyed-black hair with violet
tips, a small glowing data-port implanted at her temple, slim restless
energy, patched synth-leather jacket with straps and worn zippers,
cybernetic eyes that flicker faintly blue, thin neon light reflections on
her cheek. Beautiful highly detailed semi-realistic painterly anime
illustration, dark cyber-fantasy key visual. Dark rainy neon city bokeh
behind her mixed with floating ember sparks in a smoky black background.
Extremely fine hair strand detail with glossy highlights, intricate luminous
irises with layered catchlights, natural skin texture, detailed worn leather
and metal hardware. Rich saturated color depth, cinematic rim light, subtle
film grain. Head-and-shoulders portrait, centered, square 1:1. No text, no
watermark, no borders.

## Marcus → marcus.jpg (1:1)

Handsome rugged anime veteran knight, broad-shouldered and battle-scarred
with a scar across one brow, short dark hair streaked with grey, steady grey
eyes, ash-grey cloak of the Veil over worn dented plate armor with chainmail
at the neck, weathered honorable expression. Beautiful highly detailed
semi-realistic painterly anime illustration, dark fantasy key visual.
Dramatic warm orange firelight glowing from behind the figure, floating
ember sparks and soft bokeh in a dark smoky black background. Extremely fine
hair and stubble detail, intricate luminous irises with layered catchlights,
natural weathered skin texture, ornate dented steel and worn cloak fabric
detail. Rich saturated color depth, cinematic rim light, subtle film grain.
Head-and-shoulders portrait, centered, square 1:1. No text, no watermark,
no borders.

## The Ashen Kingdom → ashen-kingdom.jpg (9:2 ultrawide)

Ultrawide cinematic dark fantasy panorama of the Ashen Kingdom 300 years
after the Sundering: the walled white-stone capital city of Arath with iron
gates on a hill, ruined burned towers and ash drifts in the foreground,
embers and ash falling like snow, smoky black sky lit by a burning orange
horizon, tiny cloaked traveler silhouettes on a northern road. Beautiful
highly detailed semi-realistic painterly anime matte painting, dark fantasy
key visual. Extremely fine architectural and texture detail, rich saturated
color depth, dramatic firelight and cinematic rim light, subtle film grain.
Ultrawide panorama, aspect ratio 9:2. No text, no watermark, no borders.

---

# v4 — Studio slate: 5 stories + 5 characters

Original Chatworld content added 19 Sep 2026 (`src/server/data/studio.ts`).

**Aspect ratios — all ten images are 9:2 ultrawide.**
- **Story covers: 9:2** with the title rendered into the art.
- **Character key visuals: 9:2** as well. Each doubles as the character's
  hero banner *and* the source for its square avatar: keep the head and
  shoulders centred in the middle third, because a centre square crop of the
  render becomes the round/square card avatar on the site. Everything outside
  that middle third is scenery that only shows on the character's page.

**Safe-area note for story covers:** the app's story cards show the middle
**16:10** band of the image. Keep the title and the main subject inside the
central third of the frame so the cover still reads as a card thumbnail on the
site *and* as a full-width banner. Nothing important in the top or bottom 20%.

**Filenames** — save each render to exactly this name in `public/avatars/`:
`ninth-bell.jpg`, `glass-season.jpg`, `understudy.jpg`, `salt-and-iron.jpg`,
`last-summer.jpg`, `wren.jpg`, `nadia.jpg`, `milo.jpg`, `ronan.jpg`, `sera.jpg`

---

## Shared render DNA

Every image in this slate shares a rendering style so the platform looks like
one catalogue rather than ten commissions. Paste this block at the end of each
prompt, after the scene description:

> Painterly semi-realistic anime illustration, premium key-visual quality.
> Extremely fine detail in hair, fabric and surface texture; natural skin with
> visible pores and subsurface warmth; cinematic volumetric lighting with a
> clear dominant light source and visible atmosphere (dust, haze, embers or
> frost as fits the scene). Rich colour depth with one dominant hue family and
> a contrasting accent, deep controlled shadows, subtle film grain, shallow
> depth of field on the background. No watermark, no signature, no borders, no
> extra text beyond what is specified.

---

## STORY COVERS — 9:2 ultrawide, title in the artwork

### 1. The Ninth Bell → ninth-bell.jpg
Dark fantasy mystery. A drowned canal city at midnight in heavy rain.

> Ultrawide cinematic panorama, 9:2 aspect ratio, of a rain-lashed canal city at
> night: tall bronze bell tower rising slightly left of centre, eight smaller
> bell shapes silhouetted along the roofline, black water reflecting orange
> window light in the flooded street below. Wooden shutters, hanging lanterns,
> rope and wet slate. In the middle distance a lone hooded figure with a brass
> ear trumpet stands on a bridge looking up at the tower, seen small against
> the architecture — the composition's focal point. Storm light, rain streaks
> catching a single warm lamp, cold blue-grey palette with amber accents.
> Centred composition with generous empty sky at the top for typography.
> Title text, integrated into the artwork as large engraved-storybook display
> typography in the upper-centre band: **THE NINTH BELL** — weathered pale gold
> serif capitals with fine inlaid bronze texture, subtle embossed depth, sitting
> inside the central 16:10 safe area, not touching the frame edges. [Shared
> render DNA]

### 2. Glass Season → glass-season.jpg
Melancholy romance. A frozen fishing town, mid-autumn.

> Ultrawide cinematic panorama, 9:2 aspect ratio, of a small northern fishing
> harbour stopped in time: gulls hanging motionless in the air mid-stroke,
> fishing boats locked in flat grey water, a fisherman frozen mid-laugh on the
> quay, frost crystals climbing the inside of shop windows. Warm amber light
> spilling from one small café at the centre of frame — the only lit window on
> the whole waterfront — with a woman visible at the counter wiping a surface
> that is already clean. Cool blue-grey and pale gold palette, breath-fog,
> delicate frost detail on ropes and rails. Title text integrated into the
> artwork in the upper-centre band: **GLASS SEASON** — elegant thin serif
> capitals, pale frosted silver with a subtle rim of warm light, letters
> lightly touched by frost, inside the central safe area. [Shared render DNA]

### 3. The Understudy → understudy.jpg
Cyberpunk identity thriller. A broadcast city, night.

> Ultrawide cinematic panorama, 9:2 aspect ratio, of a neon-drowned cyberpunk
> skyline at night, stacked advertisement surfaces in magenta and cyan climbing
> out of frame, rain-slick walkways far below. In the centre foreground, a
> reflective glass corridor: a young man with a shaved head stands facing his
> own reflection, and the reflection's features blur slightly at the edges so
> it is not quite identical to him — the composition's focal point. Ozone haze,
> lens flare from a passing advertisement beam, cool cyan-magenta palette with
> one warm interior light. Title text integrated into the artwork in the
> upper-centre band: **THE UNDERSTUDY** — clean modern geometric sans-serif
> capitals, white with a faint chromatic-aberration edge, glowing softly like
> an emitted sign, inside the central safe area. [Shared render DNA]

### 4. Salt and Iron → salt-and-iron.jpg
Historical fantasy. A rain-lashed coastal road at dusk.

> Ultrawide cinematic panorama, 9:2 aspect ratio, of a storm-battered coastline
> road at dusk: white salt-marsh grass, standing stones marking a boundary
> line, low iron-grey sea and distant six stone forts standing in open water on
> the horizon. In the centre, two figures face each other across the road in
> the rain — an officer in a long grey coat holding a raised lantern, and a
> traveller with a laden cart — neither reaching for a weapon. Cold slate, salt
> white and rust-orange lantern palette, torrential rain, spindrift, low dark
> clouds. Title text integrated into the artwork in the upper-centre band:
> **SALT AND IRON** — heavy weathered serif capitals, iron-grey with salt-white
> accents, slightly corroded edges, inside the central safe area. [Shared
> render DNA]

### 5. Our Last Summer in Light → last-summer.jpg
Science-fiction drama. A sun deck inside a generation ship.

> Ultrawide cinematic panorama, 9:2 aspect ratio, of an immense starship
> interior: six kilometres of mirrored conduit running to the horizon and
> opening into a shaft of genuine golden starlight falling onto a long deck.
> Children run along the lit deck, silhouetted; a young woman in a sun-faded
> uniform stands at the edge with a ledger, watching them rather than the
> light — the composition's focal point. Warm gold and clean white against the
> cool grey of the surrounding machinery, drifting dust motes in the beam,
> polished metal reflecting the sunlight. Title text integrated into the
> artwork in the upper-centre band: **OUR LAST SUMMER IN LIGHT** — refined
> thin capitals with generous letter spacing, warm white with a soft golden
> glow, inside the central safe area. [Shared render DNA]

---

## CHARACTER KEY VISUALS — 9:2 ultrawide

Each prompt below describes the subject; the wide frame carries the
environment outward to both sides. Ask for the background to continue left and
right rather than zooming out from the subject — the middle third must still
read as a clean portrait if cropped square.

### 6. Wren Calloway → wren.jpg
> Ultrawide key visual, 9:2 aspect ratio, character centred in the middle third. Head-and-shoulders framing of a nineteen-year-old girl
> with a watchful, unblinking grey gaze and a chin held slightly back, reading
> the viewer the way she reads a ledger. Soot-dark hair cropped short and
> uneven, self-cut. Ink-stained fingers, a brass ear trumpet hanging at her
> collar like an ornament, a plain dark coat with a tide-house brass pin. She
> stands in a cold bell tower at night, wet bronze and rain visible behind her,
> a single lantern lighting one half of her face and leaving the other in
> shadow. Palette: bronze, wet slate, one warm amber light. Composed, wary,
> faintly superior. No text. The tower interior continues left and right into darkness, wet bronze struts and hanging ropes receding, rain visible through tall openings on both sides of frame. Middle third clean for a square crop. [Shared render DNA]

### 7. Nadia Voss → nadia.jpg
> Ultrawide key visual, 9:2 aspect ratio, character centred in the middle third. Head-and-shoulders framing of a thirty-one-year-old woman with dark curls pinned up using a pencil, warm sun-faded skin, flour
> dusted on her forearms, a single earring. She is mid-laugh but her eyes are
> already somewhere else — the expression of someone about to say something
> true. Warm kitchen interior behind her: a banked fire, hanging copper pans,
> frost beginning to climb the inside of the window at the edge of frame.
> Palette: amber firelight, copper, creamy white, with cold blue frost at the
> edges. No text. The kitchen continues outward on both sides: copper pans, a banked hearth to the left, a frost-edged window to the right, warm depth of field falling away. Middle third clean for a square crop. [Shared render DNA]

### 8. Milo Krass → milo.jpg
> Ultrawide key visual, 9:2 aspect ratio, character centred in the middle third. Head-and-shoulders framing of a twenty-four-year-old man
> with a shaved head and a small scar above one eyebrow, open and
> accommodating expression, faint stubble, wearing an expensive borrowed coat
> over a cheap plain shirt. He is standing in a dark apartment at night lit
> only by a wall of city advertisement glow coming through the window — cold
> magenta and cyan light on one side of his face, deep shadow on the other,
> neon reflections in his eyes. A half-written notebook is visible in the
> blurred foreground. Slightly searching, slightly absent. No text. The
> apartment continues outward on both sides: a dark living space to the left,
> the neon window wall and its advertisement glow to the right, foreground
> blurred. Middle third clean for a square crop. [Shared render DNA]

### 9. Captain Ronan Ash → ronan.jpg
> Ultrawide key visual, 9:2 aspect ratio, character centred in the middle third. Head-and-shoulders framing of a forty-four-year-old officer with a close-cropped beard gone silver at the jaw, weathered skin,
> level patient eyes carrying visible exhaustion, a brass tide-mark badge
> sewn over the breast of a salt-stained grey coat. He holds a lantern slightly
> raised, as if deciding whether to illuminate you. Behind him: rain over a
> dark marsh road at dusk, indistinct stone boundary markers. Palette: iron
> grey, salt white, rust-orange lantern light. Formal, courteous, unreadable —
> not a villain's face. No text. The marsh road continues outward on both sides: standing stones receding left, dark rain-lit water to the right, low horizon. Middle third clean for a square crop. [Shared render DNA]

### 10. Sera Lin → sera.jpg
> Ultrawide key visual, 9:2 aspect ratio, character centred in the middle third. Head-and-shoulders framing of a twenty-six-year-old woman with sun-freckled cheeks, short black hair, pale skin below the collar,
> wearing a uniform shirt faded from navy to weak tea. She smiles while
> delivering bad news — warm, brisk, entirely in control, with the faintest
> tiredness around the eyes. Over her shoulder: the bright edge of a sunlight
> shaft falling onto warm deck plating, a jar of light-caught dust on a desk.
> Palette: warm gold and clean white against industrial grey. No text. The deck
> continues outward on both sides: mirrored conduit machinery receding left, the
> golden sunlight shaft and warm deck plating to the right, faint silhouettes of
> children far off. Middle third clean for a square crop. [Shared render DNA]
