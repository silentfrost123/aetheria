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

**Format: all ten images are 9:16 vertical posters, anime key-visual style.**
Generate at 1080×1920 or larger (any 9:16 size is fine — I normalise on upload).

**Filenames** — save each render to exactly this name in `public/avatars/`:
`ninth-bell.jpg`, `glass-season.jpg`, `understudy.jpg`, `salt-and-iron.jpg`,
`last-summer.jpg`, `wren.jpg`, `nadia.jpg`, `milo.jpg`, `ronan.jpg`, `sera.jpg`

**Composition rules for 9:16**

- The frame is tall and narrow: build it top-to-bottom, not left-to-right. A
  vertical stack — sky/ceiling above, subject in the middle, foreground below —
  reads far better than a wide scene squeezed into a narrow box.
- Keep the **subject in the centre column**. The site crops these for cards, so
  anything drifting to the extreme left or right edge gets cut.
- Story posters carry the title near the **top** of the frame with a short
  tagline beneath it.
- Character posters carry **no text** — their name is a caption on the site.

---

## Shared render DNA

Every image in this slate shares a rendering style so the platform looks like
one catalogue rather than ten commissions. Paste this block at the end of each
prompt, after the scene description:

> High-quality anime key visual in the style of a premium anime film poster.
> Clean confident line art with varied line weight, crisp cel-shaded colour
> with soft gradient transitions, vivid saturated palette, glossy specular
> highlights in the hair, large expressive anime eyes with layered catchlights
> and defined lashes, elegant stylised character design, dramatic cinematic
> lighting with one clear dominant light source, richly painted detailed anime
> background art with atmospheric depth and visible air — rain, mist, dust or
> glow as fits the scene — subtle screentone texture in the shadows, shallow
> depth of field behind the subject. Hand-painted illustration look overall.
> Not photorealistic, not a 3D render. No watermark, no signature, no borders,
> no extra text beyond what is specified.

---

## STORY POSTERS — 9:16 vertical, character + title

Each poster is built like a light-novel / anime promo cover: **one main
character from the story, shown large**, with the **story title rendered into
the artwork** near the top and a short tagline beneath it. The character is the
story's own lead, so the poster and the character poster read as the same world.

Turned into vertical posters, in reading order.

### 1. The Ninth Bell → ninth-bell.jpg
Dark fantasy mystery. Cover character: the girl in the tower.

> Vertical poster composition, 9:16 aspect ratio. A single anime girl shown
> three-quarter length, centred in the middle of the frame, standing on a
> rain-soaked stone bridge at midnight. Short soot-dark hair cut unevenly,
> grey eyes lifted upward with a guarded, unblinking stare, a plain dark
> tide-house coat with the collar up against the rain, one ink-stained hand
> pressed flat on a large open ledger she is carrying against her chest, a
> brass ear trumpet hanging at her collar like an ornament. Behind and above
> her, an enormous bronze bell tower rises straight up through the frame and
> out of the top, its silhouette filling the space above her, with rain
> streaking down the full height of the image and one warm lantern glowing at
> her feet. The scales are deliberately wrong — she is small against the tower.
> Cold blue-grey and deep teal palette with amber accents, wet stone and
> reflective water below. Title text positioned near the top of the frame,
> integrated into the artwork, sitting in the upper third well clear of the
> edges: "THE NINTH BELL" in large engraved storybook display capitals,
> weathered pale gold with fine bronze inlay texture and subtle embossed depth,
> and directly beneath it in much smaller letter-spaced capitals: "EVERY BELL
> REMEMBERS. ONE OF THEM CHOOSES." [Shared render DNA]

### 2. Glass Season → glass-season.jpg
Melancholy romance. Cover character: the cook who never closes.

> Vertical poster composition, 9:16 aspect ratio. A single anime woman shown
> three-quarter length, centred in the middle of the frame, standing in the
> doorway of a small harbour kitchen with warm amber light spilling around her
> from inside. Dark curls pinned up with a pencil, warm sun-faded skin, flour
> dusted across her forearms and apron, a single earring, a wooden spoon held
> loosely in one hand and a steaming bowl in the other. She is smiling warmly
> while her eyes are already somewhere else — the expression of someone about
> to say something true. Behind and above her, the top of the frame shows the
> pale white-grey sky of a stopped northern harbour with frost beginning to
> climb the inside of the window glass, delicate ice ferns threading outward;
> below her, the frozen harbour water and a fishing boat locked motionless.
> Cool blue-grey and frost-white palette with one warm amber interior light.
> Title text positioned near the top of the frame, integrated into the
> artwork, sitting in the upper third well clear of the edges: "GLASS SEASON"
> in elegant thin serif capitals, pale frosted silver with a warm rim light and
> the letters lightly touched by frost, and directly beneath it in much smaller
> letter-spaced capitals: "ONE WEEK A YEAR, THE TOWN STOPS. SHE NEVER DOES."
> [Shared render DNA]

