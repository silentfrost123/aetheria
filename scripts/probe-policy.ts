// Dev probe: verifies the content-policy block lands in the system message.
import { buildMessages } from "../src/server/prompt/promptBuilder";
import { isNsfwEnabled } from "../src/server/settings";

const msgs = buildMessages({
  mode: "chat",
  history: [],
  lore: [],
  memories: [],
  inventory: [],
  quests: [],
  relationship: [],
  antiRepetition: [],
} as any);
const sys = String((msgs[0] as any).content ?? "");
console.log("nsfw flag:", isNsfwEnabled());
console.log("default policy present:", sys.includes("SEXUAL CONTENT IS RESTRICTED"));
console.log("adult policy present:", sys.includes("ADULT MODE"));
console.log("violence allowed line:", sys.includes("VIOLENCE"));
