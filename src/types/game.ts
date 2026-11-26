export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'MINIGAME'
  | 'BOWLING'
  | 'PAUSED'
  | 'GAME_OVER';

export type GameMode = 'SHIFT' | 'ENDLESS';

export type FillingType = 'cabbage' | 'potato' | 'cherry' | 'meat';

export type DistrictEventType =
  | 'NONE'
  | 'PITBIKE_TURBO'
  | 'DOUBLE_DROOL'
  | 'GOLDEN_BAKERY';

export interface FillingInfo {
  id: FillingType;
  label: string;
  shortLabel: string;
  crustColor: string;
  fillingColor: string;
  steamTint: string;
}

export interface BabushkaProfile {
  id: string;
  name: string;
  memeTag: string;
  role: string;
  imageUrl: string;
  voicePitch: number;
  voiceRate: number;
  startX: number;
  startZ: number;
  scarfColor: string;
  coatColor: string;
  defaultCraving: FillingType;
  greetingLines: string[];
  brushingLines: string[];
  rewardLines: string[];
  panicLines: string[];
}

export interface BabushkaRuntime {
  id: string;
  craving: FillingType;
  cooldownRemaining: number;
  fedCount: number;
}

export type PirozhokInventory = Record<FillingType, number>;

export interface RewardResult {
  gazyava: number;
  kiriki: number;
  matchedCraving: boolean;
  fillingUsed: FillingType;
  babushkaName: string;
  phrase: string;
}

export interface TargetPrompt {
  kind: 'babushka' | 'bakery' | 'bowling';
  babushka?: BabushkaProfile;
  label: string;
  canInteract: boolean;
}

export interface BowlingHudState {
  aimAngle: number; // -1 to 1
  phase: 'AIMING' | 'ROLLING' | 'RESULT';
  pinsKnocked: number;
  totalPins: number;
  throwsLeft: number;
}
