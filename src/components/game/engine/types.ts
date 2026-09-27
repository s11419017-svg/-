// Core Game Engine Interfaces and Encounter Types for Hugo's Escape

export type DynamicEventType = 
  | 'none' 
  | 'barricade_crisis' 
  | 'pincer_ambush' 
  | 'sluice_lockdown' 
  | 'mortar_siege';

export interface DynamicEventState {
  active: boolean;
  type: DynamicEventType;
  timer: number;
  maxDuration: number;
  bannerTitle: string;
  bannerSub: string;
  leftFlankActive?: boolean;
  rightFlankActive?: boolean;
  valvePulled?: boolean;
  gateLeftX?: number;
  gateRightX?: number;
  floodLevel?: number;
}

export interface PincerAmbushConfig {
  warningFrames: number;
  leftSpawnDist: number;
  rightSpawnDist: number;
  leftEnemyType: 'gendarme' | 'elite_sergeant';
  rightEnemyType: 'gendarme' | 'elite_sergeant' | 'grenadier';
}

export interface SluiceLockdownConfig {
  durationFrames: number;
  gateWidth: number;
  waterSurgeForce: number;
  valveX: number;
  valveY: number;
}

export interface PlayerPhysicsConfig {
  gravity: number;
  jumpForce: number;
  doubleJumpForce: number;
  baseRunSpeed: number;
  dashSpeed: number;
  maxFallSpeed: number;
  coyoteTimeMax: number;
  jumpBufferMax: number;
  hitboxWidth: number;
  hitboxHeight: number;
}

export const DEFAULT_PHYSICS_CONFIG: PlayerPhysicsConfig = {
  gravity: 0.58,
  jumpForce: -13.6,
  doubleJumpForce: -11.8,
  baseRunSpeed: 4.8,
  dashSpeed: 8.5,
  maxFallSpeed: 14.5,
  coyoteTimeMax: 9,
  jumpBufferMax: 10,
  hitboxWidth: 26,
  hitboxHeight: 46,
};