### 3. The Understudy → understudy.jpg
Cyberpunk identity thriller. Cover character: the boy with someone else's memories.

> Vertical poster composition, 9:16 aspect ratio. A single anime boy shown
> three-quarter length, centred in the middle of the frame, standing in a dark
> high-rise apartment and facing a reflective glass surface beside him, one
> hand pressed to the glass. Shaved head, a small scar over one eyebrow, faint
> stubble, an expensive borrowed coat worn over a cheap plain shirt, holding a
> small notebook against his chest. His eyes are open and faintly lost, and his
> reflection in the glass is subtly wrong — the features smeared and displaced
> at the edges, as though it does not belong to him. Behind and above him, the
> top of the frame is filled with a neon-drowned cyberpunk skyline of stacked
> magenta and cyan advertisement surfaces bleeding light into low cloud; below
> him, rain-slick walkways fall away into darkness. Cool cyan-magenta palette
> with one warm interior light. Title text positioned near the top of the
> frame, integrated into the artwork, sitting in the upper third well clear of
> the edges: "THE UNDERSTUDY" in clean modern geometric sans-serif capitals,
> white with a faint chromatic-aberration edge, glowing softly like an emitted
> sign, and directly beneath it in much smaller letter-spaced capitals: "SOMEONE
> HAS TO LIVE THE HOURS THAT CAN'T BE SOLD." [Shared render DNA]

### 4. Salt and Iron → salt-and-iron.jpg
Historical fantasy. Cover character: the officer who collects children.

> Vertical poster composition, 9:16 aspect ratio. A single anime man shown
> three-quarter length, centred in the middle of the frame, standing on a
> flooded coastal road in heavy rain at dusk. Close-cropped beard gone silver
> at the jaw, weathered skin and deep lines, level patient eyes carrying
> visible exhaustion, a brass tide-mark badge sewn over the breast of a
> salt-stained grey coat with the collar turned up. He holds a lantern raised
> at chest height, its rust-orange light the only warm thing in the image and
> throwing his face into relief — formal, courteous, unreadable, not a
> villain's face. Behind and above him, the top of the frame is low dark storm
> clouds and driving rain with one thin break of pale light at the horizon;
> below him, white salt-marsh grass and standing boundary stones sink into dark
> water, and far out to one side six small stone forts stand in open grey sea.
> Iron grey, salt white and rust-orange palette. Title text positioned near the
> top of the frame, integrated into the artwork, sitting in the upper third
> well clear of the edges: "SALT AND IRON" in heavy weathered serif capitals,
> iron-grey with salt-white accents and slightly corroded edges, and directly
> beneath it in much smaller letter-spaced capitals: "THE LAW SAYS ONE CHILD.
> THE SEA SAYS NOTHING." [Shared render DNA]

### 5. Our Last Summer in Light → last-summer.jpg
Science-fiction drama. Cover character: the keeper of the sun deck.

> Vertical poster composition, 9:16 aspect ratio. A single anime girl shown
> three-quarter length, centred in the middle of the frame, standing on the
> deck of a generation ship as a shaft of genuine golden starlight falls from
> the top of the image straight down onto her. Sun-freckled cheeks and nose,
> short black hair, pale skin below the collar, a uniform shirt faded from navy
> to weak tea with the sleeves rolled, holding a slim ledger against her ribs
> with one thumb marking the page. She is smiling warmly while delivering bad
> news — brisk, entirely in control, the faintest tiredness gathering around
> her eyes — and she is looking slightly off to one side rather than at the
> viewer. Behind and above her, an immense curved ship interior rises out of
> frame with six kilometres of mirrored conduit receding upward into the light;
> below her, small silhouetted children run along the lit deck, tiny against
> the vast machinery, with drifting dust motes visible in the beam. Warm gold
> and clean white against industrial grey. Title text positioned near the top
> of the frame, integrated into the artwork, sitting in the upper third well
> clear of the edges: "OUR LAST SUMMER IN LIGHT" in refined thin capitals with
> generous letter spacing, warm white with a soft golden glow, and directly
> beneath it in much smaller letter-spaced capitals: "A PROMISE MADE BY THE
> DEAD, KEPT BY THE LIVING." [Shared render DNA]

---

## CHARACTER POSTERS — 9:16 vertical, no text

Each is a three-quarter-length portrait so the tall frame is used properly. The
face and shoulders sit in the **upper-middle** of the frame — that region
becomes the square card avatar on the site, so it must read as a portrait on
its own.

