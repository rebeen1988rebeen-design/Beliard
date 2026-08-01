export type BallType = 'CUE' | 'SOLID' | 'STRIPE' | 'EIGHT';

export interface Ball {
  id: number; // 0 for cue ball, 1-7 solids, 8 eight ball, 9-15 stripes
  type: BallType;
  color: string;
  number: number;
  position: [number, number, number]; // x, y, z in Three.js world
  velocity: [number, number, number]; // vx, vy, vz
  angularVelocity: [number, number, number];
  inPocket: boolean;
  pocketedBy?: number; // player index who pocketed it
  radius: number;
}

export type GameMode = '8BALL_AI' | '8BALL_PASS_PLAY' | 'PRACTICE';
export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type CameraMode = 'AIM' | 'TOP' | 'ORBIT' | 'FULL' | 'CINEMATIC';
export type TableTheme = 'emerald_glass' | 'sapphire_glass' | 'cyber_ruby' | 'obsidian_gold';
export type Language = 'ku' | 'en';

export interface Player {
  id: number;
  name: string;
  nameKu: string;
  type: 'HUMAN' | 'AI';
  assignedGroup: 'SOLID' | 'STRIPE' | null;
  score: number;
  avatar: string;
}

export interface ShotSpin {
  x: number; // Left/Right English (-1 to 1)
  y: number; // Top/Back spin (-1 to 1)
}

export interface Pocket {
  id: number;
  position: [number, number, number];
  radius: number;
  name: string;
}

export interface TrajectoryPrediction {
  cuePath: [number, number, number][];
  targetHit?: {
    ballId: number;
    impactPoint: [number, number, number];
    targetPath: [number, number, number][];
    cueDeflection: [number, number, number][];
  };
}

export interface GameState {
  mode: GameMode;
  aiDifficulty: AIDifficulty;
  players: [Player, Player];
  activePlayerIndex: number;
  balls: Ball[];
  isMoving: boolean;
  isAiming: boolean;
  isBallInHand: boolean;
  ballInHandReason: string | null;
  ballInHandReasonKu: string | null;
  cueAngle: number; // horizontal angle in radians
  cueElevation: number;
  power: number; // 0 to 1
  spin: ShotSpin;
  cameraMode: CameraMode;
  theme: TableTheme;
  language: Language;
  soundEnabled: boolean;
  winner: Player | null;
  winReason: string | null;
  winReasonKu: string | null;
  historyLog: {
    textKu: string;
    textEn: string;
    time: string;
  }[];
  tableDimensions: {
    length: number;
    width: number;
    cushionHeight: number;
    pocketRadius: number;
    ballRadius: number;
  };
  breakDone: boolean;
  tableOpen: boolean; // true before any player legally pockets a solid/stripe
}
