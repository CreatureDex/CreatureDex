// ---------------------------------------------------------------------------
// Creature
// ---------------------------------------------------------------------------
export interface Creature {
  id: string;
  user_id: string;
  species: string;
  common_name: string;
  description: string | null;
  image_url: string;
  hp: number;
  attack: number;
  defence: number;
  speed: number;
  special: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Battle
// ---------------------------------------------------------------------------
export interface BattleCreatureState {
  creature_id: string;
  species: string;
  common_name: string;
  current_hp: number;
  max_hp: number;
  attack: number;
  defence: number;
  speed: number;
  special: number;
}

export interface BattleState {
  challenger_creature: BattleCreatureState;
  opponent_creature: BattleCreatureState | null;
  log: string[];
}

export type BattleStatus = "pending" | "active" | "finished";

export interface Battle {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: BattleStatus;
  turn: string | null;
  state: BattleState | null;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Preview: { imageUri: string; imageBase64: string };
  BattleSetup: undefined;
  Battle: { battleId: string };
};

export type MainTabParamList = {
  Bag: undefined;
  Camera: undefined;
  Battles: undefined;
};