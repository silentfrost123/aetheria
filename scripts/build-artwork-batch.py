"""Generates docs/artwork-batch.md: the ten artwork prompts, fully expanded.

Each prompt in the generated file is self-contained (the shared style block is
merged in), so it can be pasted straight into an image generator without any
manual assembly. Regenerate after editing docs/artwork-prompts.md.
"""
import re

SRC = "docs/artwork-prompts.md"
OUT = "docs/artwork-batch.md"

src = open(SRC, encoding="utf8").read()
v4 = src[src.index("# v4 — Studio slate"):]

# --- shared style block -----------------------------------------------------
block = re.search(r"## Shared render DNA(.*?)\n---", v4, re.S).group(1)
parts = []
for line in block.strip().split("\n"):
    line = re.sub(r"^>\s?", "", line).strip()
    if line:
        parts.append(line)
# Drop the human-facing lead-in sentences before the actual style text.
joined = " ".join(parts)
joined = joined[joined.index("High-quality anime key visual"):]
dna = re.sub(r"\s+", " ", joined).strip()

# --- the ten prompts --------------------------------------------------------
prompts = re.findall(
    r"### (\d+)\. (.+?) → (\S+\.jpg)(.*?)(?=\n### |\n---|\Z)", v4, re.S
)
assert len(prompts) == 10, f"expected 10 prompts, found {len(prompts)}"

out = []
out.append("# Artwork batch — 10 images, 9:16 anime posters\n")
out.append(
    """Each prompt below is **complete and self-contained** — the shared anime style
block is already merged in. Generate one at a time: paste a whole block, nothing
else.

**Save each render under the exact filename shown**, into the project's
`public/avatars/` folder. Tell me when they're up and I'll attach and compress
them.

Two rules that make these work on the site:

- Every image is **9:16 vertical** (e.g. 1080x1920). If the generator returns
  something else, crop to 9:16 — keep the middle column intact.
- **Keep the subject and title in the centre column.** The site crops these for
  cards, so anything drifting to the far left or right edge gets cut.

---
"""
)

for num, title, fname, body in prompts:
    text = body.replace("[Shared\n> render DNA]", "[DNA]").replace(
        "[Shared render DNA]", "[DNA]"
    )
    text = text.replace("[DNA]", dna)
    parts = []
    for line in text.strip().split("\n"):
        line = re.sub(r"^>\s?", "", line).strip()
        if line:
            parts.append(line)
    prompt = re.sub(r"\s+", " ", " ".join(parts)).strip()
    # Strip markdown decoration — the prompt is pasted as plain text.
    prompt = prompt.replace("**", "").replace("`", "")
    prompt = re.sub(r"\s+([,.;])", r"\1", prompt)
    kind = "STORY COVER" if int(num) <= 5 else "CHARACTER"
    out.append(f"## {num}. {title}  ·  {kind}")
    out.append(f"**Save as** `public/avatars/{fname}`\n")
    out.append("```text\n" + prompt + "\n```\n")

open(OUT, "w", encoding="utf8").write("\n".join(out))
print(f"wrote {OUT}")
print(f"prompts: {len(prompts)}")
for num, title, fname, _ in prompts:
    print(f"  {num:>2}. {title} -> {fname}")