### 6. Wren Calloway → wren.jpg
> Vertical poster composition, 9:16 aspect ratio, no text. Three-quarter-length
> anime portrait of a nineteen-year-old girl, centred, standing in a cold bell
> tower at night. Watchful unblinking grey eyes reading the viewer the way she
> reads a ledger, chin held slightly back, slight frown of concentration.
> Soot-dark hair cropped short and uneven, clearly self-cut, a few strands
> falling loose across her forehead. Ink-stained fingers, a brass ear trumpet
> hanging at her collar like an ornament, a plain dark tide-house coat with a
> small brass pin. One hand rests on a large open ledger at her waist. Behind
> and above her the tower climbs out of frame into darkness — wet bronze struts,
> hanging ropes, rain visible through a tall slit window behind her shoulder.
> A single lantern lights one half of her face and leaves the other in deep
> shadow. Bronze, wet slate and amber palette. Her face and shoulders sit in the
> upper-middle of the frame, well clear of the edges. [Shared render DNA]

### 7. Nadia Voss → nadia.jpg
> Vertical poster composition, 9:16 aspect ratio, no text. Three-quarter-length
> anime portrait of a thirty-one-year-old woman, centred, standing behind the
> counter of a small harbour kitchen. She is mid-laugh — warm, open, head tipped
> slightly — but her eyes are already somewhere else, the expression of someone
> about to say something true. Dark curls pinned up with a pencil, warm
> sun-faded skin, flour dusted across her forearms and apron, a single earring.
> She holds a wooden spoon loosely in one hand. Behind and above her: a banked
> hearth with copper pans hanging in rows, warm firelight glowing low across the
> room, and at the top edge of the frame a window with frost beginning to climb
> the inside of the glass. Amber firelight, copper and creamy white palette with
> cold blue frost at the upper edges. Her face and shoulders sit in the
> upper-middle of the frame, well clear of the edges. [Shared render DNA]

### 8. Milo Krass → milo.jpg
> Vertical poster composition, 9:16 aspect ratio, no text. Three-quarter-length
> anime portrait of a twenty-four-year-old man, centred, standing in a dark
> high-rise apartment at night. Shaved head, a small scar over one eyebrow,
> faint stubble, wearing an expensive borrowed coat over a cheap plain shirt,
> one hand in his pocket and the other holding a notebook open against his
> chest. His expression is open, accommodating, faintly absent — searching for
> something just out of frame. Cold magenta and cyan advertisement light
> floods in from a floor-to-ceiling window behind and beside him, catching one
> side of his face and leaving the other in deep shadow, neon reflections
> sitting in his eyes. Above him the glow of the city fills the top of the
> frame; below him, his own reflection is just visible in the polished dark
> floor. Cool neon magenta-cyan palette with one warm lamp far behind. His face
> and shoulders sit in the upper-middle of the frame, well clear of the edges.
> [Shared render DNA]

### 9. Captain Ronan Ash → ronan.jpg
> Vertical poster composition, 9:16 aspect ratio, no text. Three-quarter-length
> anime portrait of a forty-four-year-old officer, centred, standing on a dark
> marsh road in heavy rain at dusk. Close-cropped beard gone silver at the jaw,
> weathered skin with deep lines, level patient eyes carrying visible
> exhaustion, a brass tide-mark badge sewn over the breast of a salt-stained
> grey coat, the coat collar turned up against the weather. He holds a lantern
> raised at chest height, as if deciding whether to illuminate the viewer — its
> rust-orange light the only warm thing in the frame, throwing his face into
> relief. Above and behind him: low slate clouds and rain filling the top of the
> frame, with one thin break of pale light at the horizon. Below him the flooded
> road recedes and standing boundary stones sink into dark water. Iron grey,
> salt white and rust-orange palette. Formal, courteous, unreadable — not a
> villain's face. His face and shoulders sit in the upper-middle of the frame,
> well clear of the edges. [Shared render DNA]

### 10. Sera Lin → sera.jpg
> Vertical poster composition, 9:16 aspect ratio, no text. Three-quarter-length
> anime portrait of a twenty-six-year-old woman, centred, standing on the sun
> deck of a generation ship. Sun-freckled cheeks and nose, short black hair,
> pale skin below the collar, wearing a uniform shirt faded from navy to weak
> tea with the sleeves rolled. She is smiling while delivering bad news — warm,
> brisk, entirely in control, with the faintest tiredness gathering around her
> eyes — and she is looking slightly off to one side rather than at the viewer.
> She holds a slim ledger against her ribs, one thumb marking the page. Behind
> and above her: an immense shaft of genuine golden starlight falls from the top
> of the frame through drifting dust motes, catching the mirror conduit
> machinery receding upward, while distant silhouettes of children run along the
> lit deck below. Warm gold and clean white against industrial grey. Her face
> and shoulders sit in the upper-middle of the frame, well clear of the edges.
> [Shared render DNA]
