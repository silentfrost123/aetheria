import { generateRobust } from "../ai";
import { loadProviderConfig } from "../ai/types";

function parseJsonFromText(text: string): any {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      /* fall through */
    }
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function generateCharacterDefinition(
  prompt: string,
  model?: string
): Promise<{
  name: string;
  species: string;
  gender: string;
  age: string;
  occupation: string;
  tags: string[];
  shortDescription: string;
  publicDescription: string;
  greetings: string[];
  definition: Record<string, string>;
  personality: Record<string, number>;
} | null> {
  const cfg = loadProviderConfig();
  if (!cfg?.apiKey) return null;

  const res = await generateRobust({
    model: model || cfg.defaultModel,
    temperature: 0.8,
    maxTokens: 1500,
    responseFormat: "json",
    messages: [
      {
        role: "system",
        content: `You are a character designer for a roleplay platform. Given a user's idea, produce a complete, vivid character definition as strict JSON with this exact shape:
{
  "name": string,
  "species": string,
  "gender": string,
  "age": string,
  "occupation": string,
  "tags": string[] (3-5),
  "shortDescription": string (one line),
  "publicDescription": string (a short paragraph, 2nd person is fine),
  "greetings": string[] (3 varied opening messages; each may mix narration and quoted dialogue),
  "definition": {
    "identity": "...", "personality": "...", "appearance": "...", "speechStyle": "...",
    "behavior": "...", "emotionalLogic": "...", "likes": "...", "dislikes": "...",
    "fears": "...", "goals": "...", "motivations": "...", "secrets": "...",
    "backstory": "...", "relationships": "...", "worldKnowledge": "...", "rules": "...",
    "exampleDialogues": "..."
  },
  "personality": { "confidence":0.8,"aggression":0.3,"humor":0.5,"empathy":0.6,"romanticInterest":0.4,"honesty":0.5,"curiosity":0.7,"patience":0.4 } (values 0-1)
}
Be vivid and specific. Return only JSON.`,
      },
      { role: "user", content: prompt },
    ],
  });

  const parsed = parseJsonFromText(res.text);
  if (!parsed) return null;
  return parsed;
}

export async function generateWorld(prompt: string, model?: string): Promise<any | null> {
  const cfg = loadProviderConfig();
  if (!cfg?.apiKey) return null;
  const res = await generateRobust({
    model: model || cfg.defaultModel,
    temperature: 0.8,
    maxTokens: 1500,
    responseFormat: "json",
    messages: [
      {
        role: "system",
        content: `You are a world-building assistant. Given a user's idea, produce a JSON object describing a fictional world:
{
  "name": string, "genre": string, "description": string, "timeline": string,
  "magicSystem": string, "technology": string, "politics": string, "history": string, "rules": string,
  "locations": [{"name":string,"description":string}],
  "factions": [{"name":string,"description":string}],
  "characters": [{"name":string,"role":string,"description":string}]
}
Return only JSON.`,
      },
      { role: "user", content: prompt },
    ],
  });
  return parseJsonFromText(res.text);
}

export async function generateScenario(prompt: string, model?: string): Promise<any | null> {
  const cfg = loadProviderConfig();
  if (!cfg?.apiKey) return null;
  const res = await generateRobust({
    model: model || cfg.defaultModel,
    temperature: 0.8,
    maxTokens: 1200,
    responseFormat: "json",
    messages: [
      {
        role: "system",
        content: `You are a scenario designer for an interactive fiction platform. Given a premise, produce JSON:
{
  "title": string, "description": string, "location": string, "time": string, "situation": string,
  "startingConditions": string, "objectives": string, "rules": string, "characters": [{"name":string,"role":string}]
}
Return only JSON.`,
      },
      { role: "user", content: prompt },
    ],
  });
  return parseJsonFromText(res.text);
}
