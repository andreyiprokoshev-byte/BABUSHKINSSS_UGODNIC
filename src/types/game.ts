export type GameState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'MINIGAME'
  | 'BOWLING'
  | 'PETROVICH'
  | 'SHOP'
  | 'PAUSED'
  | 'GAME_OVER';

export type GameMode = 'SHIFT' | 'ENDLESS';

export type FillingType = 'cabbage' | 'potato' | 'cherry' | 'meat';

export type DistrictEventType =
  | 'NONE'
  | 'PITBIKE_TURBO'
  | 'DOUBLE_DROOL'
  | 'GOLDEN_BAKERY';

export type ShopItemId =
  | 'seeds'
  | 'spare_pies'
  | 'energy_drink'
  | 'rolling_pin'
  | 'fake_license'
  | 'loot_magnet'
  | 'petrovich_share'
  | 'golden_launcher'
  | 'diamond_fur_coat'
  | 'district_crown';

export interface ShopItemDef {
  id: ShopItemId;
  name: string;
  tierLabel: string;
  description: string;
  costMoney: number;
  costGazyava: number;
  costKiriki: number;
  repeatable: boolean;
  maxStack?: number;
}

export interface PetrovichContract {
  active: boolean;
  delivered: number;
  total: number;
  rewardMoney: number;
}

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
  kind:
    | 'babushka'
    | 'bakery'
    | 'bowling'
    | 'petrovich'
    | 'shop'
    | 'car'
    | 'car_board_babushka'
    | 'car_exit'
    | 'stash'
    | 'dropoff';
  babushka?: BabushkaProfile;
  carId?: string;
  label: string;
  canInteract: boolean;
}

export interface BowlingHudState {
  aimAngle: number;
  phase: 'AIMING' | 'ROLLING' | 'RESULT';
  pinsKnocked: number;
  totalPins: number;
  throwsLeft: number;
}

export interface DrivingHudState {
  inCar: boolean;
  carName: string;
  speedKmh: number;
  passengerName: string | null;
  rideDistanceMeters: number;
}
