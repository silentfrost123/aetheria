// Shared type definitions for Aetheria

export type ID = string;

export interface User {
  id: ID;
  email: string;
  username: string;
  passwordHash: string;
  avatar?: string;
  bio?: string;
  plan: "free" | "plus" | "pro" | "admin";
  isAdmin: boolean;
  ageVerified: boolean;
  banned?: boolean;
  settings: UserSettings;
  createdAt: string;
}

export interface UserSettings {
  responseLength: "short" | "medium" | "long" | "very_long" | "adaptive";
  narrationLevel: number; // 0-1
  creativity: number; // 0-1 (temperature)
  defaultModel?: string; // "" = provider default
  useMemory: boolean;
  useLorebook: boolean;
  autoSummary: boolean;
  aiSuggestions: boolean;
  autoImageGen: boolean;
  // Appearance
  fontScale: "sm" | "md" | "lg";
  reduceMotion: boolean;
  // Notifications
  emailNotifications: boolean;
  newFollowerNotifications: boolean;
  replyNotifications: boolean;
}

export interface Persona {
  id: ID;
  userId: ID;
  name: string;
  age?: string;
  occupation?: string;
  personality: string;
  appearance: string;
  background: string;
  avatar?: string;
  createdAt: string;
}

// ---- Character ----

export interface CharacterPersonality {
  confidence: number;
  aggression: number;
  humor: number;
  empathy: number;
  romanticInterest: number;
  honesty: number;
  curiosity: number;
  patience: number;
}

export interface CharacterEmotionalState {
  mood: string;
  trust: number;
  fear: number;
  anger: number;
  affection: number;
  stress: number;
  suspicion: number;
}

export interface CharacterDefinition {
  identity: string;
  personality: string;
  appearance: string;
  speechStyle: string;
  behavior: string;
  emotionalLogic: string;
  likes: string;
  dislikes: string;
  fears: string;
  goals: string;
  motivations: string;
  secrets: string;
  backstory: string;
  relationships: string;
  worldKnowledge: string;
  rules: string;
  exampleDialogues: string;
}

