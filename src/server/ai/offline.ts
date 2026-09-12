import type {
  GenerateInput,
  GenerateResult,
  ModelProvider,
} from "./types";
import { countTokens } from "./types";

/**
 * Offline narrative engine — a template-based fallback that keeps the whole
 * product functional with zero configuration. It reads the assembled prompt
 * (which contains the character definition, scene, and history) and produces
 * a continuation-style response instead of a generic "what do you do?".
 */
export class OfflineProvider implements ModelProvider {
  readonly id = "offline";

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const started = Date.now();
    const text = this.compose(input);
    return {
      text,
      model: "aetheria/offline-engine",
      inputTokens: countTokens(JSON.stringify(input.messages)),
      outputTokens: countTokens(text),
      latencyMs: Date.now() - started,
    };
  }

  async stream(
    input: GenerateInput,
    onChunk: (c: { delta: string }) => void
  ): Promise<GenerateResult> {
    const text = this.compose(input);
    // Simulate streaming by emitting words over time.
    const words = text.split(/(\s+)/);
    let acc = "";
    for (const w of words) {
      acc += w;
      onChunk({ delta: w });
      await new Promise((r) => setTimeout(r, 8));
    }
    return {
      text: acc,
      model: "aetheria/offline-engine",
      inputTokens: countTokens(JSON.stringify(input.messages)),
      outputTokens: countTokens(text),
      latencyMs: 0,
    };
  }

  private compose(input: GenerateInput): string {
    const full = input.messages.map((m) => m.content).join("\n\n");
    const charName = this.extractCharName(full);
    const mood = this.extractMood(full);
    const speech = this.extractSpeechStyle(full);

    // The user's actual message is the last "user" message.
    const userMsg =
      [...input.messages].reverse().find((m) => m.role === "user")?.content ||
      "";
    const action = this.distillAction(userMsg);

    const beats = [
      this.narrationBeat(action, mood),
      this.environmentBeat(mood),
      this.dialogueBeat(charName, mood, speech, action),
    ].filter(Boolean);

    return beats.join("\n\n");
  }

  private extractCharName(full: string): string {
    const m = full.match(/You are now ([A-Z][\w'-]+)/) ||
      full.match(/Name:\s*([A-Z][\w'-]+)/) ||
      full.match(/CHARACTER:?\s*([A-Z][\w'-]+)/i);
    return m?.[1] || "the stranger";
  }

  private extractMood(full: string): string {
    const m = full.match(/mood["']?\s*[:=]\s*["']?(\w+)/i);
    return m?.[1] || "calm";
  }

  private extractSpeechStyle(full: string): string {
    const m = full.match(/Speech style[^:]*:\s*([^\n]+)/i);
    return m?.[1] || "";
  }

  private distillAction(msg: string): string {
    const cleaned = msg.replace(/^\/(\w+)\s*/, "").trim();
    if (!cleaned) return "";
    const words = cleaned.split(/\s+/);
    return words.slice(0, 14).join(" ");
  }

  private narrationBeat(action: string, mood: string): string {
    const intro = this.advance(action);
    const moodLine = this.moodTransition(mood);
    return `*${intro} ${moodLine}*`;
  }

  private advance(action: string): string {
    if (!action) {
      return "The moment stretches between you, charged and unspoken, as the scene slowly turns.";
    }
    const patterns: [RegExp, string][] = [
      [/open|door|enter|walk|step|arrive/i, "You move, and the space answers — the air shifts, the light bends, and something just out of sight reacts to your presence."],
      [/say|ask|speak|tell|answer|reply/i, "Your words hang in the air a beat too long before they settle, and the silence that follows feels heavier than it should."],
      [/draw|sword|weapon|attack|strike|fight|punch/i, "Tension snaps taut. Time slows to a crawl as intent turns to motion and the world braces for the impact."],
      [/look|search|examine|inspect|study|peer/i, "You look closer, and the details that were hidden in plain sight begin to surface, each one heavier than the last."],
      [/run|flee|escape|hide|retreat/i, "Your pulse hammers as you move, and behind you the world gives chase in ways you can't quite see."],
      [/eat|drink|sleep|rest|sit|wait/i, "The world does not pause for you — it turns quietly, patient, gathering its next move while you catch your breath."],
    ];
    for (const [re, out] of patterns) {
      if (re.test(action)) return out;
    }
    return "The world around you answers in kind, shifting and settling around your actions like water closing over a stone.";
  }

  private moodTransition(mood: string): string {
    const map: Record<string, string> = {
      suspicious: "A guarded stillness settles into the air between you.",
      angry: "Heat radiates from every surface, coiled and barely contained.",
      happy: "Warmth lingers at the edges of the moment, softening the shadows.",
      sad: "A quiet melancholy threads through the scene, tugging at the light.",
      afraid: "Fear whispers at the edges, making even the small sounds feel sharp.",
      curious: "Curiosity sparks, and the world leans in, attentive and waiting.",
    };
    return map[mood] || "The air holds its breath, expectant.";
  }

  private environmentBeat(mood: string): string {
    const set: Record<string, string[]> = {
      suspicious: [
        "Somewhere nearby, a floorboard creaks once — then nothing.",
        "A shadow at the edge of your vision shifts, and is gone when you turn.",
      ],
      afraid: [
        "The wind outside rattles something loose, and the sound echoes far too long.",
        "Your own heartbeat is suddenly the loudest thing in the room.",
      ],
      angry: [
        "The temperature seems to drop, and the light dims as if in warning.",
        "A pressure builds behind your eyes like a storm about to break.",
      ],
      happy: [
        "Light catches the dust motes, turning them to slow-drifting gold.",
        "For a moment, everything in the room feels soft-edged and warm.",
      ],
      default: [
        "The ambient sound settles into a low, steady hum.",
        "Shadows pool in the corners, patient and still.",
      ],
    };
    const arr = set[mood] || set.default;
    const pick = arr[Math.floor(Math.random() * arr.length)];
    return `*${pick}*`;
  }

  private dialogueBeat(
    charName: string,
    mood: string,
    speech: string,
    action: string
  ): string {
    const name = charName === "the stranger" ? "The stranger" : charName;
    const lines: Record<string, string[]> = {
      suspicious: [
        `"You expect me to believe that?" ${name} says, voice low and measured.`,
        `${name} studies you for a long moment. "Go on. Explain yourself."`,
      ],
      angry: [
        `"Don't." ${name}'s voice is a blade, honed and ready.`,
        `${name}'s jaw tightens. "Say that again. I dare you."`,
      ],
      sad: [
        `"...I didn't think you'd come." ${name} won't quite meet your eyes.`,
        `${name} lets out a slow breath. "It's been a long time."`,
      ],
      afraid: [
        `"We shouldn't be here," ${name} whispers, eyes darting toward the door.`,
        `${name} grabs your sleeve. "Did you hear that?"`,
      ],
      happy: [
        `A smile tugs at ${name}'s lips. "Well, look who finally showed up."`,
        `${name} laughs, soft and bright. "I knew you'd find your way back."`,
      ],
      default: [
        `${name} tilts their head, weighing your words before answering.`,
        `"Interesting." ${name}'s tone is impossible to read.`,
      ],
    };

    let pool = lines[mood] || lines.default;
    // If there's a question, prefer a response line.
    if (/[?]/.test(action)) {
      pool = [
        `${name} considers the question, turning it over carefully.`,
        `"That depends," ${name} says slowly, "on why you're asking."`,
        `${name} is quiet for a moment. Then, quietly: "Yes. And no."`,
      ];
    }

    const line = pool[Math.floor(Math.random() * pool.length)];
    return line;
  }
}