export interface Character {
  id: ID;
  creatorId: ID;
  name: string;
  avatar?: string;
  banner?: string;
  age?: string;
  gender?: string;
  species?: string;
  occupation?: string;
  tags: string[];
  shortDescription: string;
  publicDescription: string;
  greetings: string[];
  isPublic: boolean;
  allowRemix: boolean;
  visibility: "public" | "unlisted" | "private";
  definition: CharacterDefinition;
  personality: CharacterPersonality;
  worldId?: ID | null;
  scenarioId?: ID | null;
  remixedFrom?: ID | null;
  stats: {
    chats: number;
    likes: number;
    favorites: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ---- World / Lore ----

export interface LoreEntry {
  id: ID;
  worldId?: ID | null;
  characterId?: ID | null;
  name: string;
  keywords: string[];
  aliases: string[];
  content: string;
  priority: number; // 0-10
  enabled: boolean;
  alwaysActive: boolean;
  activationProbability: number; // 0-1
  createdAt: string;
}

export interface World {
  id: ID;
  creatorId: ID;
  name: string;
  description: string;
  genre: string;
  artwork?: string;
  timeline?: string;
  locations: Record<string, unknown>[];
  factions: Record<string, unknown>[];
  characters: Record<string, unknown>[];
  creatures: Record<string, unknown>[];
  items: Record<string, unknown>[];
  magicSystem?: string;
  technology?: string;
  politics?: string;
  history?: string;
  rules?: string;
  events: Record<string, unknown>[];
  customLore: Record<string, unknown>[];
  isPublic: boolean;
  createdAt: string;
}

export interface Scenario {
  id: ID;
  creatorId: ID;
  title: string;
  description: string;
  location: string;
  time: string;
  situation: string;
  characters: Record<string, unknown>[];
  startingConditions: string;
  objectives: string;
  rules: string;
  isPublic: boolean;
  createdAt: string;
}

export interface Story {
  id: ID;
  creatorId: ID;
  title: string;
  cover?: string;
  description: string;
  genre: string;
  worldId?: ID | null;
  characters: Record<string, unknown>[];
  isPublic: boolean;
  createdAt: string;
}

// ---- Conversation / Chat ----

export type ChatMode = "character" | "story";

export interface ChatSettings {
  model?: string;
  temperature?: number;
  responseLength: UserSettings["responseLength"];
  narrationLevel: number;
  creativity: number;
  useMemory: boolean;
  useLorebook: boolean;
  autoImageGen: boolean;
  autoSummary: boolean;
  aiSuggestions: boolean;
}

export interface Conversation {
  id: ID;
  userId: ID;
  characterId?: ID | null;
  personaId?: ID | null;
  worldId?: ID | null;
  scenarioId?: ID | null;
  title: string;
  mode: ChatMode;
  settings: ChatSettings;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export type MessageRole = "user" | "assistant" | "system" | "narrator";

export interface StructuredResponse {
  narration?: string;
  dialogue?: { speaker: string; text: string }[];
  actions?: string[];
  thoughts?: string[];
  emotionChange?: Partial<CharacterEmotionalState>;
  relationshipChange?: Partial<RelationshipState>;
  memoryCandidates?: {
    type: string;
    importance: number;
    content: string;
    participants?: string[];
    location?: string;
    emotionalImpact?: string;
  }[];
  worldEvents?: { type: string; description: string }[];
  systemEvent?: string;
}

export interface Message {
  id: ID;
  conversationId: ID;
  branchId: ID;
  role: MessageRole;
  content: string;
  structured?: StructuredResponse | null;
  model?: string;
  parentId?: ID | null;
  isCanonical: boolean;
  swipes: { content: string; structured?: StructuredResponse | null }[];
  createdAt: string;
}

export interface Branch {
  id: ID;
  conversationId: ID;
  parentMessageId?: ID | null;
  name: string;
  isActive: boolean;
  createdAt: string;
}

// ---- Memory / Relationship / State ----

export interface Memory {
  id: ID;
  conversationId: ID;
  characterId?: ID | null;
  userId: ID;
  type: string;
  importance: number;
  content: string;
  participants: string[];
  location?: string;
  emotionalImpact?: string;
  isPinned: boolean;
  isImportant: boolean;
  source: "auto" | "manual" | "summary";
  createdAt: string;
}

export interface RelationshipState {
  stage: string;
  trust: number;
  affection: number;
  respect: number;
  fear: number;
  attraction: number;
  loyalty: number;
  familiarity: number;
  suspicion: number;
}

export interface Relationship extends RelationshipState {
  id: ID;
  conversationId: ID;
  characterId: ID;
  userId: ID;
  history: { event: string; at: string; delta: Partial<RelationshipState> }[];
  updatedAt: string;
}

export interface WorldState {
  id: ID;
  conversationId: ID;
  worldId?: ID | null;
  date: string;
  timeOfDay: string;
  season: string;
  weather: string;
  currentLocation: string;
  npcLocations: Record<string, string>;
  mutable: Record<string, unknown>;
  updatedAt: string;
}

export interface CanonicalEvent {
  id: ID;
  conversationId: ID;
  characterId?: ID | null;
  type: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  cause: string;
  createdAt: string;
}

export interface ChapterSummary {
  id: ID;
  conversationId: ID;
  chapter: number;
  title: string;
  summary: string;
  events: string[];
  createdAt: string;
}

export interface UsageRecord {
  id: ID;
  userId: ID;
  conversationId?: ID | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latencyMs: number;
  createdAt: string;
}

// ---- Query result types (API) ----

export interface CharacterCardData {
  id: ID;
  name: string;
  avatar?: string;
  creator: { id: ID; username: string };
  shortDescription: string;
  tags: string[];
  stats: Character["stats"];
}
