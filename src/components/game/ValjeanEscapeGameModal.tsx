import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Heart,
  Sparkles,
  Shield,
  Zap,
  Share2,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { gameAudio } from '../../utils/gameAudioSynth';
import { ambientSynth } from '../../utils/audioSynth';
import { triggerHaptic } from '../../utils/haptics';
import {
  calculateHorizontalMovement,
  calculateHorizontalMovementDT,
  normalizeDeltaTime,
  getApexGravityMultiplier,
  getHeadBumpCornerCorrection,
  calculateLandingSquash,
  calculateDampedSpringShake,
  SpatialBucketGrid,
  sweptAABB,
  updateCameraLookahead,
} from './engine/physics';
import {
  ObjectPool,
  PoolableParticle,
  PoolableFloatingText,
  PoolableGhostTrail,
} from './engine/objectPool';

let globalGameSpriteAtlasCache: GameSpriteAtlas | null = null;
const getOrCreateGameSpriteAtlas = (): GameSpriteAtlas | null => {
  if (typeof document === 'undefined') return null;
  if (!globalGameSpriteAtlasCache) {
    globalGameSpriteAtlasCache = createGameSpriteAtlas();
  }
  return globalGameSpriteAtlasCache;
};

interface ValjeanEscapeGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  distance: number;
  date: string;
  title: string;
}

// Game feel ghost trail for dash & grace
interface GhostTrail {
  x: number;
  y: number;
  alpha: number;
  scaleX: number;
  scaleY: number;
  facingRight: boolean;
  isGrace: boolean;
}

// Game entity types
interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'ground' | 'brick' | 'scaffold' | 'sewer' | 'crumble' | 'awning' | 'stream';
  crumbleTimer?: number;
  isBroken?: boolean;
}

interface MysteryBlock {
  x: number;
  y: number;
  w: number;
  h: number;
  hit: boolean;
  bounceOffset: number;
  content: 'bread' | 'candlestick' | 'heart' | 'coin' | 'slingshot' | 'shield';
  isMimic?: boolean;
}

interface CollectibleItem {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'bread' | 'candlestick' | 'coin' | 'heart' | 'slingshot' | 'shield';
  collected: boolean;
  vy: number;
  initialY: number;
}

interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  minX: number;
  maxX: number;
  alive: boolean;
  squashTime: number;
  type?: 'gendarme' | 'thenardier' | 'elite_sergeant' | 'grenadier';
  hp?: number; // 2 for elite_sergeant!
  maxHp?: number;
  staggerTimer?: number;
  throwCooldown?: number;
  stolenBread?: number;
  isMimicThief?: boolean;
  fleeTimer?: number;
  caltropTimer?: number;
  daggerChargeTimer?: number;
  isDaggerCharging?: boolean;
  smokeCooldown?: number;
  alertWhistleTimer?: number;
}

interface EnemyProjectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  life: number;
  type: 'tear_gas' | 'arrest_net' | 'caltrop' | 'smoke_bomb';
  groundY?: number;
  isArmed?: boolean;
}

interface MortarStrike {
  id: number;
  targetX: number;
  targetY: number;
  warningTimer: number; // in frames (counts down from ~70)
  shellY: number;
  exploded: boolean;
}

export type DynamicEventType = 'none' | 'barricade_crisis' | 'pincer_ambush' | 'sluice_lockdown';

interface DynamicEventState {
  active: boolean;
  type: DynamicEventType;
  timer: number;
  maxDuration: number;
  bannerTitle: string;
  bannerSub: string;
  valvePulled?: boolean;
}

interface SlingshotPebble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  isEmpowered?: boolean; // Empowered Meteor Strike via melee slash deflection
  isHoly?: boolean;      // Imbued with Bishop's divine radiance
  pierceCount?: number;
}

interface JavertHandcuff {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  life: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
}

export interface ActiveDialogue {
  id: number;
  speaker: 'valjean' | 'javert' | 'gavroche' | 'cosette' | 'thenardier' | 'bishop';
  speakerName: string;
  avatarIcon: string;
  text: string;
  tag: string;
  tagColor: string;
  themeColor: string;
  timer: number;
  maxTimer: number;
}

interface GameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type?: 'dust' | 'spark' | 'ring';
}

interface WorldProp {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'lantern' | 'powder_keg' | 'crate' | 'iron_crate' | 'relic_chest' | 'damp_crate' | 'booby_crate' | 'flag_spring' | 'steam_vent' | 'manhole' | 'awning' | 'crumble' | 'sewer_current' | 'valve_lever' | 'sluice_gate';
  active: boolean;
  timer?: number;
  sway?: number;
  fuseTimer?: number;
  hasAmbush?: boolean; // Ambush gendarme guarding the exit above
  ambushDefeated?: boolean;
  crumbleTimer?: number;
  broken?: boolean;
  gateHeight?: number;
  targetGateHeight?: number;
  isOpening?: boolean;
  durability?: number; // 2 for iron_crate (starts at 2, breaks on 0)
  isArmed?: boolean; // for booby_crate
}

const STORAGE_KEY_HIGHSCORE = 'tcsh_valjean_highscore';
const STORAGE_KEY_MAXDIST = 'tcsh_valjean_maxdist';
const STORAGE_KEY_LEADERBOARD = 'tcsh_valjean_leaderboard';

// === High-Performance Pre-rendered Sprite Atlas ===
interface GameSpriteAtlas {
  crate: HTMLCanvasElement;
  ironCrate: HTMLCanvasElement;
  ironCrateDented: HTMLCanvasElement;
  relicChest: HTMLCanvasElement;
  dampCrate: HTMLCanvasElement;
  boobyCrate: HTMLCanvasElement;
  powderKeg: HTMLCanvasElement;
  manhole: HTMLCanvasElement;
  steamVent: HTMLCanvasElement;
  flagSpring: HTMLCanvasElement;
  mysteryBox: HTMLCanvasElement;
  mysteryBoxHit: HTMLCanvasElement;
  mimicBox: HTMLCanvasElement;
  bread: HTMLCanvasElement;
  candlestick: HTMLCanvasElement;
  heart: HTMLCanvasElement;
  coin: HTMLCanvasElement;
  slingshot: HTMLCanvasElement;
  shield: HTMLCanvasElement;
  moon: HTMLCanvasElement;
  sky1: HTMLCanvasElement;
  sky2: HTMLCanvasElement;
  sky3: HTMLCanvasElement;
  water: HTMLCanvasElement;
  vignette: HTMLCanvasElement;
  torchGlow: HTMLCanvasElement;
  lanternGlow: HTMLCanvasElement;
  graceAura: HTMLCanvasElement;
  toxicGlow: HTMLCanvasElement;
  steamGlow: HTMLCanvasElement;
}

const createOffscreenCanvas = (
  width: number,
  height: number,
  render: (ctx: CanvasRenderingContext2D) => void
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    render(ctx);
  }
  return canvas;
};

const createGameSpriteAtlas = (): GameSpriteAtlas => {
  // 1. Destructible Supply Crate (32x32)
  const crate = createOffscreenCanvas(32, 32, (ctx) => {
    ctx.fillStyle = '#92400e';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 32, 4);
    ctx.fillRect(0, 28, 32, 4);
    ctx.fillRect(0, 0, 4, 32);
    ctx.fillRect(28, 0, 4, 32);
    ctx.strokeStyle = '#5c2d0c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(28, 28);
    ctx.moveTo(28, 4);
    ctx.lineTo(4, 28);
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    [[0, 0], [27, 0], [0, 27], [27, 27]].forEach(([bx, by]) => {
      ctx.fillRect(bx, by, 5, 5);
    });
  });

  // 1b. Reinforced Iron Armory Crate (32x32)
  const ironCrate = createOffscreenCanvas(32, 32, (ctx) => {
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 32, 4);
    ctx.fillRect(0, 28, 32, 4);
    ctx.fillRect(0, 0, 4, 32);
    ctx.fillRect(28, 0, 4, 32);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(3, 3);
    ctx.lineTo(29, 29);
    ctx.moveTo(29, 3);
    ctx.lineTo(3, 29);
    ctx.stroke();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(28, 28);
    ctx.stroke();
    ctx.fillStyle = '#f1f5f9';
    [[2, 2], [26, 2], [2, 26], [26, 26], [14, 14]].forEach(([rx, ry]) => {
      ctx.fillRect(rx, ry, 4, 4);
    });
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(13, 12, 6, 8);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(15, 15, 2, 3);
  });

  // 1c. Dented Iron Armory Crate (32x32)
  const ironCrateDented = createOffscreenCanvas(32, 32, (ctx) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#334155';
    ctx.fillRect(3, 3, 26, 26);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(16, 2);
    ctx.lineTo(13, 14);
    ctx.lineTo(19, 22);
    ctx.lineTo(15, 30);
    ctx.stroke();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(14, 12);
    ctx.lineTo(18, 20);
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    [[2, 2], [26, 2], [2, 26], [26, 26]].forEach(([rx, ry]) => {
      ctx.fillRect(rx, ry, 4, 4);
    });
  });

  // 1d. Bishop's Gilded Relic Chest (34x32)
  const relicChest = createOffscreenCanvas(34, 32, (ctx) => {
    ctx.fillStyle = '#4c0519';
    ctx.beginPath();
    ctx.roundRect(1, 4, 32, 26, 4);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(2, 5, 30, 24);
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(1, 2, 32, 10, 3);
    ctx.fill();
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(15, 8, 4, 16);
    ctx.fillRect(11, 12, 12, 4);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(4, 7, 3, 3);
    ctx.fillRect(27, 7, 3, 3);
  });

  // 1e. Mossy Sewer Cistern Crate (32x32)
  const dampCrate = createOffscreenCanvas(32, 32, (ctx) => {
    ctx.fillStyle = '#1e3a34';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#132e29';
    ctx.fillRect(0, 0, 32, 4);
    ctx.fillRect(0, 28, 32, 4);
    ctx.fillRect(0, 0, 4, 32);
    ctx.fillRect(28, 0, 4, 32);
    ctx.strokeStyle = '#5b4034';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, 4);
    ctx.lineTo(28, 28);
    ctx.moveTo(28, 4);
    ctx.lineTo(4, 28);
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillRect(4, 2, 8, 4);
    ctx.fillRect(20, 24, 9, 5);
    ctx.fillRect(2, 14, 5, 8);
    ctx.fillStyle = '#34d399';
    ctx.fillRect(6, 4, 4, 2);
    ctx.fillRect(22, 25, 4, 2);
    ctx.fillStyle = '#38bdf8';
    [[10, 18], [24, 10], [16, 26]].forEach(([wx, wy]) => {
      ctx.beginPath();
      ctx.arc(wx, wy, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // 1f. Booby-trapped Hazard TNT Crate (32x32)
  const boobyCrate = createOffscreenCanvas(32, 32, (ctx) => {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#ef4444';
    for (let s = -16; s < 48; s += 10) {
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(s + 6, 0);
      ctx.lineTo(s - 4, 32);
      ctx.lineTo(s - 10, 32);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(1, 1, 30, 30);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 10, 12, 12);
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 16, 17);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(16, 1);
    ctx.quadraticCurveTo(22, -3, 19, -6);
    ctx.stroke();
  });

  // 2. Barricade Powder Keg (30x36)
  const powderKeg = createOffscreenCanvas(30, 36, (ctx) => {
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(0, 4, 30, 32, 6);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 8, 30, 4);
    ctx.fillRect(0, 26, 30, 4);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TNT', 15, 20);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(15, 4);
    ctx.quadraticCurveTo(21, 0, 18, -4);
    ctx.stroke();
  });

  // 3. Sewer Manhole with Ladder (46x54)
  const manhole = createOffscreenCanvas(46, 54, (ctx) => {
    // Vertical iron ladder rails
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(8, 6);
    ctx.lineTo(8, 54);
    ctx.moveTo(38, 6);
    ctx.lineTo(38, 54);
    for (let ry = 14; ry <= 48; ry += 10) {
      ctx.moveTo(8, ry);
      ctx.lineTo(38, ry);
    }
    ctx.stroke();
    // Outer cast iron rim
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(23, 5, 23, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    // Inner grill patterns
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(23, 5, 18, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 4. Steam Vent Grating (48x14)
  const steamVent = createOffscreenCanvas(48, 14, (ctx) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 48, 14);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, 48, 14);
    ctx.fillStyle = '#0f172a';
    for (let s = 4; s < 44; s += 8) {
      ctx.fillRect(s, 2, 4, 10);
    }
  });

  // 5. Flag Spring (24x44)
  const flagSpring = createOffscreenCanvas(24, 44, (ctx) => {
    // Spring coils
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 42);
    ctx.lineTo(14, 38);
    ctx.lineTo(6, 34);
    ctx.lineTo(14, 30);
    ctx.lineTo(6, 26);
    ctx.lineTo(10, 22);
    ctx.stroke();
    // French Tricolor
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(8, 4, 5, 14);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(13, 4, 5, 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(18, 4, 5, 14);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(6, 0, 2.5, 24);
  });

  // 6. Golden Mystery Box (34x34)
  const mysteryBox = createOffscreenCanvas(34, 34, (ctx) => {
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, 0, 34, 34);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(3, 3, 28, 28);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 34, 34);
    ctx.fillStyle = '#fef08a';
    [[2, 2], [28, 2], [2, 28], [28, 28]].forEach(([rx, ry]) => {
      ctx.fillRect(rx, ry, 3, 3);
    });
    ctx.fillStyle = '#fffbeb';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', 17, 18);
  });

  // 7. Hit Empty Block (34x34)
  const mysteryBoxHit = createOffscreenCanvas(34, 34, (ctx) => {
    ctx.fillStyle = '#57534e';
    ctx.fillRect(0, 0, 34, 34);
    ctx.fillStyle = '#44403c';
    ctx.fillRect(3, 3, 28, 28);
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 34, 34);
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(15, 15, 4, 4);
    [[2, 2], [28, 2], [2, 28], [28, 28]].forEach(([rx, ry]) => {
      ctx.fillRect(rx, ry, 3, 3);
    });
  });

  // 8. Mimic Mystery Box (34x34)
  const mimicBox = createOffscreenCanvas(34, 34, (ctx) => {
    ctx.fillStyle = '#831843';
    ctx.fillRect(0, 0, 34, 34);
    ctx.fillStyle = '#9d174d';
    ctx.fillRect(3, 3, 28, 28);
    ctx.strokeStyle = '#500724';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 34, 34);
    ctx.fillStyle = '#fbcfe8';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¿', 17, 18);
  });

  // 9. Crusty French Baguette Bread (24x24)
  const bread = createOffscreenCanvas(24, 24, (ctx) => {
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(12, 12, 11, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(6, 9);
    ctx.lineTo(8, 15);
    ctx.moveTo(11, 8);
    ctx.lineTo(13, 15);
    ctx.moveTo(16, 9);
    ctx.lineTo(18, 15);
    ctx.stroke();
  });

  // 10. Silver Candlestick (24x24)
  const candlestick = createOffscreenCanvas(24, 24, (ctx) => {
    // Silver base
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(7, 18, 10, 4);
    ctx.fillRect(10, 8, 4, 10);
    ctx.fillRect(8, 6, 8, 3);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(7, 18, 10, 4);
    // Candle flame & halo
    ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.beginPath();
    ctx.arc(12, 4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(12, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 11. Heart (24x24)
  const heart = createOffscreenCanvas(24, 24, (ctx) => {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(12, 20);
    ctx.bezierCurveTo(4, 14, 2, 7, 7, 4);
    ctx.bezierCurveTo(10, 2, 12, 6, 12, 6);
    ctx.bezierCurveTo(12, 6, 14, 2, 17, 4);
    ctx.bezierCurveTo(22, 7, 20, 14, 12, 20);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(8, 6, 1.8, 0, Math.PI * 2);
    ctx.fill();
  });

  // 12. Gold Coin (20x20)
  const coin = createOffscreenCanvas(20, 20, (ctx) => {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(10, 10, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₣', 10, 11);
  });

  // 13. Slingshot Bag (24x24)
  const slingshot = createOffscreenCanvas(24, 24, (ctx) => {
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(12, 14, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 12);
    ctx.lineTo(12, 7);
    ctx.lineTo(8, 3);
    ctx.moveTo(12, 7);
    ctx.lineTo(16, 3);
    ctx.stroke();
  });

  // 14. Cosette's Angel Shield (24x24)
  const shield = createOffscreenCanvas(24, 24, (ctx) => {
    ctx.fillStyle = 'rgba(244, 114, 182, 0.4)';
    ctx.beginPath();
    ctx.arc(12, 12, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let p = 0; p < 5; p++) {
      const rad = (p * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(12 + Math.cos(rad) * 4, 12 + Math.sin(rad) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(12, 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 15. Theatrical Full Moon & Soft Halo (130x130)
  const moon = createOffscreenCanvas(130, 130, (ctx) => {
    const moonGlow = ctx.createRadialGradient(65, 65, 8, 65, 65, 65);
    moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    moonGlow.addColorStop(0.4, 'rgba(253, 224, 71, 0.35)');
    moonGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(65, 65, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(65, 65, 26, 0, Math.PI * 2);
    ctx.fill();
  });

  // 16. Chapter 1 Sky: Digne Midnight Blue (1x450 strip)
  const sky1 = createOffscreenCanvas(1, 450, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 450);
    grad.addColorStop(0, '#070b16');
    grad.addColorStop(0.6, '#10162a');
    grad.addColorStop(1, '#1b223c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 450);
  });

  // 17. Chapter 2 Sky: Paris Barricade Fire Smoke (1x450 strip)
  const sky2 = createOffscreenCanvas(1, 450, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 450);
    grad.addColorStop(0, '#090910');
    grad.addColorStop(0.6, '#181216');
    grad.addColorStop(1, '#2c1214');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 450);
  });

  // 18. Chapter 3 Sky: Sewer Green-Dark ambiance (1x450 strip)
  const sky3 = createOffscreenCanvas(1, 450, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 450);
    grad.addColorStop(0, '#040b08');
    grad.addColorStop(0.7, '#0b1912');
    grad.addColorStop(1, '#13281e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 450);
  });

  // 19. Sewer Canal Murky Water Stream (1x32 strip)
  const water = createOffscreenCanvas(1, 32, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 32);
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
    grad.addColorStop(0.3, 'rgba(6, 78, 59, 0.85)');
    grad.addColorStop(1, 'rgba(2, 44, 34, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1, 32);
  });

  // 20. Theatrical Cinematic Vignette Overlay (800x450)
  const vignette = createOffscreenCanvas(800, 450, (ctx) => {
    const grad = ctx.createRadialGradient(400, 225, 200, 400, 225, 460);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 450);
  });

  // 21. Pre-baked Sewer Torch Emerald Radial Glow (90x90)
  const torchGlow = createOffscreenCanvas(90, 90, (ctx) => {
    const grad = ctx.createRadialGradient(45, 45, 2, 45, 45, 45);
    grad.addColorStop(0, 'rgba(52, 211, 153, 0.65)');
    grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.22)');
    grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(45, 45, 45, 0, Math.PI * 2);
    ctx.fill();
  });

  // 22. Pre-baked Street Lamp Amber Radial Glow (64x64)
  const lanternGlow = createOffscreenCanvas(64, 64, (ctx) => {
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
  });

  // 23. Pre-baked Invincible Grace Golden Halo (96x96)
  const graceAura = createOffscreenCanvas(96, 96, (ctx) => {
    const grad = ctx.createRadialGradient(48, 48, 8, 48, 48, 48);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
    grad.addColorStop(0.5, 'rgba(250, 204, 21, 0.35)');
    grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(48, 48, 48, 0, Math.PI * 2);
    ctx.fill();
  });

  // 24. Pre-baked Toxic Vapor Glow (36x36)
  const toxicGlow = createOffscreenCanvas(36, 36, (ctx) => {
    const grad = ctx.createRadialGradient(18, 18, 2, 18, 18, 18);
    grad.addColorStop(0, 'rgba(74, 222, 128, 0.55)');
    grad.addColorStop(0.6, 'rgba(34, 197, 94, 0.22)');
    grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(18, 18, 18, 0, Math.PI * 2);
    ctx.fill();
  });

  // 25. Pre-baked Steam Vent Column (32x120)
  const steamGlow = createOffscreenCanvas(32, 120, (ctx) => {
    const grad = ctx.createLinearGradient(0, 120, 0, 0);
    grad.addColorStop(0, 'rgba(148, 163, 184, 0.45)');
    grad.addColorStop(0.5, 'rgba(203, 213, 225, 0.22)');
    grad.addColorStop(1, 'rgba(241, 245, 249, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 120);
  });

  return {
    crate,
    ironCrate,
    ironCrateDented,
    relicChest,
    dampCrate,
    boobyCrate,
    powderKeg,
    manhole,
    steamVent,
    flagSpring,
    mysteryBox,
    mysteryBoxHit,
    mimicBox,
    bread,
    candlestick,
    heart,
    coin,
    slingshot,
    shield,
    moon,
    sky1,
    sky2,
    sky3,
    water,
    vignette,
    torchGlow,
    lanternGlow,
    graceAura,
    toxicGlow,
    steamGlow,
  };
};

export interface GameHUDState {
  score: number;
  distance: number;
  hearts: number;
  breadCount: number;
  candlestickCount: number;
  slingshotAmmo: number;
  hasCosetteShield: boolean;
  graceTimeLeft: number;
  waterSurgeLeft: number;
  javertDistance: number;
  isNearManhole: 'dive' | 'climb' | null;
  eventBanner: { title: string; active: boolean } | null;
  alertLevel: number;
  alertTitle: string;
}

const initialHUDState: GameHUDState = {
  score: 0,
  distance: 0,
  hearts: 3,
  breadCount: 0,
  candlestickCount: 0,
  slingshotAmmo: 5,
  hasCosetteShield: false,
  graceTimeLeft: 0,
  waterSurgeLeft: 0,
  javertDistance: 80,
  isNearManhole: null,
  eventBanner: null,
  alertLevel: 1,
  alertTitle: '暗夜潛行',
};

// Isolated high-performance HUD (re-renders only on throttled sync, zero canvas lag)
const GameHUD: React.FC<{
  hud: GameHUDState;
}> = memo(({ hud }) => {
  return (
    <div className="px-3 sm:px-4 py-1.5 bg-[#0b0c10] border-b border-stone-800 flex items-center justify-between text-xs font-mono select-none">
      <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
        {/* Hearts */}
        <div className="flex items-center gap-1" title="剩餘生命">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 transition-colors ${
                i < hud.hearts ? 'text-red-500 fill-red-500' : 'text-stone-700'
              }`}
            />
          ))}
        </div>

        {/* Bread & Candlesticks with Emergency Bread Salvation Ready Indicator */}
        <div className="flex items-center gap-2.5 text-amber-300">
          <span
            className={`flex items-center gap-1 ${hud.breadCount >= 5 ? 'text-amber-200' : 'text-amber-300'}`}
            title={hud.breadCount >= 5 ? '米里哀主教的白麵包（已達5+，瀕死時自動觸發【充飢急救】保命！）' : '米里哀主教的白麵包（集滿5個可啟用【充飢急救】保命）'}
          >
            <span>🥖</span>
            <span className="font-bold">{hud.breadCount}</span>
            {hud.breadCount >= 5 && (
              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-1 py-0.2 rounded font-sans animate-pulse">
                急救就緒
              </span>
            )}
          </span>
          <span className="flex items-center gap-1" title="米里哀主教的銀燭台">
            <span>🕯️</span>
            <span className="font-bold">{hud.candlestickCount}</span>
          </span>
          {/* Gavroche's Slingshot Pebble Ammo */}
          <span className="flex items-center gap-1 text-sky-300" title="加夫洛許的石子袋 [按 X 或 J 鍵投擲]">
            <span>🪨</span>
            <span className="font-bold">{hud.slingshotAmmo}</span>
            <span className="hidden sm:inline text-[9px] text-sky-400/80 bg-sky-950/60 px-1 rounded border border-sky-800/60">
              X鍵
            </span>
          </span>
        </div>

        {/* Cosette Shield Badge */}
        {hud.hasCosetteShield && (
          <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/50 text-[10px] font-bold flex items-center gap-1">
            <span>🛡️</span>
            <span>珂賽特庇護</span>
          </span>
        )}

        {/* Grace Timer Badge */}
        {hud.graceTimeLeft > 0 && (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-bold animate-pulse flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>聖光磁吸 {hud.graceTimeLeft}s</span>
          </span>
        )}

        {/* Water Surge Sprint Timer Badge */}
        {hud.waterSurgeLeft > 0 && (
          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 text-[10px] font-bold flex items-center gap-1 animate-pulse">
            <span>🌊</span>
            <span>激流疾跑 {hud.waterSurgeLeft}s</span>
          </span>
        )}

        {/* Escalating Wanted / Crisis Alert Level Badge */}
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition-all ${
            hud.alertLevel === 4
              ? 'bg-red-950/90 text-red-200 border-red-500 animate-pulse shadow-md shadow-red-900/60'
              : hud.alertLevel === 3
              ? 'bg-orange-950/80 text-orange-200 border-orange-500/80 animate-pulse'
              : hud.alertLevel === 2
              ? 'bg-amber-950/70 text-amber-200 border-amber-500/70'
              : 'bg-stone-900/80 text-stone-400 border-stone-700/60'
          }`}
          title={`警戒等級 ${hud.alertLevel}：${hud.alertTitle}`}
        >
          <span>{hud.alertLevel >= 3 ? '⚔️' : hud.alertLevel === 2 ? '🚨' : '🕵️'}</span>
          <span>Lv.{hud.alertLevel} {hud.alertTitle}</span>
        </span>

        {/* Dynamic Crisis Event Alert Pill */}
        {hud.eventBanner?.active && (
          <span className="px-2.5 py-0.5 rounded bg-red-950/90 border border-red-500/80 text-red-200 text-[10px] font-bold flex items-center gap-1.5 animate-pulse shadow-sm shadow-red-900/50">
            <span className="text-red-400 animate-bounce">⚠️</span>
            <span>{hud.eventBanner.title}</span>
          </span>
        )}
      </div>

      {/* Distance & Score */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <span className="text-stone-400 text-[11px] sm:text-xs">
          距離：<strong className="text-white font-bold">{hud.distance}m</strong>
        </span>
        <span className="text-amber-400 text-[11px] sm:text-xs">
          分數：<strong className="font-bold text-amber-200">{hud.score}</strong>
        </span>
      </div>
    </div>
  );
});
GameHUD.displayName = 'GameHUD';

// High-Performance Multi-Touch Mobile Controls with Pointer Events & Independent Finger Tracking
const MobileControls: React.FC<{
  keysRef: React.MutableRefObject<{
    left: boolean;
    right: boolean;
    up: boolean;
    upHeld: boolean;
    down: boolean;
    dash: boolean;
    attack: boolean;
    throw: boolean;
  }>;
  slingshotAmmo: number;
  isNearManhole: 'dive' | 'climb' | null;
}> = memo(({ keysRef, slingshotAmmo, isNearManhole }) => {
  const [activeLeft, setActiveLeft] = useState(false);
  const [activeRight, setActiveRight] = useState(false);
  const [activeDown, setActiveDown] = useState(false);
  const [isDashing, setIsDashing] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  return (
    <div
      className="p-2 sm:p-2.5 bg-[#0a0c12]/95 border-t border-amber-900/40 flex items-center justify-between select-none touch-none pb-[max(0.5rem,env(safe-area-inset-bottom))] z-20"
      style={{ touchAction: 'none' }}
    >
      {/* Directional Cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Left / Right directional pad */}
        <div className="flex h-12 sm:h-13 rounded-xl bg-stone-950 border border-stone-700/80 overflow-hidden shadow-lg">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
              triggerHaptic('light');
              keysRef.current.left = true;
              setActiveLeft(true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.left = false;
              setActiveLeft(false);
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              keysRef.current.left = false;
              setActiveLeft(false);
            }}
            className={`w-13 sm:w-16 h-full flex flex-col items-center justify-center font-bold transition-colors select-none ${
              activeLeft
                ? 'bg-amber-500 text-stone-950 shadow-inner'
                : 'text-stone-300 active:bg-stone-800'
            }`}
            aria-label="向左前進"
          >
            <span className="text-lg leading-none">◀</span>
            <span className="text-[9px] font-mono">向左</span>
          </button>
          <div className="w-[1px] bg-stone-800 my-1" />
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
              triggerHaptic('light');
              keysRef.current.right = true;
              setActiveRight(true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.right = false;
              setActiveRight(false);
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              keysRef.current.right = false;
              setActiveRight(false);
            }}
            className={`w-13 sm:w-16 h-full flex flex-col items-center justify-center font-bold transition-colors select-none ${
              activeRight
                ? 'bg-amber-500 text-stone-950 shadow-inner'
                : 'text-stone-300 active:bg-stone-800'
            }`}
            aria-label="向右前進"
          >
            <span className="text-lg leading-none">▶</span>
            <span className="text-[9px] font-mono">向右</span>
          </button>
        </div>

        {/* Dynamic Contextual Action / Down Button */}
        {isNearManhole ? (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
              triggerHaptic('medium');
              if (isNearManhole === 'dive') {
                keysRef.current.down = true;
              } else {
                keysRef.current.up = true;
                keysRef.current.upHeld = true;
              }
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.down = false;
              keysRef.current.upHeld = false;
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              keysRef.current.down = false;
              keysRef.current.upHeld = false;
            }}
            className={`h-12 sm:h-13 px-3 rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold shadow-lg animate-pulse transition-all select-none ${
              isNearManhole === 'dive'
                ? 'bg-emerald-900/95 active:bg-emerald-500 border-emerald-400 text-emerald-200 active:text-stone-950'
                : 'bg-sky-900/95 active:bg-sky-500 border-sky-400 text-sky-200 active:text-stone-950'
            }`}
          >
            <span className="text-sm leading-none">{isNearManhole === 'dive' ? '⬇' : '⬆'}</span>
            <span className="text-[9px] font-bold">{isNearManhole === 'dive' ? '潛入暗道' : '攀回街頭'}</span>
          </button>
        ) : (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
              triggerHaptic('light');
              keysRef.current.down = true;
              setActiveDown(true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.down = false;
              setActiveDown(false);
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              keysRef.current.down = false;
              setActiveDown(false);
            }}
            className={`w-11 sm:w-12 h-12 sm:h-13 rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold select-none transition-colors ${
              activeDown
                ? 'bg-amber-600 border-amber-400 text-stone-950'
                : 'bg-stone-950 border-stone-800 text-stone-400 active:bg-stone-800'
            }`}
            title="下蹲/人孔蓋下潛"
          >
            <span className="text-xs">▼</span>
            <span className="text-[8px]">下潛</span>
          </button>
        )}
      </div>

      {/* Right Action Buttons Cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 3-Stage Melee Attack button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            triggerHaptic('medium');
            keysRef.current.attack = true;
          }}
          className="w-11 sm:w-13 h-11 sm:h-13 rounded-full border bg-amber-950/90 active:bg-amber-500 border-amber-400 text-amber-200 active:text-stone-950 flex flex-col items-center justify-center text-[9px] font-bold active:scale-95 transition-all shadow-md select-none"
          aria-label="近戰三段斬擊"
        >
          <span className="text-xs">🗡️</span>
          <span className="text-[8px] sm:text-[9px] font-bold leading-tight">斬擊</span>
        </button>

        {/* Slingshot pebble throw button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            if (slingshotAmmo > 0) {
              triggerHaptic('medium');
              keysRef.current.throw = true;
            } else {
              triggerHaptic('warning');
            }
          }}
          className={`w-11 sm:w-13 h-11 sm:h-13 rounded-full border flex flex-col items-center justify-center text-[9px] font-bold active:scale-95 transition-all shadow-md select-none ${
            slingshotAmmo > 0
              ? 'bg-sky-900/90 active:bg-sky-500 border-sky-400/80 text-sky-200 active:text-stone-950'
              : 'bg-stone-950 border-stone-800 text-stone-600 opacity-60'
          }`}
          aria-label="加夫洛許彈弓投石"
        >
          <span className="text-xs">🪨</span>
          <span className="text-[8px] sm:text-[9px] font-mono leading-tight">投石({slingshotAmmo})</span>
        </button>

        {/* Sprint / Dash button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            triggerHaptic('light');
            keysRef.current.dash = true;
            setIsDashing(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            keysRef.current.dash = false;
            setIsDashing(false);
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            keysRef.current.dash = false;
            setIsDashing(false);
          }}
          className={`w-11 sm:w-13 h-11 sm:h-13 rounded-full border flex flex-col items-center justify-center text-[9px] font-bold active:scale-95 transition-all shadow-md select-none ${
            isDashing
              ? 'bg-amber-500 border-amber-300 text-stone-950'
              : 'bg-stone-950 active:bg-amber-600 border-stone-700 text-amber-300 active:text-stone-950'
          }`}
          aria-label="衝刺"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="text-[9px] font-bold">衝刺</span>
        </button>

        {/* Primary Jump button (Large, high-priority target) */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            triggerHaptic('medium');
            keysRef.current.up = true;
            keysRef.current.upHeld = true;
            setIsJumping(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            keysRef.current.upHeld = false;
            setIsJumping(false);
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            keysRef.current.upHeld = false;
            setIsJumping(false);
          }}
          className={`w-13 sm:w-15 h-13 sm:h-15 rounded-full border flex flex-col items-center justify-center text-xs font-black shadow-lg active:scale-95 transition-transform select-none ${
            isJumping
              ? 'bg-amber-400 border-amber-200 text-stone-950 shadow-amber-500/50'
              : 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-300/80 text-stone-950 shadow-amber-950/60'
          }`}
          aria-label="跳躍"
        >
          <span className="text-base leading-none">▲</span>
          <span className="text-[10px] font-black">跳躍</span>
        </button>
      </div>
    </div>
  );
});
MobileControls.displayName = 'MobileControls';

// Floating On-Canvas Virtual Gamepad (For Landscape & Fullscreen mode)
const FloatingMobileControls: React.FC<{
  keysRef: React.MutableRefObject<{
    left: boolean;
    right: boolean;
    up: boolean;
    upHeld: boolean;
    down: boolean;
    dash: boolean;
    attack: boolean;
    throw: boolean;
  }>;
  slingshotAmmo: number;
  isNearManhole: 'dive' | 'climb' | null;
}> = memo(({ keysRef, slingshotAmmo, isNearManhole }) => {
  const [activeLeft, setActiveLeft] = useState(false);
  const [activeRight, setActiveRight] = useState(false);
  const [isDashing, setIsDashing] = useState(false);
  const [isJumping, setIsJumping] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex justify-between items-end p-2 sm:p-4 select-none touch-none">
      {/* Left Floating Thumb Controls */}
      <div className="pointer-events-auto flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-2xl">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            triggerHaptic('light');
            keysRef.current.left = true;
            setActiveLeft(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            keysRef.current.left = false;
            setActiveLeft(false);
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            keysRef.current.left = false;
            setActiveLeft(false);
          }}
          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold transition-all ${
            activeLeft ? 'bg-amber-500 text-stone-950 scale-95 shadow-md' : 'bg-stone-900/80 text-white border border-stone-700/60 active:bg-amber-600'
          }`}
          aria-label="左移"
        >
          <span className="text-lg">◀</span>
        </button>

        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            triggerHaptic('light');
            keysRef.current.right = true;
            setActiveRight(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            keysRef.current.right = false;
            setActiveRight(false);
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            keysRef.current.right = false;
            setActiveRight(false);
          }}
          className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold transition-all ${
            activeRight ? 'bg-amber-500 text-stone-950 scale-95 shadow-md' : 'bg-stone-900/80 text-white border border-stone-700/60 active:bg-amber-600'
          }`}
          aria-label="右移"
        >
          <span className="text-lg">▶</span>
        </button>

        {/* Dynamic Contextual Action / Down Button */}
        {isNearManhole ? (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
              triggerHaptic('medium');
              if (isNearManhole === 'dive') {
                keysRef.current.down = true;
              } else {
                keysRef.current.up = true;
                keysRef.current.upHeld = true;
              }
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.down = false;
              keysRef.current.upHeld = false;
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              keysRef.current.down = false;
              keysRef.current.upHeld = false;
            }}
            className={`h-12 px-2.5 rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold shadow-lg animate-pulse ${
              isNearManhole === 'dive'
                ? 'bg-emerald-900/90 border-emerald-400 text-emerald-200 active:bg-emerald-500 active:text-stone-950'
                : 'bg-sky-900/90 border-sky-400 text-sky-200 active:bg-sky-500 active:text-stone-950'
            }`}
          >
            <span className="text-xs">{isNearManhole === 'dive' ? '⬇' : '⬆'}</span>
            <span className="text-[8px] font-bold">{isNearManhole === 'dive' ? '潛入' : '爬回'}</span>
          </button>
        ) : (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
              triggerHaptic('light');
              keysRef.current.down = true;
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              keysRef.current.down = false;
            }}
            onPointerCancel={(e) => {
              e.preventDefault();
              keysRef.current.down = false;
            }}
            className="w-10 h-12 rounded-xl bg-stone-900/80 text-stone-300 border border-stone-700/60 active:bg-amber-600 active:text-stone-950 flex flex-col items-center justify-center text-[9px] font-bold"
            title="下潛/蹲伏"
          >
            <span>▼</span>
            <span className="text-[7px]">下潛</span>
          </button>
        )}
      </div>

      {/* Right Floating Action Controls */}
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-2xl">
        {/* 3-Stage Melee Attack button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            triggerHaptic('medium');
            keysRef.current.attack = true;
          }}
          className="w-11 h-11 rounded-full border bg-amber-950/90 active:bg-amber-500 border-amber-400 text-amber-200 active:text-stone-950 flex flex-col items-center justify-center text-[9px] font-bold active:scale-95 transition-all shadow-md"
          aria-label="近戰三段斬擊"
        >
          <span className="text-xs">🗡️</span>
          <span className="text-[8px] font-bold leading-none">斬擊</span>
        </button>

        {/* Slingshot pebble throw button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            if (slingshotAmmo > 0) {
              triggerHaptic('medium');
              keysRef.current.throw = true;
            } else {
              triggerHaptic('warning');
            }
          }}
          className={`w-11 h-11 rounded-full border flex flex-col items-center justify-center text-[9px] font-bold active:scale-95 transition-all shadow-md ${
            slingshotAmmo > 0
              ? 'bg-sky-900/90 active:bg-sky-500 border-sky-400 text-sky-200 active:text-stone-950'
              : 'bg-stone-900/80 border-stone-800 text-stone-500 opacity-60'
          }`}
          aria-label="加夫洛許彈弓投石"
        >
          <span className="text-xs">🪨</span>
          <span className="text-[8px] font-mono leading-none">{slingshotAmmo}</span>
        </button>

        {/* Sprint / Dash button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            triggerHaptic('light');
            keysRef.current.dash = true;
            setIsDashing(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            keysRef.current.dash = false;
            setIsDashing(false);
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            keysRef.current.dash = false;
            setIsDashing(false);
          }}
          className={`w-11 h-11 rounded-full border flex flex-col items-center justify-center text-[9px] font-bold active:scale-95 transition-all shadow-md ${
            isDashing
              ? 'bg-amber-500 border-amber-300 text-stone-950'
              : 'bg-stone-900/90 active:bg-amber-600 border-stone-700 text-amber-300 active:text-stone-950'
          }`}
          aria-label="衝刺"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="text-[8px] font-bold">衝刺</span>
        </button>

        {/* Primary Jump button */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
            triggerHaptic('medium');
            keysRef.current.up = true;
            keysRef.current.upHeld = true;
            setIsJumping(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            keysRef.current.upHeld = false;
            setIsJumping(false);
          }}
          onPointerCancel={(e) => {
            e.preventDefault();
            keysRef.current.upHeld = false;
            setIsJumping(false);
          }}
          className={`w-13 h-13 rounded-full border flex flex-col items-center justify-center text-xs font-black shadow-xl active:scale-95 transition-transform ${
            isJumping
              ? 'bg-amber-400 border-amber-200 text-stone-950'
              : 'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-300/90 text-stone-950'
          }`}
          aria-label="跳躍"
        >
          <span className="text-base leading-none">▲</span>
          <span className="text-[9px] font-black">跳躍</span>
        </button>
      </div>
    </div>
  );
});
FloatingMobileControls.displayName = 'FloatingMobileControls';

export const ValjeanEscapeGameModal: React.FC<ValjeanEscapeGameModalProps> = memo(({
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pre-rendered high-performance Sprite Atlas (GPU / OffscreenCanvas cached globally)
  const spriteAtlas = getOrCreateGameSpriteAtlas();

  // High score & local leaderboard state
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(STORAGE_KEY_HIGHSCORE)) || 0;
    } catch {
      return 0;
    }
  });

  const [maxDistance, setMaxDistance] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(STORAGE_KEY_MAXDIST)) || 0;
    } catch {
      return 0;
    }
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { name: '馬德蘭市長', score: 3200, distance: 1540, date: '2026.09.20', title: '街壘救贖者' },
      { name: '主教米里哀', score: 2460, distance: 1200, date: '2026.09.18', title: '主教的恩典' },
      { name: '小加夫洛許', score: 1800, distance: 890, date: '2026.09.15', title: '巴黎頑童' },
    ];
  });

  const [gameState, setGameState] = useState<'intro' | 'playing' | 'paused' | 'gameover'>('intro');
  const [hudState, setHudState] = useState<GameHUDState>(initialHUDState);
  const [finalStats, setFinalStats] = useState({ score: 0, distance: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLeaderboardTab, setShowLeaderboardTab] = useState(false);
  const [playerNameInput, setPlayerNameInput] = useState('');
  const [hasRecordedScore, setHasRecordedScore] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [touchControlMode, setTouchControlMode] = useState<'docked' | 'floating' | 'off'>(() => {
    if (typeof window !== 'undefined') {
      const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
      return isTouch ? 'docked' : 'docked';
    }
    return 'docked';
  });
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Active controls state (Keyboard & Virtual Touch)
  const keysRef = useRef<{
    left: boolean;
    right: boolean;
    up: boolean;
    upHeld: boolean;
    down: boolean;
    dash: boolean;
    attack: boolean; // J / Z: 3-Stage Melee Combo with Downward Helm Splitter
    throw: boolean;  // X / K: Gavroche Slingshot Pebble Throw
  }>({
    left: false,
    right: false,
    up: false,
    upHeld: false,
    down: false,
    dash: false,
    attack: false,
    throw: false,
  });

  // Game internal physics & state refs (to avoid re-renders inside 60fps loop)
  const gameRef = useRef<{
    player: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      w: number;
      h: number;
      isGrounded: boolean;
      facingRight: boolean;
      canDoubleJump: boolean;
      isDucking: boolean;
      graceTimer: number; // in frames
      invincibleFlash: number;
      // 3-Stage Combo Combat Engine
      comboStage: number; // 0 (ready), 1, 2, 3
      comboChainTimer: number; // chain window buffer frames
      attackActiveTimer: number; // active hitbox frames
      attackTotalTimer: number; // animation total duration frames
      isHelmSplitter: boolean; // aerial downward plunge
      helmSplitterTrailTimer: number;
    };
    cameraX: number;
    worldDistance: number;
    score: number;
    hearts: number;
    breadCount: number;
    candlestickCount: number;
    slingshotAmmo: number;
    hasCosetteShield: boolean;
    slingshotPebbles: SlingshotPebble[];
    javertHandcuffs: JavertHandcuff[];
    javertThrowTimer: number;
    javertDist: number; // in meters
    javertQuoteTimer: number;
    javertCurrentQuote: string;
    platforms: Platform[];
    mysteryBlocks: MysteryBlock[];
    collectibles: CollectibleItem[];
    enemies: Enemy[];
    worldProps: WorldProp[];
    enemyProjectiles: EnemyProjectile[];
    mortarStrikes: MortarStrike[];
    dynamicEvent: DynamicEventState;
    nextEventDist: number;
    mortarSpawnTimer: number;
    searchlightAlert: boolean;
    consecutiveBread: number;
    citizenSupportTimer: number;
    floatingTexts: FloatingText[];
    nextSpawnX: number;
    chapter: 1 | 2 | 3;
    patternDeck: number[];
    lastArchetypeIndex: number;
    lastWasMimic: boolean;
    animationId: number | null;
    lastTime: number;
    // Juice & Feel physics
    coyoteTimer: number;
    jumpBufferTimer: number;
    wasGrounded: boolean;
    squashStretch: { scaleX: number; scaleY: number };
    hitStopTimer: number;
    screenShake: number;
    particles: GameParticle[];
    particlePool: ObjectPool<PoolableParticle>;
    ghostTrailPool: ObjectPool<PoolableGhostTrail>;
    floatingTextPool: ObjectPool<PoolableFloatingText>;
    runDustTimer: number;
    waterSurgeTimer: number;
    alertLevel: number;
    alertTitle: string;
    heartbeatTimer: number;
    lastMilestoneDist: number;
    activeDialogue: ActiveDialogue | null;
    dialogueQueue: ActiveDialogue[];
    ghostTrails: GhostTrail[];
    skidAudioCooldown: number;
    dashAudioCooldown: number;
  }>({
    player: {
      x: 100,
      y: 280,
      vx: 0,
      vy: 0,
      w: 36,
      h: 52,
      isGrounded: true,
      facingRight: true,
      canDoubleJump: true,
      isDucking: false,
      graceTimer: 0,
      invincibleFlash: 0,
      comboStage: 0,
      comboChainTimer: 0,
      attackActiveTimer: 0,
      attackTotalTimer: 0,
      isHelmSplitter: false,
      helmSplitterTrailTimer: 0,
    },
    cameraX: 0,
    worldDistance: 0,
    score: 0,
    hearts: 3,
    breadCount: 0,
    candlestickCount: 0,
    slingshotAmmo: 5,
    hasCosetteShield: false,
    slingshotPebbles: [],
    javertHandcuffs: [],
    javertThrowTimer: 0,
    javertDist: 80,
    javertQuoteTimer: 0,
    javertCurrentQuote: '「24601！你逃不出法律的手掌心！」',
    platforms: [],
    mysteryBlocks: [],
    collectibles: [],
    enemies: [],
    worldProps: [],
    enemyProjectiles: [],
    mortarStrikes: [],
    dynamicEvent: {
      active: false,
      type: 'none',
      timer: 0,
      maxDuration: 0,
      bannerTitle: '',
      bannerSub: '',
    },
    nextEventDist: 520,
    mortarSpawnTimer: 0,
    searchlightAlert: false,
    consecutiveBread: 0,
    citizenSupportTimer: 0,
    floatingTexts: [],
    nextSpawnX: 0,
    chapter: 1,
    patternDeck: [0, 1, 2, 3, 4],
    lastArchetypeIndex: -1,
    lastWasMimic: false,
    animationId: null,
    lastTime: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    wasGrounded: true,
    squashStretch: { scaleX: 1, scaleY: 1 },
    hitStopTimer: 0,
    screenShake: 0,
    particles: [],
    particlePool: new ObjectPool<PoolableParticle>(() => new PoolableParticle(), 64, 180),
    ghostTrailPool: new ObjectPool<PoolableGhostTrail>(() => new PoolableGhostTrail(), 16, 40),
    floatingTextPool: new ObjectPool<PoolableFloatingText>(() => new PoolableFloatingText(), 12, 30),
    runDustTimer: 0,
    waterSurgeTimer: 0,
    alertLevel: 1,
    alertTitle: '暗夜潛行',
    heartbeatTimer: 0,
    lastMilestoneDist: 0,
    activeDialogue: null,
    dialogueQueue: [],
    ghostTrails: [],
    skidAudioCooldown: 0,
    dashAudioCooldown: 0,
  });

  // Calculate Title based on distance
  const getPlayerTitle = useCallback((dist: number) => {
    if (dist >= 2000) return '永恆聖者・尚萬強';
    if (dist >= 1200) return '街壘救贖者';
    if (dist >= 600) return '蒙特勒伊市長・馬德蘭先生';
    if (dist >= 250) return '迪涅逃亡者';
    return '苦役犯 24601';
  }, []);

  // Initialize fresh world
  const initGameWorld = useCallback(() => {
    const g = gameRef.current;
    g.player.x = 120;
    g.player.y = 280;
    g.player.vx = 0;
    g.player.vy = 0;
    g.player.isGrounded = true;
    g.player.facingRight = true;
    g.player.canDoubleJump = true;
    g.player.isDucking = false;
    g.player.graceTimer = 0;
    g.player.invincibleFlash = 0;
    g.player.comboStage = 0;
    g.player.comboChainTimer = 0;
    g.player.attackActiveTimer = 0;
    g.player.attackTotalTimer = 0;
    g.player.isHelmSplitter = false;
    g.player.helmSplitterTrailTimer = 0;

    g.cameraX = 0;
    g.worldDistance = 0;
    g.score = 0;
    g.hearts = 3;
    g.breadCount = 0;
    g.candlestickCount = 0;
    g.slingshotAmmo = 5;
    g.hasCosetteShield = false;
    g.slingshotPebbles = [];
    g.javertHandcuffs = [];
    g.javertThrowTimer = 0;
    g.javertDist = 80;
    g.chapter = 1;
    g.patternDeck = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
    g.lastArchetypeIndex = -1;
    g.lastWasMimic = false;
    g.floatingTexts = [];
    g.floatingTextPool.clear();
    g.coyoteTimer = 0;
    g.jumpBufferTimer = 0;
    g.wasGrounded = true;
    g.squashStretch = { scaleX: 1, scaleY: 1 };
    g.hitStopTimer = 0;
    g.screenShake = 0;
    g.particles = [];
    g.particlePool.clear();
    g.ghostTrails = [];
    g.ghostTrailPool.clear();
    g.skidAudioCooldown = 0;
    g.dashAudioCooldown = 0;
    g.runDustTimer = 0;
    g.waterSurgeTimer = 0;
    g.alertLevel = 1;
    g.alertTitle = '暗夜潛行';
    g.heartbeatTimer = 0;
    g.lastMilestoneDist = 0;
    g.activeDialogue = {
      id: Date.now(),
      speaker: 'javert',
      speakerName: '警督 賈維爾',
      avatarIcon: '👮',
      text: '「警笛鳴響！囚犯 24601 越獄脫逃！全面封鎖巴黎所有出口！」',
      tag: '🚨 通緝發布',
      tagColor: '#ef4444',
      themeColor: '#ef4444',
      timer: 210,
      maxTimer: 210,
    };
    g.dialogueQueue = [
      {
        id: Date.now() + 1,
        speaker: 'valjean',
        speakerName: '尚萬強 (24601)',
        avatarIcon: '🥖',
        text: '「我答應了芳汀……一定要把珂賽特撫養長大！絕不能在此停下！」',
        tag: '🕊️ 誓言救贖',
        tagColor: '#fbbf24',
        themeColor: '#f59e0b',
        timer: 230,
        maxTimer: 230,
      },
    ];

    // Starting platforms - solid, generous initial run (1440px)
    g.platforms = [
      { x: 0, y: 360, w: 1440, h: 90, type: 'ground' },
      { x: 0, y: 440, w: 1440, h: 50, type: 'sewer' }, // Lower sewer channel
      { x: 336, y: 260, w: 168, h: 22, type: 'brick' },
      { x: 576, y: 200, w: 168, h: 22, type: 'scaffold' },
      { x: 816, y: 250, w: 168, h: 22, type: 'brick' },
      { x: 1080, y: 220, w: 168, h: 22, type: 'scaffold' },
    ];

    // Starting question blocks (with 1 mimic block)
    g.mysteryBlocks = [
      { x: 384, y: 160, w: 34, h: 34, hit: false, bounceOffset: 0, content: 'bread' },
      { x: 624, y: 110, w: 34, h: 34, hit: false, bounceOffset: 0, content: 'slingshot', isMimic: true },
      { x: 864, y: 150, w: 34, h: 34, hit: false, bounceOffset: 0, content: 'shield' },
      { x: 1128, y: 120, w: 34, h: 34, hit: false, bounceOffset: 0, content: 'candlestick' },
    ];

    // Starting collectibles
    g.collectibles = [
      { x: 240, y: 320, w: 24, h: 24, type: 'bread', collected: false, vy: 0, initialY: 320 },
      { x: 480, y: 320, w: 24, h: 24, type: 'slingshot', collected: false, vy: 0, initialY: 320 },
      { x: 720, y: 160, w: 24, h: 24, type: 'coin', collected: false, vy: 0, initialY: 160 },
      { x: 980, y: 320, w: 24, h: 24, type: 'bread', collected: false, vy: 0, initialY: 320 },
      // Collectibles in the lower sewer tunnel
      { x: 420, y: 410, w: 24, h: 24, type: 'coin', collected: false, vy: 0, initialY: 410 },
      { x: 680, y: 410, w: 24, h: 24, type: 'candlestick', collected: false, vy: 0, initialY: 410 },
      { x: 920, y: 410, w: 24, h: 24, type: 'coin', collected: false, vy: 0, initialY: 410 },
    ];

    // Starting enemies
    g.enemies = [
      { x: 672, y: 320, w: 32, h: 42, vx: -1.2, minX: 520, maxX: 800, alive: true, squashTime: 0, type: 'gendarme' },
      { x: 1200, y: 320, w: 32, h: 42, vx: -1.6, minX: 1050, maxX: 1350, alive: true, squashTime: 0, type: 'thenardier' },
    ];

    // Starting interactive world props (with Wooden Crate, Iron Armory Crate, Manhole & Steam Vent)
    g.worldProps = [
      { id: 1, x: 500, y: 328, w: 32, h: 32, type: 'crate', active: true },
      { id: 6, x: 920, y: 328, w: 32, h: 32, type: 'iron_crate', active: true, durability: 2 },
      { id: 2, x: 780, y: 228, w: 26, h: 32, type: 'lantern', active: true, sway: 0 },
      { id: 3, x: 1040, y: 324, w: 30, h: 36, type: 'powder_keg', active: true },
      { id: 4, x: 380, y: 356, w: 46, h: 10, type: 'manhole', active: true },
      { id: 5, x: 1020, y: 430, w: 48, h: 14, type: 'steam_vent', active: true, timer: 0 },
    ];
    g.enemyProjectiles = [];
    g.mortarStrikes = [];
    g.dynamicEvent = {
      active: false,
      type: 'none',
      timer: 0,
      maxDuration: 0,
      bannerTitle: '',
      bannerSub: '',
    };
    g.nextEventDist = 520;
    g.mortarSpawnTimer = 0;
    g.searchlightAlert = false;
    g.consecutiveBread = 0;
    g.citizenSupportTimer = 0;

    g.nextSpawnX = 1440;

    setHudState({ ...initialHUDState });
    setFinalStats({ score: 0, distance: 0 });
    setHasRecordedScore(false);
  }, []);

  // Procedural chunk generation with Chapter-Specific Terrain Archetypes, Shuffle-Bag Pacing & Smart Loot Balancer
  const generateWorldChunk = useCallback((startX: number) => {
    const g = gameRef.current;
    const chunkWidth = 720; // 30 tiles of 24px
    const groundY = 360;

    // Determine chapter theme based on distance
    const currentDist = Math.floor(g.worldDistance);
    if (currentDist > 1400) {
      g.chapter = 3; // Paris Sewers
    } else if (currentDist > 600) {
      g.chapter = 2; // Paris Barricades
    } else {
      g.chapter = 1; // Digne Town
    }

    // Shuffle-Bag Pacing Algorithm: Never repeats identical archetypes consecutively
    if (!g.patternDeck || g.patternDeck.length === 0) {
      g.patternDeck = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
    }
    let pattern = g.patternDeck.pop() ?? 0;
    if (pattern === g.lastArchetypeIndex && g.patternDeck.length > 0) {
      const nextPat = g.patternDeck.pop() ?? 0;
      g.patternDeck.push(pattern);
      pattern = nextPat;
    }
    g.lastArchetypeIndex = pattern;

    // Dynamic Difficulty Scaling
    const diffMult = 1 + Math.min(0.65, currentDist / 3000);
    const ambushChance = Math.min(0.45, 0.15 + currentDist / 4000);

    // Dynamic Loot Balancer (Pity Drop Algorithm & Resource Balancing)
    const getSmartLoot = (preferred: 'bread' | 'candlestick' | 'shield' | 'slingshot'): 'bread' | 'candlestick' | 'shield' | 'slingshot' => {
      if (g.hearts <= 1) {
        return Math.random() < 0.65 ? 'bread' : 'shield';
      }
      if (g.breadCount < 4 && Math.random() < 0.35) {
        return 'bread';
      }
      if (g.slingshotAmmo <= 1 && Math.random() < 0.65) {
        return 'slingshot';
      }
      if (g.javertDist < 35 && Math.random() < 0.5) {
        return 'bread';
      }
      if (g.hearts >= 3 && g.slingshotAmmo >= 4 && Math.random() < 0.35) {
        return 'candlestick';
      }
      return preferred;
    };

    // Determine Mimic placement (never two mimics in a row)
    const canBeMimic = (baseChance = 0.22): boolean => {
      if (g.lastWasMimic) {
        g.lastWasMimic = false;
        return false;
      }
      const isMimic = Math.random() < baseChance;
      if (isMimic) g.lastWasMimic = true;
      return isMimic;
    };

    const groundType = g.chapter === 3 ? 'sewer' : 'ground';

    // Lower sewer canal floor is always present beneath (y = 440, h = 50)
    g.platforms.push({ x: startX, y: 440, w: chunkWidth, h: 50, type: 'sewer' });

    // Collectibles in the lower sewer tunnel
    g.collectibles.push({
      x: startX + 160,
      y: 410,
      w: 24,
      h: 24,
      type: Math.random() > 0.4 ? 'coin' : 'candlestick',
      collected: false,
      vy: 0,
      initialY: 410,
    });
    g.collectibles.push({
      x: startX + 460,
      y: 410,
      w: 24,
      h: 24,
      type: 'coin',
      collected: false,
      vy: 0,
      initialY: 410,
    });

    // Dynamic Enemy Spawner: regular Gendarme, Elite Sergeant (2-hit armor), Grenadier (projectiles), or Thénardier
    const spawnEnemy = (
      ex: number,
      ey: number,
      minX: number,
      maxX: number,
      preferType?: 'gendarme' | 'thenardier' | 'elite_sergeant' | 'grenadier'
    ) => {
      let finalType: 'gendarme' | 'thenardier' | 'elite_sergeant' | 'grenadier' = preferType || 'gendarme';
      let hp = 1;
      let vx = -1.2 * diffMult;

      if (!preferType || preferType === 'gendarme') {
        if (currentDist > 280) {
          const roll = Math.random();
          if (currentDist > 520 && roll < 0.35) {
            finalType = 'grenadier';
            vx = (Math.random() > 0.5 ? 1 : -1) * 0.95;
          } else if (roll < 0.65) {
            finalType = 'elite_sergeant';
            hp = 2;
            vx = (Math.random() > 0.5 ? 1 : -1) * 2.1 * diffMult;
          }
        }
      } else if (preferType === 'elite_sergeant') {
        hp = 2;
        vx = (Math.random() > 0.5 ? 1 : -1) * 2.1 * diffMult;
      } else if (preferType === 'grenadier') {
        vx = (Math.random() > 0.5 ? 1 : -1) * 0.95;
      } else if (preferType === 'thenardier') {
        vx = -1.6 * diffMult;
      }

      g.enemies.push({
        x: ex,
        y: ey,
        w: 32,
        h: 42,
        vx,
        minX,
        maxX,
        alive: true,
        squashTime: 0,
        type: finalType,
        hp,
        maxHp: hp,
        staggerTimer: 0,
        throwCooldown: Math.floor(Math.random() * 80),
      });
    };

    if (g.chapter === 1) {
      // === CHAPTER 1: DIGNE TOWN (Rooftops, Street Markets & Cathedrals) ===
      if (pattern === 0) {
        // Archetype 0: Dual-Layer Mansard Rooftop & Lantern Bounce
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: groundType });

        // Manhole on ground to dive into sewer
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 130,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Steam Vent in lower sewer to blast back to ground
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 540,
          y: 430,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 0,
        });

        // Upper Roof Run (y = 220, 320px long)
        g.platforms.push({ x: startX + 60, y: 220, w: 320, h: 22, type: 'scaffold' });
        // Roof street lantern
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 380,
          y: 200,
          w: 26,
          h: 32,
          type: 'lantern',
          active: true,
          sway: 0,
        });

        // Question block on rooftop
        g.mysteryBlocks.push({
          x: startX + 180,
          y: 150,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('bread'),
          isMimic: canBeMimic(0.2),
        });

        // Bread trail on roof
        [100, 240, 320].forEach((ox) => {
          g.collectibles.push({
            x: startX + ox,
            y: 185,
            w: 24,
            h: 24,
            type: 'bread',
            collected: false,
            vy: 0,
            initialY: 185,
          });
        });

        // Destructible supply crate and reinforced iron armory crate on street
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 260,
          y: 328,
          w: 32,
          h: 32,
          type: 'crate',
          active: true,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 480,
          y: 328,
          w: 32,
          h: 32,
          type: 'iron_crate',
          active: true,
          durability: 2,
        });

        // Patrolling Gendarme on ground (or Elite)
        spawnEnemy(startX + 370, groundY - 42, startX + 300, startX + 460);
      } else if (pattern === 1) {
        // Archetype 1: Cathedral Spire Steps & Bell Scaffold
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: groundType });

        // Manhole on ground
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 110,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Tricolor spring in lower sewer
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 480,
          y: 418,
          w: 36,
          h: 28,
          type: 'flag_spring',
          active: true,
        });

        // Stepped brick platforms
        g.platforms.push({ x: startX + 60, y: 285, w: 130, h: 22, type: 'brick' });
        g.platforms.push({ x: startX + 210, y: 215, w: 140, h: 22, type: 'brick' });
        g.platforms.push({ x: startX + 370, y: 145, w: 150, h: 22, type: 'scaffold' });

        // Bishop's Gilded Relic Chest perched on cathedral scaffolding
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 480,
          y: 115,
          w: 34,
          h: 30,
          type: 'relic_chest',
          active: true,
        });

        // High Question block (Bishop's Silver Candlestick)
        g.mysteryBlocks.push({
          x: startX + 420,
          y: 85,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('candlestick'),
          isMimic: canBeMimic(0.2),
        });

        // Bouncing lantern at descent
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 560,
          y: 220,
          w: 26,
          h: 32,
          type: 'lantern',
          active: true,
          sway: 0,
        });

        // Pickpocket on street
        g.enemies.push({
          x: startX + 500,
          y: groundY - 42,
          w: 32,
          h: 42,
          vx: -1.8 * diffMult,
          minX: startX + 200,
          maxX: startX + 650,
          alive: true,
          squashTime: 0,
          type: 'thenardier',
        });
      } else if (pattern === 2) {
        // Archetype 2: Market Street & Gunpowder Ambush
        const seg1 = 340;
        const gap = 84;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: groundType });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: groundType });
        g.platforms.push({ x: startX + seg1 - 18, y: groundY - 60, w: gap + 36, h: 20, type: 'brick' });

        // Manhole on ground
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 90,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Steam Vent in lower sewer
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 520,
          y: 430,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 20,
        });

        // Explosive powder keg placed before enemies
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 180,
          y: 324,
          w: 30,
          h: 36,
          type: 'powder_keg',
          active: true,
        });

        // Mystery block containing Slingshot Ammo
        g.mysteryBlocks.push({
          x: startX + 120,
          y: 240,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('slingshot'),
          isMimic: canBeMimic(0.24),
        });

        // 2 Gendarmes walking beyond the keg (opportunity for dynamic elite)
        spawnEnemy(startX + 250, groundY - 42, startX + 210, startX + 320);
      } else if (pattern === 3) {
        // Archetype 3: Rooftop Gap Leap & Tricolor Spring Launch
        const seg1 = 310;
        const gap = 100;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: groundType });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: groundType });

        // Manhole on far side
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + seg1 + gap + 40,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // High scaffold rooftop before the gap
        g.platforms.push({ x: startX + 70, y: 240, w: 200, h: 22, type: 'scaffold' });
        // Tricolor spring on the rooftop
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 210,
          y: 212,
          w: 36,
          h: 28,
          type: 'flag_spring',
          active: true,
        });

        // Mystery Block in mid-air over gap
        g.mysteryBlocks.push({
          x: startX + 350,
          y: 130,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('shield'),
          isMimic: canBeMimic(0.18),
        });

        // Steam Vent in lower sewer
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 380,
          y: 430,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 10,
        });

        // Pickpocket waiting on far landing
        g.enemies.push({
          x: startX + 500,
          y: groundY - 42,
          w: 32,
          h: 42,
          vx: -1.7 * diffMult,
          minX: startX + 440,
          maxX: startX + 660,
          alive: true,
          squashTime: 0,
          type: 'thenardier',
        });
      } else if (pattern === 4) {
        // Archetype 4: Narrow Cobblestone Alley & Triple Crate Stash
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: groundType });

        // Manholes at both ends for agile sewer dodging
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 60,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 600,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Tactical Triple Crate Cluster: Wooden Crate, Armory Iron Crate, and Hazardous Booby Crate!
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 180,
          y: 328,
          w: 32,
          h: 32,
          type: 'crate',
          active: true,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 216,
          y: 328,
          w: 32,
          h: 32,
          type: 'iron_crate',
          active: true,
          durability: 2,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 252,
          y: 328,
          w: 32,
          h: 32,
          type: 'booby_crate',
          active: true,
        });

        // Overhead brick ledge
        g.platforms.push({ x: startX + 280, y: 230, w: 180, h: 22, type: 'brick' });
        g.mysteryBlocks.push({
          x: startX + 340,
          y: 160,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('bread'),
          isMimic: canBeMimic(0.22),
        });

        // Gendarme patrol (or Elite Sergeant / Grenadier)
        spawnEnemy(startX + 480, groundY - 42, startX + 380, startX + 570);
      } else if (pattern === 5) {
        // Archetype 5: Parisian Marketplace & Striped Awning Bounce
        const seg1 = 260;
        const gap = 120;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: groundType });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: groundType });

        // Striped Awning Springboard spanning the market street (High trampoline leap!)
        g.platforms.push({ x: startX + 180, y: 280, w: 110, h: 18, type: 'awning' });

        // High Clocktower Scaffold Ledge (y = 135)
        g.platforms.push({ x: startX + 240, y: 135, w: 220, h: 22, type: 'scaffold' });

        // Question block with bread / shield on the high clocktower
        g.mysteryBlocks.push({
          x: startX + 330,
          y: 70,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('candlestick'),
          isMimic: canBeMimic(0.15),
        });

        // Coins along the arc of the awning leap
        [200, 260, 320, 380].forEach((ox) => {
          g.collectibles.push({
            x: startX + ox,
            y: 105,
            w: 24,
            h: 24,
            type: 'coin',
            collected: false,
            vy: 0,
            initialY: 105,
          });
        });

        // Manhole on far side
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + seg1 + gap + 30,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Patrolling Elite Sergeant
        spawnEnemy(startX + 480, groundY - 42, startX + 400, startX + 620, 'elite_sergeant');
      } else if (pattern === 6) {
        // Archetype 6: Bishop's Garden & Ancient Crumbling Ledges
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: groundType });

        // Crumbling garden wall ledges (shake and drop after stepping on)
        g.platforms.push({ x: startX + 80, y: 275, w: 100, h: 20, type: 'crumble' });
        g.platforms.push({ x: startX + 220, y: 210, w: 110, h: 20, type: 'crumble' });
        g.platforms.push({ x: startX + 360, y: 150, w: 140, h: 22, type: 'brick' });

        // Bp. Myriel's Golden Candlestick secret reward
        g.mysteryBlocks.push({
          x: startX + 420,
          y: 90,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('candlestick'),
          isMimic: false,
        });

        // Bread on lower garden
        g.collectibles.push({
          x: startX + 290,
          y: 325,
          w: 24,
          h: 24,
          type: 'bread',
          collected: false,
          vy: 0,
          initialY: 325,
        });

        // Manhole
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 540,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Pickpocket Thénardier waiting at garden exit
        g.enemies.push({
          x: startX + 560,
          y: groundY - 42,
          w: 32,
          h: 42,
          vx: -1.7 * diffMult,
          minX: startX + 460,
          maxX: startX + 660,
          alive: true,
          squashTime: 0,
          type: 'thenardier',
        });
      } else {
        // Archetype 7: Notre-Dame Cathedral Belfry, Flying Buttress & High Relic Chest
        const seg1 = 220;
        const gap = 180;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: groundType });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: groundType });

        // Awning Trampoline before the chasm launching up to Belfry
        g.platforms.push({ x: startX + 130, y: 290, w: 85, h: 18, type: 'awning' });

        // Cathedral Flying Buttress Brick Archways spanning high above the street
        g.platforms.push({ x: startX + 170, y: 215, w: 120, h: 22, type: 'brick' });
        g.platforms.push({ x: startX + 285, y: 135, w: 150, h: 24, type: 'brick' });

        // Bishop's Gilded Relic Chest perched at summit of Belfry!
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 345,
          y: 103,
          w: 32,
          h: 32,
          type: 'relic_chest',
          active: true,
        });

        // Steam Vent in lower sewer to rescue from chasm fall
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 290,
          y: 430,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 15,
        });

        // Manhole on far side
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + seg1 + gap + 40,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Elite Sergeant patrolling the far churchyard
        spawnEnemy(startX + seg1 + gap + 100, groundY - 42, startX + seg1 + gap + 20, startX + chunkWidth - 30, 'elite_sergeant');
      }
    } else if (g.chapter === 2) {
      // === CHAPTER 2: PARIS BARRICADES (Rebellion, Tricolor Springs & Gunpowder) ===
      if (pattern === 0) {
        // Archetype 0: The Grand Barricade with Tricolor Flag Spring
        const seg1 = 280;
        const gap = 110;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: groundType });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: groundType });

        // Manhole on ground
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 70,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Steam vent in lower sewer
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 460,
          y: 430,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 40,
        });

        // Overturned carriages & barricade ascent
        g.platforms.push({ x: startX + 50, y: 305, w: 100, h: 24, type: 'scaffold' });
        g.platforms.push({ x: startX + 140, y: 240, w: 110, h: 24, type: 'scaffold' });

        // Tricolor Flag Spring on barricade summit
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 215,
          y: 212,
          w: 36,
          h: 28,
          type: 'flag_spring',
          active: true,
        });

        // Platform on the other side of the gap
        g.platforms.push({ x: startX + 410, y: 250, w: 130, h: 22, type: 'scaffold' });

        // Question block with Cosette Shield on landing
        g.mysteryBlocks.push({
          x: startX + 450,
          y: 175,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('shield'),
          isMimic: canBeMimic(0.22),
        });

        // 1 Gendarme in the post-barricade area (scaled to Elite)
        spawnEnemy(startX + 540, groundY - 42, startX + 420, startX + 680);
      } else if (pattern === 1) {
        // Archetype 1: Barricade Powder Cache & High Watchtower
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: groundType });

        // Manhole on ground
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 90,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Flag spring in lower sewer
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 500,
          y: 418,
          w: 36,
          h: 28,
          type: 'flag_spring',
          active: true,
        });

        // 2 Powder kegs placed on the barricade floor
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 160,
          y: 324,
          w: 30,
          h: 36,
          type: 'powder_keg',
          active: true,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 460,
          y: 324,
          w: 30,
          h: 36,
          type: 'powder_keg',
          active: true,
        });

        // High sniper watchtower
        g.platforms.push({ x: startX + 280, y: 190, w: 160, h: 22, type: 'scaffold' });
        // Mystery block containing slingshot ammo
        g.mysteryBlocks.push({
          x: startX + 340,
          y: 120,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('slingshot'),
          isMimic: canBeMimic(0.24),
        });

        // Watchtower Grenadier & Ground Gendarme
        spawnEnemy(startX + 320, 190 - 42, startX + 280, startX + 420, 'grenadier');
        spawnEnemy(startX + 220, groundY - 42, startX + 180, startX + 380);
      } else if (pattern === 2) {
        // Archetype 2: Lantern Relay Across Street Chasm
        const seg1 = 300;
        const gap = 120;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: groundType });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: groundType });

        // Manhole on ground
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 80,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Steam vent in lower sewer
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 360,
          y: 430,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 0,
        });

        // 2 Hanging Lanterns forming a mid-air bridge
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 230,
          y: 220,
          w: 26,
          h: 32,
          type: 'lantern',
          active: true,
          sway: 0,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 345,
          y: 220,
          w: 26,
          h: 32,
          type: 'lantern',
          active: true,
          sway: 0,
        });

        // High scaffold on far side
        g.platforms.push({ x: startX + 440, y: 220, w: 140, h: 22, type: 'scaffold' });

        // Thenardier pickpocket lurking
        g.enemies.push({
          x: startX + 520,
          y: groundY - 42,
          w: 32,
          h: 42,
          vx: -1.6 * diffMult,
          minX: startX + 440,
          maxX: startX + 690,
          alive: true,
          squashTime: 0,
          type: 'thenardier',
        });
      } else if (pattern === 3) {
        // Archetype 3: Heavy Gendarme Fortress with Ambush Manhole & Steam Flank
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: groundType });

        // Ambush Manhole in center
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 320,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: true,
        });

        // Steam vent in sewer positioned to bypass the fortress
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 520,
          y: 430,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 15,
        });

        // Upper scaffold catwalk to jump over ground troops
        g.platforms.push({ x: startX + 160, y: 230, w: 260, h: 22, type: 'scaffold' });
        g.mysteryBlocks.push({
          x: startX + 240,
          y: 160,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('candlestick'),
          isMimic: canBeMimic(0.2),
        });

        // Gendarme troops (guarded by elite officer)
        spawnEnemy(startX + 400, groundY - 42, startX + 340, startX + 540);
      } else if (pattern === 4) {
        // Archetype 4: Triple Barricade Scaffolding & Powder Keg Chain
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: groundType });

        // Manholes at entry and exit
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 60,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // 3 Tiered Scaffolding Platforms
        g.platforms.push({ x: startX + 120, y: 290, w: 100, h: 22, type: 'scaffold' });
        g.platforms.push({ x: startX + 250, y: 230, w: 120, h: 22, type: 'scaffold' });
        g.platforms.push({ x: startX + 400, y: 170, w: 130, h: 22, type: 'scaffold' });

        // Powder keg under middle scaffold
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 280,
          y: 324,
          w: 30,
          h: 36,
          type: 'powder_keg',
          active: true,
        });

        // High Mystery block on top scaffold
        g.mysteryBlocks.push({
          x: startX + 450,
          y: 100,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('bread'),
          isMimic: canBeMimic(0.2),
        });

        // Thenardier pickpocket
        g.enemies.push({
          x: startX + 560,
          y: groundY - 42,
          w: 32,
          h: 42,
          vx: -1.7 * diffMult,
          minX: startX + 460,
          maxX: startX + 680,
          alive: true,
          squashTime: 0,
          type: 'thenardier',
        });
      } else if (pattern === 5) {
        // Archetype 5: Boulevard Chasm & Collapsed Carriage Bridge
        const seg1 = 240;
        const gap = 160;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: groundType });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: groundType });

        // Crumbling cobblestone stepping bridge across the chasm
        g.platforms.push({ x: startX + 220, y: groundY - 30, w: 90, h: 20, type: 'crumble' });
        g.platforms.push({ x: startX + 320, y: groundY - 60, w: 90, h: 20, type: 'crumble' });

        // Parisian awning springboard on the right rim launching up to watchtower
        g.platforms.push({ x: startX + 420, y: groundY - 20, w: 75, h: 18, type: 'awning' });

        // High sniper scaffold
        g.platforms.push({ x: startX + 460, y: 150, w: 180, h: 22, type: 'scaffold' });

        // Mystery block on sniper scaffold
        g.mysteryBlocks.push({
          x: startX + 520,
          y: 85,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('shield'),
          isMimic: canBeMimic(0.16),
        });

        // Grenadier on far side
        spawnEnemy(startX + 520, groundY - 42, startX + 440, startX + 660, 'grenadier');
      } else if (pattern === 6) {
        // Archetype 6: National Guard Artillery Redoubt & High Fortress
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: groundType });

        // Manholes for sewer flanking
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 80,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // High wooden watchtower steps
        g.platforms.push({ x: startX + 150, y: 280, w: 110, h: 22, type: 'scaffold' });
        g.platforms.push({ x: startX + 280, y: 210, w: 130, h: 22, type: 'scaffold' });
        g.platforms.push({ x: startX + 430, y: 140, w: 160, h: 22, type: 'scaffold' });

        // Powder keg and crates at foot of fortress
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 310,
          y: 324,
          w: 30,
          h: 36,
          type: 'powder_keg',
          active: true,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 350,
          y: 328,
          w: 32,
          h: 32,
          type: 'iron_crate',
          active: true,
          durability: 2,
        });

        // Slingshot pebble refill block on watchtower
        g.mysteryBlocks.push({
          x: startX + 490,
          y: 75,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: 'slingshot',
          isMimic: false,
        });

        // Elite Sergeant guarding the redoubt
        spawnEnemy(startX + 460, groundY - 42, startX + 380, startX + 620, 'elite_sergeant');
      } else {
        // Archetype 7: 1832 Heavy Artillery Battery & Crossfire Rampart
        const seg1 = 220;
        const gap = 160;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: groundType });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: groundType });

        // Stepped Barricade Artillery Ascent
        g.platforms.push({ x: startX + 80, y: 290, w: 110, h: 24, type: 'scaffold' });
        g.platforms.push({ x: startX + 170, y: 220, w: 120, h: 24, type: 'scaffold' });
        g.platforms.push({ x: startX + 270, y: 150, w: 140, h: 24, type: 'scaffold' });

        // Tactical Powder Keg & Booby Crate Chain on high battery
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 200,
          y: 184,
          w: 30,
          h: 36,
          type: 'powder_keg',
          active: true,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 236,
          y: 188,
          w: 32,
          h: 32,
          type: 'booby_crate',
          active: true,
        });

        // Tricolor Flag Spring on top rampart launching across gap
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 360,
          y: 122,
          w: 36,
          h: 28,
          type: 'flag_spring',
          active: true,
        });

        // Landing scaffold on far side
        g.platforms.push({ x: startX + seg1 + gap + 30, y: 240, w: 140, h: 22, type: 'scaffold' });
        g.mysteryBlocks.push({
          x: startX + seg1 + gap + 80,
          y: 170,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('shield'),
          isMimic: false,
        });

        // Manhole on ground on far side
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + seg1 + gap + 110,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Grenadier mortar shooter stationed on high battery
        spawnEnemy(startX + 290, 150 - 42, startX + 270, startX + 390, 'grenadier');
        // Elite Sergeant on ground
        spawnEnemy(startX + seg1 + gap + 120, groundY - 42, startX + seg1 + gap + 40, startX + chunkWidth - 20, 'elite_sergeant');
      }
    } else {
      // === CHAPTER 3: PARIS SEWERS (Steam Vents, Murky Aqueducts & Pipes) ===
      if (pattern === 0) {
        // Archetype 0: High-Pressure Steam Geysers & Overhead Secret Catwalk
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: 'sewer' });

        // Manhole on top platform
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 80,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // 2 Steam Vents on floor
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 160,
          y: groundY - 14,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 0,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 460,
          y: groundY - 14,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 70, // offset eruption cycle
        });

        // High overhead sewer drainage pipe catwalk (y = 160)
        g.platforms.push({ x: startX + 180, y: 160, w: 250, h: 22, type: 'brick' });

        // Coins & Bread on the high secret catwalk
        [200, 260, 320, 380].forEach((ox) => {
          g.collectibles.push({
            x: startX + ox,
            y: 125,
            w: 24,
            h: 24,
            type: ox === 260 ? 'candlestick' : 'coin',
            collected: false,
            vy: 0,
            initialY: 125,
          });
        });

        // 1 Gendarme in the damp darkness (Elite / Grenadier)
        spawnEnemy(startX + 320, groundY - 42, startX + 220, startX + 440);
      } else if (pattern === 1) {
        // Archetype 1: Toxic Sewage Gap & Floating Barrel Stepping Stone
        const seg1 = 260;
        const gap = 150;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: 'sewer' });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: 'sewer' });

        // Floating barrel platform in murky canal
        g.platforms.push({ x: startX + 310, y: groundY + 5, w: 60, h: 20, type: 'scaffold' });

        // Overhead iron sewer pipe high route
        g.platforms.push({ x: startX + 220, y: 220, w: 180, h: 22, type: 'brick' });

        // Mossy Sewer Cistern Crate on far side
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 460,
          y: 328,
          w: 32,
          h: 32,
          type: 'damp_crate',
          active: true,
        });

        // Question block
        g.mysteryBlocks.push({
          x: startX + 280,
          y: 155,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('bread'),
          isMimic: canBeMimic(0.24),
        });

        // Thenardier
        g.enemies.push({
          x: startX + 540,
          y: groundY - 42,
          w: 32,
          h: 42,
          vx: -1.7 * diffMult,
          minX: startX + 430,
          maxX: startX + 680,
          alive: true,
          squashTime: 0,
          type: 'thenardier',
        });
      } else if (pattern === 2) {
        // Archetype 2: Giant Sewer Aqueduct Arch & Powder Keg Blast
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: 'sewer' });

        // Manhole on ground
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 80,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Grand stone aqueduct
        g.platforms.push({ x: startX + 120, y: 235, w: 260, h: 24, type: 'brick' });

        // Powder keg on lower floor
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 240,
          y: 324,
          w: 30,
          h: 36,
          type: 'powder_keg',
          active: true,
        });

        // Steam vent on far side
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 500,
          y: groundY - 14,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 30,
        });

        // Gendarme patrolling near keg (with chance of Elite)
        spawnEnemy(startX + 310, groundY - 42, startX + 250, startX + 420);
      } else if (pattern === 3) {
        // Archetype 3: Dual-Pipe Rapids & Mid-Air Flag Spring
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: 'sewer' });

        // Manhole at start
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 60,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // 2 High sewer pipes
        g.platforms.push({ x: startX + 150, y: 210, w: 140, h: 22, type: 'brick' });
        g.platforms.push({ x: startX + 380, y: 170, w: 160, h: 22, type: 'brick' });

        // Tricolor spring on ground launching up to the highest pipe
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 320,
          y: 332,
          w: 36,
          h: 28,
          type: 'flag_spring',
          active: true,
        });

        // Bishop's Candlestick high reward on the pipe
        g.mysteryBlocks.push({
          x: startX + 440,
          y: 100,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('candlestick'),
          isMimic: canBeMimic(0.18),
        });

        // Steam vent to escape to street
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 580,
          y: 430,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 0,
        });

        // Pickpocket
        g.enemies.push({
          x: startX + 220,
          y: groundY - 42,
          w: 32,
          h: 42,
          vx: -1.8 * diffMult,
          minX: startX + 100,
          maxX: startX + 300,
          alive: true,
          squashTime: 0,
          type: 'thenardier',
        });
      } else if (pattern === 4) {
        // Archetype 4: Labyrinth Junction & Thenardier Mimic Stash
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: 'sewer' });

        // Manholes at both ends
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 90,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 580,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Dual Mystery Blocks (One real, one Mimic!)
        g.mysteryBlocks.push({
          x: startX + 230,
          y: 260,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('slingshot'),
          isMimic: true,
        });
        g.mysteryBlocks.push({
          x: startX + 360,
          y: 260,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('bread'),
          isMimic: false,
        });

        // Mossy Sewer Cistern Crate
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 300,
          y: 328,
          w: 32,
          h: 32,
          type: 'damp_crate',
          active: true,
        });

        // Gendarme / Elite
        spawnEnemy(startX + 470, groundY - 42, startX + 400, startX + 560);
      } else if (pattern === 5) {
        // Archetype 5: Rushing Sluice Rapids & Water Current Stream
        const seg1 = 220;
        const gap = 180;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: 'sewer' });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: 'sewer' });

        // Rapid Sewer Stream Platform in the canal (gives forward speed surge!)
        g.platforms.push({ x: startX + seg1 - 10, y: groundY + 15, w: gap + 20, h: 25, type: 'stream' });

        // High Sewer Pipe Walkway (y = 190)
        g.platforms.push({ x: startX + 180, y: 190, w: 220, h: 22, type: 'brick' });

        // Steam vent inside stream gap
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 330,
          y: groundY - 14,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 20,
        });

        // Bread chain on the high pipe
        [200, 260, 320].forEach((ox) => {
          g.collectibles.push({
            x: startX + ox,
            y: 155,
            w: 24,
            h: 24,
            type: 'bread',
            collected: false,
            vy: 0,
            initialY: 155,
          });
        });

        // Grenadier on far ledge
        spawnEnemy(startX + 480, groundY - 42, startX + 420, startX + 640, 'grenadier');
      } else if (pattern === 6) {
        // Archetype 6: Catacomb Crypt Arches & Subterranean Siphon
        g.platforms.push({ x: startX, y: groundY, w: chunkWidth, h: 90, type: 'sewer' });

        // Crumbling mossy stone aqueduct steps
        g.platforms.push({ x: startX + 90, y: 280, w: 100, h: 20, type: 'crumble' });
        g.platforms.push({ x: startX + 230, y: 215, w: 110, h: 20, type: 'crumble' });
        g.platforms.push({ x: startX + 380, y: 150, w: 160, h: 24, type: 'brick' });

        // Awning canvas spring on ground to bounce back up
        g.platforms.push({ x: startX + 310, y: groundY - 18, w: 80, h: 18, type: 'awning' });

        // Golden Bishop Candlestick secret reward at crypt peak
        g.mysteryBlocks.push({
          x: startX + 440,
          y: 85,
          w: 34,
          h: 34,
          hit: false,
          bounceOffset: 0,
          content: getSmartLoot('candlestick'),
          isMimic: false,
        });

        // Manhole on ground
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 560,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Elite Sergeant
        spawnEnemy(startX + 480, groundY - 42, startX + 400, startX + 620, 'elite_sergeant');
      } else {
        // Archetype 7: The Great Underground Cistern, Rapid Stream & Suspended Aqueducts
        const seg1 = 200;
        const gap = 200;
        const seg2 = chunkWidth - seg1 - gap;
        g.platforms.push({ x: startX, y: groundY, w: seg1, h: 90, type: 'sewer' });
        g.platforms.push({ x: startX + seg1 + gap, y: groundY, w: seg2, h: 90, type: 'sewer' });

        // Rapid sewer water current conveyor spanning the deep canal
        g.platforms.push({ x: startX + seg1 - 10, y: groundY + 15, w: gap + 20, h: 25, type: 'stream' });

        // Suspended Aqueduct Pipes & Vaulted Arches
        g.platforms.push({ x: startX + 150, y: 220, w: 130, h: 22, type: 'brick' });
        g.platforms.push({ x: startX + 270, y: 140, w: 160, h: 22, type: 'brick' });

        // Dual Damp Crates for massive water surge chain
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 180,
          y: 188,
          w: 32,
          h: 32,
          type: 'damp_crate',
          active: true,
        });
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 310,
          y: 108,
          w: 32,
          h: 32,
          type: 'damp_crate',
          active: true,
        });

        // High-power steam vent in reservoir bed
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + 330,
          y: groundY - 14,
          w: 48,
          h: 14,
          type: 'steam_vent',
          active: true,
          timer: 10,
        });

        // Bread chain across high vaulted arch
        [280, 330, 380].forEach((ox) => {
          g.collectibles.push({
            x: startX + ox,
            y: 105,
            w: 24,
            h: 24,
            type: 'bread',
            collected: false,
            vy: 0,
            initialY: 105,
          });
        });

        // Manhole on far landing
        g.worldProps.push({
          id: Date.now() + Math.random(),
          x: startX + seg1 + gap + 30,
          y: 356,
          w: 46,
          h: 10,
          type: 'manhole',
          active: true,
          hasAmbush: Math.random() < ambushChance,
        });

        // Grenadier mortar guard on high arch
        spawnEnemy(startX + 360, 140 - 42, startX + 280, startX + 410, 'grenadier');
        // Elite Sergeant on far landing
        spawnEnemy(startX + seg1 + gap + 90, groundY - 42, startX + seg1 + gap + 20, startX + chunkWidth - 30, 'elite_sergeant');
      }
    }

    // Safe Memory Pruning: Preserves terrain behind the player for backtracking!
    const pruneX = Math.min(g.cameraX - 600, g.player.x - 600);
    g.platforms = g.platforms.filter((p) => p.x + p.w > pruneX);
    g.mysteryBlocks = g.mysteryBlocks.filter((b) => b.x + b.w > pruneX);
    g.collectibles = g.collectibles.filter((c) => c.x + c.w > pruneX && !c.collected);
    g.enemies = g.enemies.filter((e) => e.x + e.w > pruneX);
    g.worldProps = g.worldProps.filter((wp) => wp.x + wp.w > pruneX && wp.active);
    g.enemyProjectiles = g.enemyProjectiles.filter((p) => p.x > pruneX);
    g.mortarStrikes = g.mortarStrikes.filter((s) => s.targetX > pruneX);

    g.nextSpawnX = startX + chunkWidth;
  }, []);

  // Main Game Loop (60 FPS)
  useEffect(() => {
    if (!isOpen || gameState !== 'playing') {
      if (gameRef.current.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
        gameRef.current.animationId = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    // Fixed-timestep integrator constants (60 Hz physics step)
    const FIXED_TIMESTEP = 1000 / 60; // 16.6667 ms
    const MAX_PHYSICS_STEPS = 4;
    let lastTimestamp = performance.now();
    let accumulator = 0;

    const triggerDialogue = (d: Omit<ActiveDialogue, 'id'>) => {
      const g = gameRef.current;
      const newDiag: ActiveDialogue = {
        ...d,
        id: Date.now() + Math.random(),
      };
      if (!g.activeDialogue) {
        g.activeDialogue = newDiag;
        gameAudio.playDialogueChime(newDiag.speaker);
      } else if (g.dialogueQueue.length < 3) {
        g.dialogueQueue.push(newDiag);
      }
    };

    // Helper: Zero-GC Pool Particle Spawner
    const spawnParticle = (
      x: number,
      y: number,
      vx: number,
      vy: number,
      size: number,
      color: string,
      maxLife: number,
      type: 'dust' | 'spark' | 'ring' = 'dust',
      alpha: number = 1
    ) => {
      const g = gameRef.current;
      const p = g.particlePool.acquire();
      p.init(x, y, vx, vy, size, color, maxLife, type, alpha);
      g.particles.push(p);
    };

    const updatePhysicsStep = (dtScale: number = 1.0) => {
      const g = gameRef.current;
      const player = g.player;
      const keys = keysRef.current;

      // Screen Shake Decay in fixed step (smooth 60Hz exponential drop)
      if (g.screenShake > 0) {
        g.screenShake *= 0.84;
        if (g.screenShake < 0.12) g.screenShake = 0;
      }

      // Citizen Support Timer Countdown
      if (g.citizenSupportTimer > 0) {
        g.citizenSupportTimer--;
      }

      // Hitstop Freeze-Frame (Tactile hit crunch)
      if (g.hitStopTimer > 0) {
        g.hitStopTimer--;
        return;
      }

      // Emergency White Bread Salvation Check (瀕死白麵包急救保命)
      const checkBreadEmergencySalvation = (): boolean => {
        if (g.hearts <= 1 && g.breadCount >= 5) {
          g.breadCount -= 5;
          g.hearts = 1;
          player.invincibleFlash = 120;
          gameAudio.playCandlestick();
          g.hitStopTimer = 6;
          g.screenShake = 7;
          g.floatingTexts.push({
            id: Date.now() + Math.random(),
            x: player.x,
            y: player.y - 35,
            text: '🥖 珍藏白麵包發揮奇蹟！【充飢急救】保住性命！(-5🥖)',
            color: '#fef08a',
            opacity: 1,
          });
          triggerDialogue({
            speaker: 'bishop',
            speakerName: '米里哀主教的微光',
            avatarIcon: '🕯️',
            text: '「這麵包賜予你生命，我的兄弟，重新站起來吧！」',
            tag: '✨ 奇蹟急救',
            tagColor: '#fde047',
            themeColor: '#ca8a04',
            timer: 200,
            maxTimer: 200,
          });
          for (let i = 0; i < 12; i++) {
            g.particles.push({
              x: player.x + player.w / 2,
              y: player.y + player.h / 2,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              size: 3.5,
              color: '#fde047',
              alpha: 1,
              life: 0,
              maxLife: 20,
              type: 'spark',
            });
          }
          return true;
        }
        return false;
      };

      // 1. Controls & Player Physics (Celeste & Mario Inspired Game Feel Engine)
      if (g.skidAudioCooldown > 0) g.skidAudioCooldown--;
      if (g.dashAudioCooldown > 0) g.dashAudioCooldown--;

      const hasWaterSurge = g.waterSurgeTimer > 0;
      if (hasWaterSurge) {
        g.waterSurgeTimer--;
        if (Math.abs(player.vx) > 1.5 && Math.random() < 0.25) {
          g.particles.push({
            x: player.x + player.w / 2,
            y: player.y + player.h - 2,
            vx: -player.vx * 0.2,
            vy: -1,
            size: 3,
            color: '#38bdf8',
            alpha: 0.8,
            life: 0,
            maxLife: 15,
            type: 'ring',
          });
        }
      }

      // Audio feedback on sprint start
      if (keys.dash && g.dashAudioCooldown <= 0) {
        gameAudio.playDash();
        g.dashAudioCooldown = 28;
      }

      // Input Direction
      const inputDir = keys.left ? -1 : keys.right ? 1 : 0;
      if (inputDir !== 0) {
        player.facingRight = inputDir > 0;
      }

      // Comprehensive Smooth Inertia & Skid Calculation with Delta Time Compensation
      const moveResult = calculateHorizontalMovementDT(
        player.vx,
        inputDir,
        player.isGrounded,
        keys.dash,
        player.graceTimer > 0 || hasWaterSurge,
        dtScale
      );

      player.vx = moveResult.newVx;

      // Skid Feedback (Gritty cobblestone friction squeak + dust puff + horizontal body shear)
      if (moveResult.isSkidding) {
        if (g.skidAudioCooldown <= 0) {
          gameAudio.playSkid();
          g.skidAudioCooldown = 13;
        }
        g.squashStretch = { scaleX: 1.16, scaleY: 0.88 };

        // Skid dust sparks opposite to skid momentum
        for (let i = 0; i < 2; i++) {
          g.particles.push({
            x: player.x + player.w / 2 + (Math.random() - 0.5) * 8,
            y: player.y + player.h - 1,
            vx: -moveResult.skidDirection * (1.8 + Math.random() * 2),
            vy: -0.6 - Math.random() * 0.8,
            size: 3,
            color: '#a8a29e',
            alpha: 0.85,
            life: 0,
            maxLife: 14,
            type: 'dust',
          });
        }
      }

      // Update Coyote & Jump Buffer Timers
      if (keys.up) {
        g.jumpBufferTimer = 9; // 9 frames buffer (~150ms)
        keys.up = false;
      } else if (g.jumpBufferTimer > 0) {
        g.jumpBufferTimer--;
      }

      if (player.isGrounded) {
        g.coyoteTimer = 8; // 8 frames coyote (~133ms)
      } else if (g.coyoteTimer > 0) {
        g.coyoteTimer--;
      }

      // Jump Execution (Ground jump with coyote window OR air double-jump)
      if (g.jumpBufferTimer > 0 && (player.isGrounded || g.coyoteTimer > 0)) {
        player.vy = -12.8;
        player.isGrounded = false;
        g.coyoteTimer = 0;
        g.jumpBufferTimer = 0;
        player.canDoubleJump = true;
        g.squashStretch = { scaleX: 0.74, scaleY: 1.32 }; // Jump stretch!
        gameAudio.playJump();

        // Jump dust particles
        for (let i = 0; i < 5; i++) {
          g.particles.push({
            x: player.x + player.w / 2 + (Math.random() - 0.5) * 16,
            y: player.y + player.h,
            vx: (Math.random() - 0.5) * 3.5,
            vy: Math.random() * -1.8,
            size: 3 + Math.random() * 3,
            color: '#a8a29e',
            alpha: 0.8,
            life: 0,
            maxLife: 16,
            type: 'dust',
          });
        }
      } else if (g.jumpBufferTimer > 0 && !player.isGrounded && g.coyoteTimer <= 0 && player.canDoubleJump) {
        // Double Jump!
        player.vy = -11.2;
        player.canDoubleJump = false;
        g.jumpBufferTimer = 0;
        g.squashStretch = { scaleX: 0.78, scaleY: 1.25 };
        gameAudio.playDoubleJump();

        // Air spin sparkles & expanding halo
        g.particles.push({
          x: player.x + player.w / 2,
          y: player.y + player.h - 8,
          vx: 0,
          vy: 0,
          size: 6,
          color: '#fde047',
          alpha: 0.9,
          life: 0,
          maxLife: 16,
          type: 'ring',
        });
        for (let i = 0; i < 7; i++) {
          g.particles.push({
            x: player.x + player.w / 2,
            y: player.y + player.h - 8,
            vx: (Math.random() - 0.5) * 4.5,
            vy: (Math.random() - 0.5) * 3.5,
            size: 2.5 + Math.random() * 2.5,
            color: '#fef08a',
            alpha: 1,
            life: 0,
            maxLife: 20,
            type: 'spark',
          });
        }
      }

      // Variable Jump Cut (Release jump button early for crisp short hop)
      if (!keys.upHeld && player.vy < -3.2) {
        player.vy *= 0.52;
      }

      // Apex Float Gravity & Snappy Fast-Fall Curve
      const apexMultiplier = getApexGravityMultiplier(player.vy);
      player.vy += 0.58 * apexMultiplier;
      if (player.vy > 14) player.vy = 14;

      // Peak Apex Agility: +14% aerial micro-control at the peak of the jump arc
      if (Math.abs(player.vy) < 2.2 && inputDir !== 0) {
        player.vx = Math.max(-7.4, Math.min(7.4, player.vx + inputDir * 0.18));
      }

      // Position snapshot for continuous swept collision integration
      const prevY = player.y;
      const prevVy = player.vy;

      // Move player horizontally
      player.x += player.vx;

      // Left boundary limit (can't go back further than camera)
      if (player.x < g.cameraX + 20) {
        player.x = g.cameraX + 20;
        player.vx = 0;
      }

      // Head-Bump Corner Nudging & Solid Platform Collisions (Broadphase X-Culling)
      const minCheckX = player.x - 40;
      const maxCheckX = player.x + player.w + 40;
      for (let bi = 0; bi < g.mysteryBlocks.length; bi++) {
        const block = g.mysteryBlocks[bi];
        if (block.x + block.w < minCheckX || block.x > maxCheckX) continue;
        // Corner correction when jumping up into block edge
        if (player.vy < 0 && prevY >= block.y + block.h - 12 && player.y <= block.y + block.h + 10) {
          const nudge = getHeadBumpCornerCorrection(
            { x: player.x, y: player.y, w: player.w, h: player.h },
            { x: block.x, y: block.y, w: block.w, h: block.h }
          );
          if (nudge !== 0) {
            player.x += nudge;
          }
        }

        if (
          player.x < block.x + block.w &&
          player.x + player.w > block.x &&
          player.y < block.y + block.h &&
          player.y + player.h > block.y
        ) {
          // Horizontal bump
          if (player.vx > 0) player.x = block.x - player.w;
          else if (player.vx < 0) player.x = block.x + block.w;
        }
      }

      // Spawn Dash & High-Speed Motion Trail Ghosts
      if ((keys.dash || player.graceTimer > 0 || hasWaterSurge) && Math.abs(player.vx) > 2.0) {
        if (Math.random() < 0.65) {
          g.ghostTrails.push({
            x: player.x,
            y: player.y,
            alpha: 0.55,
            scaleX: g.squashStretch.scaleX,
            scaleY: g.squashStretch.scaleY,
            facingRight: player.facingRight,
            isGrace: player.graceTimer > 0,
          });
        }
      }

      // Update & Fade Ghost Trails (In-place zero-allocation)
      let aliveGhostCount = 0;
      for (let gi = 0; gi < g.ghostTrails.length; gi++) {
        const t = g.ghostTrails[gi];
        t.alpha -= 0.055;
        if (t.alpha > 0) {
          g.ghostTrails[aliveGhostCount++] = t;
        }
      }
      g.ghostTrails.length = aliveGhostCount;

      // Move player vertically
      player.y += player.vy;
      player.isGrounded = false;

      // Platform Collisions (Continuous Swept-AABB Top Landing & Stepping with X-Culling)
      for (let pi = 0; pi < g.platforms.length; pi++) {
        const plat = g.platforms[pi];
        if (plat.isBroken || plat.x + plat.w < minCheckX || plat.x > maxCheckX) continue;
        const isWithinX = player.x + player.w * 0.7 > plat.x && player.x + player.w * 0.3 < plat.x + plat.w;
        if (isWithinX) {
          // Landing on top (Swept AABB: was above or near platform top edge and falling down)
          if (player.vy >= 0 && prevY + player.h <= plat.y + 12 && player.y + player.h >= plat.y) {
            // 1. Parisian Awning Springboard Canopy (High-altitude trampoline bounce)
            if (plat.type === 'awning') {
              player.y = plat.y - player.h - 2;
              player.vy = -14.8;
              player.isGrounded = false;
              player.canDoubleJump = true;
              g.squashStretch = { scaleX: 0.65, scaleY: 1.45 };
              gameAudio.playSpringBounce();
              triggerHaptic('medium');
              g.score += 80;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: plat.x + plat.w / 2,
                y: plat.y - 20,
                text: '🎪 巴黎雨棚大彈躍！+80',
                color: '#34d399',
                opacity: 1,
              });
              for (let i = 0; i < 6; i++) {
                g.particles.push({
                  x: plat.x + Math.random() * plat.w,
                  y: plat.y,
                  vx: (Math.random() - 0.5) * 3,
                  vy: -Math.random() * 2.5,
                  size: 3.5,
                  color: '#34d399',
                  alpha: 0.85,
                  life: 0,
                  maxLife: 16,
                  type: 'spark',
                });
              }
              return;
            }

            // 2. Crumbling Historic Stone Ledge
            if (plat.type === 'crumble') {
              plat.crumbleTimer = (plat.crumbleTimer || 0) + 1;
              if (plat.crumbleTimer === 1) {
                triggerHaptic('light');
              }
              if (plat.crumbleTimer > 28) {
                plat.isBroken = true;
                triggerHaptic('medium');
                gameAudio.playCrateBreak();
                for (let i = 0; i < 8; i++) {
                  g.particles.push({
                    x: plat.x + Math.random() * plat.w,
                    y: plat.y + Math.random() * plat.h,
                    vx: (Math.random() - 0.5) * 4,
                    vy: Math.random() * 3,
                    size: 4,
                    color: '#a8a29e',
                    alpha: 0.9,
                    life: 0,
                    maxLife: 20,
                    type: 'dust',
                  });
                }
              }
            }

            // 3. Water Rapids Current Stream
            if (plat.type === 'stream') {
              player.vx = Math.max(player.vx, 5.2);
              if (Math.random() > 0.45) {
                g.particles.push({
                  x: player.x + Math.random() * player.w,
                  y: plat.y + 4,
                  vx: 2.5 + Math.random() * 2,
                  vy: -Math.random() * 1.5,
                  size: 3,
                  color: '#38bdf8',
                  alpha: 0.8,
                  life: 0,
                  maxLife: 12,
                  type: 'spark',
                });
              }
            }

            // Check if player seamlessly plummeted from Street into Lower Sewer Canal!
            if (prevY < 340 && (plat.type === 'sewer' || plat.y >= 410)) {
              gameAudio.playSewerDive();
              g.particles.push({
                x: player.x + player.w / 2,
                y: plat.y,
                vx: 0,
                vy: 0,
                size: 8,
                color: '#34d399',
                alpha: 0.9,
                life: 0,
                maxLife: 20,
                type: 'ring',
              });
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x,
                y: player.y - 20,
                text: '💧 跌入暗道激流！脫離賈維爾追捕！',
                color: '#38bdf8',
                opacity: 1,
              });
            }

            player.y = plat.y - player.h;
            player.vy = 0;
            player.isGrounded = true;
            player.canDoubleJump = true;
          }
        }
      }

      // Wall Slide & Wall Jump Mechanics (壁面滑行與蹬牆跳躍 with X-Culling)
      let isTouchingWall = false;
      let wallDirection = 0; // -1: wall is on left, +1: wall is on right

      for (let wpi = 0; wpi < g.platforms.length; wpi++) {
        const plat = g.platforms[wpi];
        if (plat.type === 'scaffold' || plat.y > 450 || plat.x + plat.w < minCheckX || plat.x > maxCheckX) continue;
        const isVerticallyOverlapping = player.y + player.h > plat.y + 8 && player.y < plat.y + plat.h - 8;
        if (isVerticallyOverlapping) {
          // Touching left side of platform (wall is on player's right)
          if (Math.abs((player.x + player.w) - plat.x) < 6 && keys.right) {
            isTouchingWall = true;
            wallDirection = 1;
          }
          // Touching right side of platform (wall is on player's left)
          else if (Math.abs(player.x - (plat.x + plat.w)) < 6 && keys.left) {
            isTouchingWall = true;
            wallDirection = -1;
          }
        }
      }

      if (isTouchingWall && !player.isGrounded && player.vy > 0) {
        // Wall Slide: dampen gravity
        player.vy = Math.min(player.vy, 2.4);

        // Wall Jump trigger
        if (keys.up) {
          player.vy = -11.8;
          player.vx = -wallDirection * 6.5;
          player.canDoubleJump = true;
          gameAudio.playJump();
          g.floatingTexts.push({
            id: Date.now() + Math.random(),
            x: player.x,
            y: player.y - 18,
            text: '🧗 蹬牆飛躍！',
            color: '#38bdf8',
            opacity: 1,
          });
          // Wall jump dust puff
          g.particles.push({
            x: wallDirection === 1 ? player.x + player.w : player.x,
            y: player.y + player.h / 2,
            vx: -wallDirection * 2,
            vy: -1,
            size: 3.5,
            color: '#94a3b8',
            alpha: 0.8,
            life: 0,
            maxLife: 14,
            type: 'dust',
          });
        }
      }

      // Detect landing transition (Dynamic Impact Squash & Thud)
      if (!g.wasGrounded && player.isGrounded) {
        g.squashStretch = calculateLandingSquash(prevVy);

        if (prevVy > 9.5) {
          gameAudio.playLandingImpact();
          g.screenShake = Math.max(g.screenShake, 3.8);
        }

        // Landing dust puffs on both sides
        const particleCount = prevVy > 9.5 ? 8 : 4;
        for (let i = 0; i < particleCount; i++) {
          const dir = i % 2 === 0 ? 1 : -1;
          g.particles.push({
            x: player.x + player.w / 2 + dir * (4 + Math.random() * 8),
            y: player.y + player.h,
            vx: dir * (1.5 + Math.random() * (prevVy > 9.5 ? 3 : 1.8)),
            vy: -0.4 - Math.random() * 1.2,
            size: 3 + Math.random() * 3,
            color: '#d6d3d1',
            alpha: 0.75,
            life: 0,
            maxLife: 18,
            type: 'dust',
          });
        }
      }
      g.wasGrounded = player.isGrounded;

      // Smooth recovery for squash & stretch
      g.squashStretch.scaleX += (1 - g.squashStretch.scaleX) * 0.18;
      g.squashStretch.scaleY += (1 - g.squashStretch.scaleY) * 0.18;

      // Running dust/water trail on ground (clean, rate-limited, surface-aware)
      if (player.isGrounded && Math.abs(player.vx) > 1.8) {
        g.runDustTimer++;
        if (g.runDustTimer > (keys.dash ? 6 : 11)) {
          g.runDustTimer = 0;
          const isSewerWater = player.y >= 350;
          if (isSewerWater) {
            // Calm water ripple ring in sewer channel
            g.particles.push({
              x: player.x + player.w / 2,
              y: player.y + player.h,
              vx: 0,
              vy: 0,
              size: 2,
              color: '#34d399',
              alpha: 0.6,
              life: 0,
              maxLife: 14,
              type: 'ring',
            });
          } else {
            // Crisp cobblestone dust puff
            const dustX = player.facingRight ? player.x + 4 : player.x + player.w - 4;
            g.particles.push({
              x: dustX,
              y: player.y + player.h - 1,
              vx: (player.facingRight ? -1 : 1) * (0.6 + Math.random() * 0.8),
              vy: -0.3 - Math.random() * 0.5,
              size: 2 + Math.random() * 1.5,
              color: '#a8a29e',
              alpha: 0.5,
              life: 0,
              maxLife: 12,
              type: 'dust',
            });
          }
        }
      }

      // World Props Interaction & Collision (Lanterns, Flag Springs, Steam Vents, Crates, Kegs, Manholes)
      g.worldProps.forEach((prop) => {
        if (!prop.active) return;

        // 1. Vintage Street Lantern
        if (prop.type === 'lantern') {
          if (prop.sway && prop.sway > 0) {
            prop.sway *= 0.92;
            if (prop.sway < 0.02) prop.sway = 0;
          }
          // Player landing on top of lantern cage
          const isWithinX = player.x + player.w * 0.8 > prop.x && player.x + player.w * 0.2 < prop.x + prop.w;
          if (isWithinX && player.vy > 0 && player.y + player.h >= prop.y && player.y + player.h <= prop.y + 24) {
            player.vy = -12.8;
            player.isGrounded = false;
            player.canDoubleJump = true;
            prop.sway = 1.0;
            g.squashStretch = { scaleX: 0.75, scaleY: 1.35 };
            gameAudio.playSpringBounce();
            g.score += 50;
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: prop.x + prop.w / 2,
              y: prop.y - 18,
              text: '🏮 踩踏路燈躍起！+50',
              color: '#fde047',
              opacity: 1,
            });
            for (let i = 0; i < 5; i++) {
              g.particles.push({
                x: prop.x + prop.w / 2,
                y: prop.y + 12,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 2,
                size: 3,
                color: '#fde047',
                alpha: 0.9,
                life: 0,
                maxLife: 16,
                type: 'spark',
              });
            }
          }
        }

        // 2. Revolutionary Tricolor Flag Spring
        if (prop.type === 'flag_spring') {
          const isWithinX = player.x + player.w * 0.8 > prop.x && player.x + player.w * 0.2 < prop.x + prop.w;
          if (isWithinX && player.vy >= 0 && player.y + player.h >= prop.y && player.y + player.h <= prop.y + 22) {
            player.vy = -15.5; // Super spring bounce!
            player.isGrounded = false;
            player.canDoubleJump = true;
            g.squashStretch = { scaleX: 0.65, scaleY: 1.48 };
            gameAudio.playSpringBounce();
            g.score += 100;
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: prop.x + prop.w / 2,
              y: prop.y - 28,
              text: '🚩 革命街壘大彈跳！+100',
              color: '#60a5fa',
              opacity: 1,
            });
            const flagColors = ['#2563eb', '#ffffff', '#ef4444'];
            for (let i = 0; i < 9; i++) {
              g.particles.push({
                x: prop.x + prop.w / 2,
                y: prop.y,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3,
                size: 4,
                color: flagColors[i % 3],
                alpha: 0.9,
                life: 0,
                maxLife: 22,
                type: 'ring',
              });
            }
          }
        }

        // 3. High-Pressure Sewer Steam Vent (Emits only when on-screen to prevent stray particle accumulation)
        if (prop.type === 'steam_vent') {
          prop.timer = (prop.timer || 0) + 1;
          const isErupting = (prop.timer % 140) > 40; // 100 frames blast
          const isOnScreen = prop.x >= g.cameraX - 40 && prop.x <= g.cameraX + 760;

          if (isErupting) {
            // Rising focused column of steam (only when visible)
            if (isOnScreen && Math.random() > 0.55) {
              g.particles.push({
                x: prop.x + 6 + Math.random() * (prop.w - 12),
                y: prop.y - 2,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -3.8 - Math.random() * 1.6,
                size: 4 + Math.random() * 3,
                color: '#e2e8f0',
                alpha: 0.45,
                life: 0,
                maxLife: 18,
                type: 'dust',
              });
            }

            // Player caught in steam blast
            const inVentX = player.x + player.w > prop.x - 8 && player.x < prop.x + prop.w + 8;
            const inVentY = player.y + player.h >= prop.y - 145 && player.y + player.h <= prop.y + 12;
            if (inVentX && inVentY) {
              player.vy = Math.min(player.vy, -13.5); // Propels up to surface!
              player.isGrounded = false;
              player.canDoubleJump = true;
              player.vx = Math.max(player.vx, 4.5);
              if (prop.timer % 24 === 0) {
                gameAudio.playSteamVent();
              }
            }
          }
        }

        // Booby Crate Fuse Countdown & Local Detonation
        if (prop.type === 'booby_crate' && prop.isArmed && prop.fuseTimer !== undefined) {
          prop.fuseTimer--;
          if (prop.fuseTimer % 6 === 0) gameAudio.playFuseHiss();
          g.particles.push({
            x: prop.x + prop.w / 2,
            y: prop.y - 3,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2,
            size: 2.5,
            color: '#ef4444',
            alpha: 0.9,
            life: 0,
            maxLife: 10,
            type: 'spark',
          });
          if (prop.fuseTimer <= 0) {
            prop.active = false;
            gameAudio.playExplosion();
            g.screenShake = 9;
            for (let i = 0; i < 16; i++) {
              g.particles.push({
                x: prop.x + prop.w / 2,
                y: prop.y + prop.h / 2,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                size: 5,
                color: '#ef4444',
                alpha: 1,
                life: 0,
                maxLife: 20,
                type: 'spark',
              });
            }
            const pDist = Math.hypot(
              player.x + player.w / 2 - (prop.x + prop.w / 2),
              player.y + player.h / 2 - (prop.y + prop.h / 2)
            );
            if (pDist < 125 && player.invincibleFlash <= 0 && player.graceTimer <= 0) {
              if (g.hasCosetteShield) {
                g.hasCosetteShield = false;
                gameAudio.playShieldBreak();
                player.invincibleFlash = 80;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 20,
                  text: '🛡️ 珂賽特庇護抵擋了詭雷爆炸！',
                  color: '#f472b6',
                  opacity: 1,
                });
              } else if (checkBreadEmergencySalvation()) {
                // saved by bread emergency!
              } else {
                g.hearts -= 1;
                player.invincibleFlash = 90;
                gameAudio.playHurt();
                player.vy = -6;
                player.vx = player.x < prop.x ? -5 : 5;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 20,
                  text: '💥 踩中誘餌詭雷爆炸！-1❤️',
                  color: '#ef4444',
                  opacity: 1,
                });
                if (g.hearts <= 0) {
                  handleGameOver();
                  return;
                }
              }
            }
          }
        }

        // 4. Destructible & Interactive Crates (Wood, Iron Armory, Relic Chest, Damp Crate, Booby Crate)
        if (
          prop.type === 'crate' ||
          prop.type === 'iron_crate' ||
          prop.type === 'relic_chest' ||
          prop.type === 'damp_crate' ||
          prop.type === 'booby_crate'
        ) {
          const isWithinX = player.x + player.w * 0.7 > prop.x && player.x + player.w * 0.3 < prop.x + prop.w;
          // Stomp from top to break / interact
          if (isWithinX && player.vy > 0 && player.y + player.h >= prop.y && player.y + player.h <= prop.y + 20) {
            // Case A: Iron Armory Crate (Reinforced steel, 2 stomps)
            if (prop.type === 'iron_crate') {
              if (prop.durability === undefined || prop.durability > 1) {
                prop.durability = 1;
                gameAudio.playMetalClang();
                player.vy = -12.4; // Metallic super bounce!
                player.isGrounded = false;
                player.canDoubleJump = true;
                g.hitStopTimer = 4;
                g.screenShake = 5;
                g.score += 50;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: prop.x + prop.w / 2,
                  y: prop.y - 20,
                  text: '⚙️ 重裝鐵箱凹陷！[再踩1次或用彈弓貫穿！]',
                  color: '#94a3b8',
                  opacity: 1,
                });
                for (let i = 0; i < 8; i++) {
                  g.particles.push({
                    x: prop.x + prop.w / 2,
                    y: prop.y + 4,
                    vx: (Math.random() - 0.5) * 6,
                    vy: -Math.random() * 4,
                    size: 3,
                    color: '#e2e8f0',
                    alpha: 1,
                    life: 0,
                    maxLife: 15,
                    type: 'spark',
                  });
                }
              } else {
                prop.active = false;
                gameAudio.playArmorBreak();
                player.vy = -9.6;
                player.isGrounded = false;
                player.canDoubleJump = true;
                g.hitStopTimer = 5;
                g.screenShake = 7;
                g.score += 200;
                g.javertDist = Math.min(100, g.javertDist + 2.0);
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: prop.x + prop.w / 2,
                  y: prop.y - 20,
                  text: '💥 踏碎軍火鐵箱！獲得精銳軍備！+200',
                  color: '#38bdf8',
                  opacity: 1,
                });
                const dropType = Math.random() < 0.55 ? 'slingshot' : 'shield';
                g.collectibles.push({
                  x: prop.x + 4,
                  y: prop.y - 20,
                  w: 24,
                  h: 24,
                  type: dropType,
                  collected: false,
                  vy: -3.5,
                  initialY: prop.y - 20,
                });
                for (let i = 0; i < 10; i++) {
                  g.particles.push({
                    x: prop.x + prop.w / 2,
                    y: prop.y + prop.h / 2,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 4,
                    size: 4,
                    color: '#64748b',
                    alpha: 1,
                    life: 0,
                    maxLife: 20,
                    type: 'dust',
                  });
                }
              }
            }
            // Case B: Relic Chest (Bishop's Gilded Treasure)
            else if (prop.type === 'relic_chest') {
              prop.active = false;
              gameAudio.playChestOpen();
              player.vy = -10.2;
              player.isGrounded = false;
              player.canDoubleJump = true;
              g.hitStopTimer = 6;
              g.screenShake = 6;
              g.score += 500;
              g.javertDist = Math.min(100, g.javertDist + 3.0);
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 24,
                text: '✨ 開啟主教聖物寶箱！聖光降臨！+500',
                color: '#fde047',
                opacity: 1,
              });
              const relicLoot = g.hearts < 3 && Math.random() < 0.6 ? 'heart' : 'candlestick';
              g.collectibles.push({
                x: prop.x + 4,
                y: prop.y - 24,
                w: 24,
                h: 24,
                type: relicLoot,
                collected: false,
                vy: -4,
                initialY: prop.y - 24,
              });
              for (let i = 0; i < 14; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y + prop.h / 2,
                  vx: (Math.random() - 0.5) * 6,
                  vy: -Math.random() * 5,
                  size: 3.5,
                  color: '#fef08a',
                  alpha: 1,
                  life: 0,
                  maxLife: 25,
                  type: 'spark',
                });
              }
            }
            // Case C: Damp Sewer Cistern Crate
            else if (prop.type === 'damp_crate') {
              prop.active = false;
              gameAudio.playWaterSplash();
              player.vy = -9.2;
              player.isGrounded = false;
              player.canDoubleJump = true;
              g.score += 120;
              g.waterSurgeTimer = 300; // 5 seconds of water surge sprint speed boost!
              g.javertDist = Math.min(100, g.javertDist + 2.0);
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 18,
                text: '🌊 踏破青苔水箱！獲得【激流疾跑】加速！+120',
                color: '#38bdf8',
                opacity: 1,
              });
              g.collectibles.push({
                x: prop.x + 4,
                y: prop.y - 20,
                w: 24,
                h: 24,
                type: 'bread',
                collected: false,
                vy: -2.5,
                initialY: prop.y - 20,
              });
              for (let i = 0; i < 10; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y + prop.h / 2,
                  vx: (Math.random() - 0.5) * 5,
                  vy: -Math.random() * 4,
                  size: 3.5,
                  color: '#06b6d4',
                  alpha: 0.9,
                  life: 0,
                  maxLife: 18,
                  type: 'ring',
                });
              }
            }
            // Case D: Booby-trapped Hazard TNT Crate
            else if (prop.type === 'booby_crate') {
              if (!prop.isArmed) {
                prop.isArmed = true;
                prop.fuseTimer = 45; // 0.75s fuse
                gameAudio.playFuseHiss();
                player.vy = -10.5; // High launch to give player escape window!
                player.isGrounded = false;
                player.canDoubleJump = true;
                g.screenShake = 4;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: prop.x + prop.w / 2,
                  y: prop.y - 22,
                  text: '⚠️ 踩中誘餌炸藥！引信嘶嘶作響！快跳開！',
                  color: '#ef4444',
                  opacity: 1,
                });
              }
            }
            // Case E: Standard Wooden Crate
            else {
              prop.active = false;
              gameAudio.playCrateBreak();
              player.vy = -9.2;
              player.isGrounded = false;
              player.canDoubleJump = true;
              g.score += 80;
              g.javertDist = Math.min(100, g.javertDist + 1.5);
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 15,
                text: '📦 踩碎補給木箱！+80',
                color: '#d97706',
                opacity: 1,
              });
              const dropType = (g.slingshotAmmo <= 1 && Math.random() < 0.45)
                ? 'slingshot'
                : (Math.random() > 0.45 ? 'bread' : 'coin');
              g.collectibles.push({
                x: prop.x + 4,
                y: prop.y - 20,
                w: 24,
                h: 24,
                type: dropType,
                collected: false,
                vy: -2,
                initialY: prop.y - 20,
              });
              for (let i = 0; i < 6; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y + prop.h / 2,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 3,
                  size: 4,
                  color: '#78350f',
                  alpha: 0.85,
                  life: 0,
                  maxLife: 18,
                  type: 'dust',
                });
              }
            }
          } else if (
            player.x + player.w > prop.x &&
            player.x < prop.x + prop.w &&
            player.y + player.h > prop.y + 4 &&
            player.y < prop.y + prop.h
          ) {
            // Horizontal solid collision
            if (player.vx > 0) {
              player.x = prop.x - player.w;
              player.vx = 0;
            } else if (player.vx < 0) {
              player.x = prop.x + prop.w;
              player.vx = 0;
            }
          }
        }

        // 5. Powder Keg (Two-Way Interactive Hazard & Strategic Explosive)
        if (prop.type === 'powder_keg') {
          if (prop.fuseTimer !== undefined && prop.fuseTimer > 0) {
            prop.fuseTimer--;
            if (prop.fuseTimer % 6 === 0) {
              gameAudio.playFuseHiss();
            }
            // Fuse sparks
            g.particles.push({
              x: prop.x + prop.w / 2,
              y: prop.y - 4,
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 2,
              size: 2.5,
              color: '#f97316',
              alpha: 0.85,
              life: 0,
              maxLife: 10,
              type: 'spark',
            });

            if (prop.fuseTimer <= 0) {
              // Detonate!
              prop.active = false;
              gameAudio.playExplosion();
              g.screenShake = 9.5;
              g.hitStopTimer = 4;
              g.score += 500;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 30,
                text: '💥 火藥桶大爆炸！+500',
                color: '#ef4444',
                opacity: 1,
              });

              // Fiery Blast Shockwave Ring
              g.particles.push({
                x: prop.x + prop.w / 2,
                y: prop.y + prop.h / 2,
                vx: 0,
                vy: 0,
                size: 8,
                color: '#f97316',
                alpha: 0.95,
                life: 0,
                maxLife: 20,
                type: 'ring',
              });

              // 1. Blast Enemies within radius
              g.enemies.forEach((enemy) => {
                if (enemy.alive) {
                  const dist = Math.hypot(
                    enemy.x + enemy.w / 2 - (prop.x + prop.w / 2),
                    enemy.y + enemy.h / 2 - (prop.y + prop.h / 2)
                  );
                  if (dist < 145) {
                    enemy.alive = false;
                    enemy.squashTime = 25;
                    g.score += 350;
                    g.floatingTexts.push({
                      id: Date.now() + Math.random(),
                      x: enemy.x,
                      y: enemy.y - 20,
                      text: '💥 敵人被炸飛！+350',
                      color: '#facc15',
                      opacity: 1,
                    });
                  }
                }
              });

              // 2. Blast Handcuffs
              g.javertHandcuffs.forEach((hc) => {
                if (Math.hypot(hc.x - (prop.x + prop.w / 2), hc.y - (prop.y + prop.h / 2)) < 145) {
                  hc.life = 999;
                }
              });

              // 3. Chain Reaction: Detonate adjacent powder kegs, booby crates & open all crates
              g.worldProps.forEach((otherProp) => {
                if (!otherProp.active || otherProp === prop) return;
                const propDist = Math.hypot(
                  otherProp.x + otherProp.w / 2 - (prop.x + prop.w / 2),
                  otherProp.y + otherProp.h / 2 - (prop.y + prop.h / 2)
                );
                if (propDist < 145) {
                  if (otherProp.type === 'powder_keg') {
                    otherProp.fuseTimer = 2; // Chain reaction instant blast!
                  } else if (otherProp.type === 'booby_crate') {
                    otherProp.fuseTimer = 2;
                    otherProp.isArmed = true;
                  } else if (
                    otherProp.type === 'crate' ||
                    otherProp.type === 'iron_crate' ||
                    otherProp.type === 'relic_chest' ||
                    otherProp.type === 'damp_crate'
                  ) {
                    otherProp.active = false;
                    gameAudio.playCrateBreak();
                    const dropType =
                      otherProp.type === 'relic_chest'
                        ? 'candlestick'
                        : otherProp.type === 'iron_crate'
                        ? 'slingshot'
                        : Math.random() > 0.5
                        ? 'bread'
                        : 'coin';
                    g.collectibles.push({
                      x: otherProp.x + 4,
                      y: otherProp.y - 20,
                      w: 24,
                      h: 24,
                      type: dropType,
                      collected: false,
                      vy: -3,
                      initialY: otherProp.y - 20,
                    });
                  }
                }
              });

              // 4. Two-Way Hazard: Player Damage & Explosive Knockback
              const playerDist = Math.hypot(
                player.x + player.w / 2 - (prop.x + prop.w / 2),
                player.y + player.h / 2 - (prop.y + prop.h / 2)
              );
              if (playerDist < 135) {
                const blastDir = player.x + player.w / 2 < prop.x + prop.w / 2 ? -1 : 1;
                player.vx = blastDir * 7.5;
                player.vy = -7.2;
                player.isGrounded = false;
                player.canDoubleJump = true;

                if (player.graceTimer > 0) {
                  g.floatingTexts.push({
                    id: Date.now() + Math.random(),
                    x: player.x,
                    y: player.y - 25,
                    text: '🕯️ 聖光庇護！免疫火藥傷害！',
                    color: '#fef08a',
                    opacity: 1,
                  });
                } else if (g.hasCosetteShield) {
                  g.hasCosetteShield = false;
                  gameAudio.playShieldBreak();
                  player.invincibleFlash = 80;
                  g.floatingTexts.push({
                    id: Date.now() + Math.random(),
                    x: player.x,
                    y: player.y - 25,
                    text: '🛡️ 珂賽特的庇護抵擋了火藥傷害！',
                    color: '#f472b6',
                    opacity: 1,
                  });
                } else if (player.invincibleFlash <= 0) {
                  if (checkBreadEmergencySalvation()) {
                    // Saved by emergency white bread!
                  } else {
                    g.hearts -= 1;
                    player.invincibleFlash = 90;
                    gameAudio.playHurt();
                    g.floatingTexts.push({
                      id: Date.now() + Math.random(),
                      x: player.x,
                      y: player.y - 25,
                      text: '💥 被火藥波及炸飛！-1 ❤️',
                      color: '#ef4444',
                      opacity: 1,
                    });
                    if (g.hearts <= 0) {
                      handleGameOver();
                      return;
                    }
                  }
                }
              }
            }
          } else {
            // A. Player bumps into powder keg to light fuse
            const isPlayerTouching =
              player.x + player.w > prop.x &&
              player.x < prop.x + prop.w &&
              player.y + player.h > prop.y + 4 &&
              player.y < prop.y + prop.h;
            if (isPlayerTouching) {
              prop.fuseTimer = 65; // ~1.1 seconds fuse!
              gameAudio.playFuseHiss();
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 20,
                text: '🔥 引信點燃！快退開！',
                color: '#f97316',
                opacity: 1,
              });
            }

            // B. Enemy bumps into powder keg to light fuse (Two-way interaction!)
            g.enemies.forEach((enemy) => {
              if (!enemy.alive) return;
              const isEnemyTouching =
                enemy.x + enemy.w > prop.x &&
                enemy.x < prop.x + prop.w &&
                enemy.y + enemy.h > prop.y + 4 &&
                enemy.y < prop.y + prop.h;
              if (isEnemyTouching && (prop.fuseTimer === undefined || prop.fuseTimer <= 0)) {
                prop.fuseTimer = 65;
                enemy.vx *= -1; // Enemy turns in panic
                gameAudio.playFuseHiss();
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: enemy.x,
                  y: enemy.y - 25,
                  text: enemy.type === 'thenardier' ? '😈 泰納第：「哎呀！火藥桶！」' : '👮 憲兵：「危險！引信點燃了！」',
                  color: '#f97316',
                  opacity: 1,
                });
              }
            });
          }
        }

        // 6. Cast-Iron Manhole & Iron Ladder (雙層地圖：下水道穿梭與攀爬鐵梯)
        if (prop.type === 'manhole') {
          const isNearLadderX =
            player.x + player.w * 0.7 > prop.x - 6 &&
            player.x + player.w * 0.3 < prop.x + prop.w + 6;

          // A. 地面街頭 (y < 360) -> 按下 [S/↓] 順鐵梯下潛至下水道
          if (player.y < 350 && isNearLadderX && keys.down) {
            keys.down = false; // consume down key
            player.y = 366; // Enter sewer platform ledge
            player.vy = 2.0;
            player.isGrounded = false;
            gameAudio.playSewerDive();
            g.squashStretch = { scaleX: 0.8, scaleY: 1.3 };
            g.score += 150;
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: prop.x + prop.w / 2,
              y: prop.y + 20,
              text: '💧 順梯下潛進入巴黎暗道！賈維爾追捕暫停！+150',
              color: '#10b981',
              opacity: 1,
            });
            // Sewer green water splash particles
            for (let i = 0; i < 6; i++) {
              g.particles.push({
                x: prop.x + prop.w / 2,
                y: prop.y + 10,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2,
                size: 3.0,
                color: '#34d399',
                alpha: 0.85,
                life: 0,
                maxLife: 14,
                type: 'ring',
              });
            }
          }

          // B. 地下暗道 (y >= 350) -> 靠近鐵梯按 [W/↑] 攀爬回地面街頭
          else if (player.y >= 350 && isNearLadderX && keys.up) {
            keys.up = false; // consume up key
            keys.upHeld = false;

            // 檢查梯子頂部是否有憲兵埋伏！
            if (prop.hasAmbush && !prop.ambushDefeated) {
              if (g.hasCosetteShield) {
                g.hasCosetteShield = false;
                gameAudio.playShieldBreak();
                prop.hasAmbush = false;
                prop.ambushDefeated = true;
                player.invincibleFlash = 70;
                player.y = 312;
                player.vy = -3.5;
                player.isGrounded = true;
                g.hitStopTimer = 5;
                g.screenShake = 6;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: 280,
                  text: '🛡️ 珂賽特守護抵擋了井口埋伏！強登街頭！',
                  color: '#f472b6',
                  opacity: 1,
                });
              } else {
                g.hearts -= 1;
                player.invincibleFlash = 80;
                gameAudio.playHurt();
                prop.hasAmbush = false;
                prop.ambushDefeated = true;
                player.y = 312;
                player.vy = -3.0;
                player.isGrounded = true;
                g.hitStopTimer = 6;
                g.screenShake = 8;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: 280,
                  text: '⚠️ 遭遇井口埋伏突襲！-1❤️ (建議下次用彈弓暗算)',
                  color: '#ef4444',
                  opacity: 1,
                });
                if (g.hearts <= 0) {
                  handleGameOver();
                  return;
                }
              }
            } else {
              // 安全無埋伏或已被暗算擊暈
              player.y = 312;
              player.vy = -3.8;
              player.isGrounded = true;
              gameAudio.playJump();
              g.squashStretch = { scaleX: 0.85, scaleY: 1.2 };
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x,
                y: 280,
                text: '🧗 攀出暗道回到巴黎街頭！',
                color: '#38bdf8',
                opacity: 1,
              });
            }
          }
        }

        // 7. Emergency Sluice Valve Lever (下水道緊急洩洪閥門)
        if (prop.type === 'valve_lever') {
          const isTouchingLever =
            player.x + player.w > prop.x - 6 &&
            player.x < prop.x + prop.w + 6 &&
            player.y + player.h > prop.y - 8 &&
            player.y < prop.y + prop.h + 8;
          if (isTouchingLever && !g.dynamicEvent.valvePulled) {
            g.dynamicEvent.valvePulled = true;
            gameAudio.playValveOpen();
            g.score += 800;
            g.screenShake = 7;
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: prop.x + prop.w / 2,
              y: prop.y - 25,
              text: '⚙️ 成功拉開緊急洩洪閥門！鐵閘門升起！+800分！',
              color: '#38bdf8',
              opacity: 1,
            });
            // Open all active sluice gates
            g.worldProps.forEach((p) => {
              if (p.type === 'sluice_gate') {
                p.isOpening = true;
              }
            });
            // Steam burst particles
            for (let i = 0; i < 14; i++) {
              g.particles.push({
                x: prop.x + prop.w / 2,
                y: prop.y + prop.h / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 5,
                size: 4 + Math.random() * 3,
                color: '#e2e8f0',
                alpha: 0.9,
                life: 0,
                maxLife: 20,
                type: 'dust',
              });
            }
          }
        }

        // 8. Sluice Gate (下水道升降鐵閘門 - 圍困脫逃障礙)
        if (prop.type === 'sluice_gate') {
          if (prop.isOpening) {
            prop.gateHeight = (prop.gateHeight ?? 90) - 3.5;
            if (prop.gateHeight <= 0) {
              prop.active = false;
            }
          } else {
            prop.gateHeight = Math.min(90, (prop.gateHeight ?? 0) + 4.5);
            // Solid collision against player
            if (
              player.x + player.w > prop.x &&
              player.x < prop.x + prop.w &&
              player.y + player.h > prop.y &&
              player.y < prop.y + (prop.gateHeight ?? 90)
            ) {
              if (player.vx > 0 && player.x < prop.x) {
                player.x = prop.x - player.w;
                player.vx = 0;
              } else if (player.vx < 0 && player.x > prop.x) {
                player.x = prop.x + prop.w;
                player.vx = 0;
              }
            }
          }
        }
      });

      // Lower Sewer Water Current Speed Boost
      // Strict depth check: Only triggers when player is truly waded in lower sewer stream (y + h >= 416)
      const isWadingInSewerWater = player.y + player.h >= 416;
      if (isWadingInSewerWater) {
        if (keys.left) {
          // Wading upstream against the current (allows agile backtracking!)
          player.vx = Math.max(-2.8, player.vx - 0.25);
        } else if (keys.right || Math.abs(player.vx) < 0.5) {
          // Surging downstream with the sewer current
          player.vx = Math.min(Math.max(player.vx + 0.35, 3.8), 6.4);
        }
        // Subtle water ripple ring at water level (never wild spraying)
        if (Math.abs(player.vx) > 1.8 && Math.random() < 0.18) {
          g.particles.push({
            x: player.x + player.w / 2,
            y: 438,
            vx: 0,
            vy: 0,
            size: 2.0,
            color: '#34d399',
            alpha: 0.5,
            life: 0,
            maxLife: 16,
            type: 'ring',
          });
        }
      }

      // Helper: Trigger Mystery Block (from Head-butt, Slingshot pebble, or Melee Attack)
      const triggerMysteryBlock = (block: MysteryBlock, fromPebble = false) => {
        if (block.hit) return;
        block.hit = true;
        block.bounceOffset = -10;
        g.hitStopTimer = 3;
        g.screenShake = 3.5;
        gameAudio.playBlockHit();

        // Block bump sparks
        for (let i = 0; i < 6; i++) {
          g.particles.push({
            x: block.x + block.w / 2 + (Math.random() - 0.5) * 20,
            y: block.y + (fromPebble ? block.h / 2 : block.h),
            vx: (Math.random() - 0.5) * 3,
            vy: fromPebble ? (Math.random() - 0.5) * 3 : Math.random() * 2.5,
            size: 3,
            color: '#fbbf24',
            alpha: 0.9,
            life: 0,
            maxLife: 15,
            type: 'spark',
          });
        }

        // Mimic Check: Thénardier Thief Ambush!
        if (block.isMimic) {
          gameAudio.playMimicLaugh();
          const stolen = fromPebble ? 0 : Math.min(g.breadCount, 8);
          if (stolen > 0) {
            g.breadCount -= stolen;
          }
          g.screenShake = 6.0;

          // Spawn fleeing Thénardier Thief
          g.enemies.push({
            x: block.x + (player.facingRight ? 30 : -30),
            y: block.y - 12,
            w: 34,
            h: 44,
            vx: (player.facingRight ? 1 : -1) * 4.6,
            minX: block.x - 200,
            maxX: block.x + 850,
            alive: true,
            squashTime: 0,
            type: 'thenardier',
            stolenBread: stolen,
            isMimicThief: true,
            fleeTimer: 210, // 3.5s window to chase down
          });

          g.floatingTexts.push({
            id: Date.now() + Math.random(),
            x: block.x,
            y: block.y - 30,
            text: fromPebble
              ? '🎯 遠程識破泰納第偽裝！小偷現形！快擊倒他！'
              : stolen > 0
              ? `😈 泰納第偽裝偷襲！搶走 ${stolen} 🥖！按[X/J]追討！`
              : '😈 泰納第偽裝箱！「哼，兩手空空！」按[X/J]追討！',
            color: '#f97316',
            opacity: 1,
          });
        } else {
          // Spawn reward
          if (block.content === 'candlestick') {
            g.score += 600;
            g.candlestickCount += 1;
            player.graceTimer = 60 * 10; // 10 seconds of divine Grace & full magnetic suction
            if (g.hearts < 3) {
              g.hearts += 1;
            }
            g.javertDist = Math.min(100, g.javertDist + 20); // Divine radiance pushes Javert back +20m
            gameAudio.playCandlestick();

            // Golden Divine Radiance Sparks
            for (let i = 0; i < 16; i++) {
              g.particles.push({
                x: block.x + block.w / 2,
                y: block.y + block.h / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                size: 4 + Math.random() * 3,
                color: '#fef08a',
                alpha: 1,
                life: 0,
                maxLife: 24,
                type: 'spark',
              });
            }

            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: block.x,
              y: block.y - 25,
              text: '🕯️ 米里哀主教聖物銀燭台！聖光救贖+1❤️ 擊退賈維爾+20m 聖光無敵！',
              color: '#fef08a',
              opacity: 1,
            });
          } else if (block.content === 'bread') {
            g.score += 100;
            g.breadCount += 1;
            gameAudio.playCollectBread();
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: block.x,
              y: block.y - 20,
              text: '🥖 +100 白麵包',
              color: '#fed7aa',
              opacity: 1,
            });
          } else if (block.content === 'heart') {
            if (g.hearts < 3) g.hearts += 1;
            g.score += 250;
            gameAudio.playCollectBread();
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: block.x,
              y: block.y - 20,
              text: '❤️ +1 生命愛心 [救贖痊癒]',
              color: '#f87171',
              opacity: 1,
            });
          } else if (block.content === 'slingshot') {
            g.slingshotAmmo += 5;
            g.score += 150;
            gameAudio.playCollectBread();
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: block.x,
              y: block.y - 20,
              text: '🪨 +5 加夫洛許石子袋！[按X/K投擲]',
              color: '#38bdf8',
              opacity: 1,
            });
          } else if (block.content === 'shield') {
            g.hasCosetteShield = true;
            g.score += 250;
            gameAudio.playCollectBread();
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: block.x,
              y: block.y - 20,
              text: '🛡️ 珂賽特的誓約守護！[免疫1次致命傷害]',
              color: '#f472b6',
              opacity: 1,
            });
          }
        }
      };

      // Slingshot Pebble Throw (Gavroche's pebble)
      if (keys.throw && g.slingshotAmmo > 0) {
        keys.throw = false;
        g.slingshotAmmo--;
        gameAudio.playThrow();
        const dir = player.facingRight ? 1 : -1;
        const isHolyPebble = player.graceTimer > 0;
        g.slingshotPebbles.push({
          id: Date.now() + Math.random(),
          x: player.x + (player.facingRight ? player.w + 4 : -8),
          y: player.y + player.h * 0.45,
          vx: dir * (isHolyPebble ? 14 : 11),
          vy: -1.8,
          radius: isHolyPebble ? 6.5 : 5,
          life: 0,
          isHoly: isHolyPebble,
        });

        if (isHolyPebble) {
          gameAudio.playCandlestickShimmer();
          g.floatingTexts.push({
            id: Date.now() + Math.random(),
            x: player.x,
            y: player.y - 20,
            text: '✨ 祝聖光彈！[HOLY SHOT]',
            color: '#fef08a',
            opacity: 1,
          });
        }

        // Launch dust puff
        for (let i = 0; i < 3; i++) {
          g.particles.push({
            x: player.x + (player.facingRight ? player.w : 0),
            y: player.y + player.h * 0.5,
            vx: -dir * (1 + Math.random() * 1.5),
            vy: (Math.random() - 0.5) * 1.5,
            size: 2.5,
            color: isHolyPebble ? '#fef08a' : '#fbbf24',
            alpha: 0.9,
            life: 0,
            maxLife: 10,
            type: 'dust',
          });
        }
      }

      // -------------------------------------------------------------
      // 2026 Deep Character Synergy & Integrated Combat State Machine
      // -------------------------------------------------------------
      // 1. Animation Recovery Canceling (Dead Cells Spec): Roll or Jump immediately terminates recovery
      if ((keys.dash || g.jumpBufferTimer > 0) && player.attackActiveTimer <= 0 && player.attackTotalTimer > 0) {
        player.attackTotalTimer = 0;
        player.isHelmSplitter = false;
      }

      // 2. Combo Chain Buffer Window Decay
      if (player.comboChainTimer > 0) {
        player.comboChainTimer--;
        if (player.comboChainTimer === 0) {
          player.comboStage = 0;
        }
      }
      if (player.attackTotalTimer > 0) {
        player.attackTotalTimer--;
      }

      // 3. Attack Trigger with Deep Mechanics Fusion
      if (keys.attack) {
        keys.attack = false;

        // Synergy A: Sewer Uppercut (破井升龍斬) - when near manhole ladder or jumping out
        if (keys.up || g.jumpBufferTimer > 0 || (player.y > 360 && player.vy < 0)) {
          // Check if near any manhole prop
          const nearManhole = g.worldProps.find((p) => p.type === 'manhole' && Math.abs(player.x - (p.x + p.w / 2)) < 50);
          if (nearManhole && nearManhole.hasAmbush && !nearManhole.ambushDefeated) {
            nearManhole.hasAmbush = false;
            nearManhole.ambushDefeated = true;
            player.vy = -12.5;
            player.canDoubleJump = true;
            g.score += 400;
            g.hitStopTimer = 4;
            g.screenShake = 6.0;
            gameAudio.playStomp();
            gameAudio.playWaterSplash();
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: nearManhole.x + nearManhole.w / 2,
              y: nearManhole.y - 35,
              text: '🌊 破井升龍斬！擊潰井口伏兵！+400',
              color: '#38bdf8',
              opacity: 1,
            });
            for (let i = 0; i < 12; i++) {
              g.particles.push({
                x: player.x + player.w / 2,
                y: player.y + player.h,
                vx: (Math.random() - 0.5) * 6,
                vy: -3 - Math.random() * 5,
                size: 3.5,
                color: '#38bdf8',
                alpha: 1,
                life: 0,
                maxLife: 20,
                type: 'spark',
              });
            }
          }
        }

        if (player.attackActiveTimer <= 0) {
          // Synergy B: Dash-Slash / Phantom Dash Thrust (疾風突進斬)
          const isSprintThrust = keys.dash || Math.abs(player.vx) > 4.2;
          if (isSprintThrust) {
            player.vx = (player.facingRight ? 1 : -1) * 8.6;
            player.invincibleFlash = 12; // 12-frame i-frame dash window
            player.comboStage = 2;
            player.comboChainTimer = 30;
            player.attackTotalTimer = 20;
            player.attackActiveTimer = 12;
            gameAudio.playComboSlash(2, false);
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: player.x + player.w / 2,
              y: player.y - 20,
              text: '⚡ 疾風突進斬！[DASH SLASH 🗡️]',
              color: '#38bdf8',
              opacity: 1,
            });
            // Spawn ghost motion trail silhouettes
            for (let i = 0; i < 3; i++) {
              g.ghostTrails.push({
                x: player.x - (player.facingRight ? i * 18 : -i * 18),
                y: player.y,
                alpha: 0.8 - i * 0.22,
                scaleX: player.facingRight ? 1 : -1,
                scaleY: 1,
                facingRight: player.facingRight,
                isGrace: player.graceTimer > 0,
              });
            }
          } else {
            // Standard 3-Stage Combo State Progression
            if (player.comboChainTimer > 0) {
              player.comboStage = (player.comboStage % 3) + 1;
            } else {
              player.comboStage = 1;
            }
            player.comboChainTimer = 28; // Chain buffering window (~460ms)

            // Airborne Stage 3: Downward Helm Splitter Override!
            if (player.comboStage === 3 && !player.isGrounded) {
              player.isHelmSplitter = true;
              player.vy = 12.0; // Rapid downward plunge multiplier for guaranteed Stomp
              player.attackTotalTimer = 26;
              player.attackActiveTimer = 20;
              g.screenShake = 4.5;
              gameAudio.playComboSlash(3, true);
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x + player.w / 2,
                y: player.y - 20,
                text: '⚔️ 空中下墜斬！[HELM SPLITTER ⚡]',
                color: '#facc15',
                opacity: 1,
              });
              for (let i = 0; i < 8; i++) {
                g.particles.push({
                  x: player.x + player.w / 2 + (Math.random() - 0.5) * 16,
                  y: player.y - 5,
                  vx: (Math.random() - 0.5) * 2,
                  vy: -4 - Math.random() * 4,
                  size: 3,
                  color: '#fef08a',
                  alpha: 1,
                  life: 0,
                  maxLife: 16,
                  type: 'spark',
                });
              }
            } else if (player.comboStage === 3) {
              // Ground Stage 3 Heavy Finisher
              player.isHelmSplitter = false;
              player.attackTotalTimer = 24;
              player.attackActiveTimer = 10;
              player.vx = (player.facingRight ? 1 : -1) * 3.8;
              g.screenShake = 5.0;
              gameAudio.playComboSlash(3, false);
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x + player.w / 2,
                y: player.y - 20,
                text: player.graceTimer > 0 ? '🕯️ 聖炎終結斬！[HOLY FINISHER ✨]' : '⚔️ 終結重斬！[FINISHER 💥]',
                color: '#fbbf24',
                opacity: 1,
              });
            } else if (player.comboStage === 2) {
              // Stage 2 Sweeping Enabler
              player.isHelmSplitter = false;
              player.attackTotalTimer = 18;
              player.attackActiveTimer = 8;
              player.vx = (player.facingRight ? 1 : -1) * 2.4;
              gameAudio.playComboSlash(2, false);
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x + player.w / 2,
                y: player.y - 20,
                text: '🗡️ 連擊 x2！',
                color: '#fde047',
                opacity: 1,
              });
            } else {
              // Stage 1 Fast Horizontal Sweep
              player.isHelmSplitter = false;
              player.attackTotalTimer = 15;
              player.attackActiveTimer = 7;
              player.vx = (player.facingRight ? 1 : -1) * 1.8;
              gameAudio.playComboSlash(1, false);
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x + player.w / 2,
                y: player.y - 20,
                text: '🗡️ 斬擊 x1！',
                color: '#fef08a',
                opacity: 1,
              });
            }
          }

          // Synergy C: Kinetic Deflection of flying Pebble (刀劈流星彈)
          const slashDir = player.facingRight ? 1 : -1;
          const slashZoneX = player.x + (player.facingRight ? player.w : -30);
          g.slingshotPebbles.forEach((pebble) => {
            if (!pebble.isEmpowered && Math.abs(pebble.x - slashZoneX) < 45 && Math.abs(pebble.y - (player.y + player.h / 2)) < 40) {
              pebble.isEmpowered = true;
              pebble.vx = slashDir * 24; // Ultra velocity!
              pebble.vy = 0; // Laser straight trajectory
              pebble.radius = 7.5;
              pebble.pierceCount = 6;
              g.hitStopTimer = 3;
              g.screenShake = 6.0;
              gameAudio.playComboSlash(3, false);
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: pebble.x,
                y: pebble.y - 25,
                text: '⚡ 刀劈流星彈！[KINETIC DEFLECTION 💥]',
                color: '#f97316',
                opacity: 1,
              });
              for (let i = 0; i < 12; i++) {
                g.particles.push({
                  x: pebble.x,
                  y: pebble.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  size: 4,
                  color: '#f97316',
                  alpha: 1,
                  life: 0,
                  maxLife: 20,
                  type: 'spark',
                });
              }
            }
          });
        }
      }

      // Helm Splitter Landing Shockwave
      if (player.isHelmSplitter && player.isGrounded) {
        player.isHelmSplitter = false;
        g.hitStopTimer = 3;
        g.screenShake = 6.0;
        gameAudio.playLandingImpact();
        for (let i = 0; i < 2; i++) {
          g.particles.push({
            x: player.x + player.w / 2,
            y: player.y + player.h - 2,
            vx: 0,
            vy: 0,
            size: 14 + i * 8,
            color: '#fef08a',
            alpha: 0.9,
            life: 0,
            maxLife: 16,
            type: 'ring',
          });
        }
      }

      // 4. Melee Hitbox Calculation & Collision with Enemies / Blocks / Props
      if (player.attackActiveTimer > 0) {
        player.attackActiveTimer--;
        const atkDir = player.facingRight ? 1 : -1;
        const isHolyImbued = player.graceTimer > 0;
        const hitboxW = player.isHelmSplitter ? 52 : player.comboStage === 3 ? (isHolyImbued ? 96 : 68) : player.comboStage === 2 ? 56 : 48;
        const hitboxH = player.isHelmSplitter ? 56 : (isHolyImbued ? 64 : 48);
        const hitboxX = player.isHelmSplitter
          ? player.x - 8
          : player.facingRight
          ? player.x + player.w - 4
          : player.x - hitboxW + 4;
        const hitboxY = player.isHelmSplitter ? player.y + 12 : player.y + 4;

        // Hit Enemies
        g.enemies.forEach((enemy) => {
          if (!enemy.alive) return;
          const hit =
            hitboxX < enemy.x + enemy.w &&
            hitboxX + hitboxW > enemy.x &&
            hitboxY < enemy.y + enemy.h &&
            hitboxY + hitboxH > enemy.y;

          if (hit) {
            const isFinisher = player.comboStage === 3 || player.isHelmSplitter || isHolyImbued;
            if (isFinisher) {
              g.hitStopTimer = 3; // 3-frame hit-stop upon heavy collision
              g.screenShake = 6.0;
            } else {
              g.hitStopTimer = 1;
            }

            // Elite Sergeant Armor Break or Knockback
            if (enemy.type === 'elite_sergeant' && (enemy.hp ?? 2) > 1 && !isFinisher) {
              enemy.vx = atkDir * 2.2;
              enemy.staggerTimer = 16;
              gameAudio.playMetalClang();
              return;
            }

            enemy.alive = false;
            enemy.squashTime = 18;
            gameAudio.playStomp();

            // Slash sparks
            for (let i = 0; i < 10; i++) {
              g.particles.push({
                x: enemy.x + enemy.w / 2,
                y: enemy.y + enemy.h / 2,
                vx: atkDir * (2 + Math.random() * 4) + (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 4,
                size: 3.5,
                color: isFinisher ? '#fef08a' : '#f59e0b',
                alpha: 1,
                life: 0,
                maxLife: 18,
                type: 'spark',
              });
            }

            if (enemy.type === 'elite_sergeant') {
              g.score += 650;
              g.breadCount += 3;
              g.slingshotAmmo += 1;
              confetti({ particleCount: 22, spread: 55, origin: { y: 0.6 } });
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 25,
                text: '⚔️ 斬破精銳隊長！(+3🥖 +1🪨) +650分',
                color: '#fbbf24',
                opacity: 1,
              });
            } else if (enemy.type === 'grenadier') {
              g.score += 450;
              g.slingshotAmmo += 2;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 25,
                text: '🎯 斬殺擲彈兵！截獲彈藥(+2🪨) +450分',
                color: '#34d399',
                opacity: 1,
              });
            } else if (enemy.isMimicThief) {
              const recovered = Math.max(10, (enemy.stolenBread || 4) * 2);
              g.breadCount += recovered;
              g.score += 1000;
              confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 30,
                text: `🎯 成功斬制泰納第！奪回雙倍麵包 (+${recovered}🥖)！+1000分！`,
                color: '#facc15',
                opacity: 1,
              });
            } else {
              g.score += 280;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 20,
                text: '⚔️ 擊退憲兵！+280',
                color: '#60a5fa',
                opacity: 1,
              });
            }
          }
        });

        // Hit Mystery Blocks
        g.mysteryBlocks.forEach((block) => {
          if (!block.hit && hitboxX < block.x + block.w && hitboxX + hitboxW > block.x && hitboxY < block.y + block.h && hitboxY + hitboxH > block.y) {
            triggerMysteryBlock(block, true);
          }
        });
      }

      // Mystery Blocks Collision (Swept Landing on top OR Head-butt from underneath)
      g.mysteryBlocks.forEach((block) => {
        const isWithinX = player.x + player.w > block.x + 2 && player.x < block.x + block.w - 2;

        // 1. Landing on top of mystery block
        if (isWithinX && player.vy >= 0 && prevY + player.h <= block.y + 12 && player.y + player.h >= block.y) {
          player.y = block.y - player.h;
          player.vy = 0;
          player.isGrounded = true;
          player.canDoubleJump = true;
        }
        // 2. Head hit from below (Mario style head-butt)
        else if (isWithinX && player.vy < 0 && prevY >= block.y + block.h - 10 && player.y <= block.y + block.h + 12) {
          player.y = block.y + block.h;
          player.vy = 2.5; // Bounce down
          triggerMysteryBlock(block, false);
        }
        // 3. Side bump
        else if (
          player.y + player.h > block.y + 4 &&
          player.y < block.y + block.h - 4 &&
          player.x + player.w > block.x &&
          player.x < block.x + block.w
        ) {
          if (player.vx > 0) player.x = block.x - player.w;
          else if (player.vx < 0) player.x = block.x + block.w;
        }
      });

      // Animate block bounces back down
      g.mysteryBlocks.forEach((b) => {
        if (b.bounceOffset < 0) {
          b.bounceOffset += 1.5;
          if (b.bounceOffset > 0) b.bounceOffset = 0;
        }
      });

      // Bishop's Grace Magnetic Suction for Collectibles
      if (player.graceTimer > 0) {
        g.collectibles.forEach((item) => {
          if (!item.collected) {
            const dx = player.x + player.w / 2 - (item.x + item.w / 2);
            const dy = player.y + player.h / 2 - (item.y + item.h / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 260 && dist > 1) {
              item.x += (dx / dist) * 6.5;
              item.y += (dy / dist) * 6.5;
            }
          }
        });
      }

      // Check Collectibles
      g.collectibles.forEach((item) => {
        if (!item.collected) {
          const distSq =
            (player.x + player.w / 2 - (item.x + item.w / 2)) ** 2 +
            (player.y + player.h / 2 - (item.y + item.h / 2)) ** 2;

          if (distSq < 32 * 32) {
            item.collected = true;
            if (item.type === 'bread') {
              g.score += 100;
              g.breadCount += 1;
              g.consecutiveBread = (g.consecutiveBread || 0) + 1;
              if (g.consecutiveBread >= 4) {
                g.consecutiveBread = 0;
                g.citizenSupportTimer = 360; // 6 seconds uprising barrier!
                g.javertDist = Math.min(100, g.javertDist + 25); // Push Javert back 25m!
                gameAudio.playCitizenCheer();
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 35,
                  text: '🚩 巴黎市民起義掩護！賈維爾被阻擋！+25m',
                  color: '#ef4444',
                  opacity: 1,
                });
              } else {
                gameAudio.playCollectBread();
              }
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: item.x,
                y: item.y - 10,
                text: '+100 🥖',
                color: '#fbbf24',
                opacity: 1,
              });
            } else if (item.type === 'coin') {
              g.score += 50;
              gameAudio.playCollectBread();
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: item.x,
                y: item.y - 10,
                text: '+50 🪙',
                color: '#fde047',
                opacity: 1,
              });
            } else if (item.type === 'slingshot') {
              g.slingshotAmmo += 3;
              g.score += 100;
              gameAudio.playCollectBread();
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: item.x,
                y: item.y - 10,
                text: '+3 🪨 石子',
                color: '#38bdf8',
                opacity: 1,
              });
            } else if (item.type === 'shield') {
              g.hasCosetteShield = true;
              g.score += 200;
              gameAudio.playCollectBread();
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: item.x,
                y: item.y - 10,
                text: '🛡️ 珂賽特守護護盾',
                color: '#f472b6',
                opacity: 1,
              });
            } else if (item.type === 'candlestick') {
              g.score += 600;
              g.candlestickCount += 1;
              player.graceTimer = 60 * 10; // 10s divine Grace & magnetic field
              if (g.hearts < 3) {
                g.hearts += 1;
              }
              g.javertDist = Math.min(100, g.javertDist + 20); // Repels Javert +20m
              gameAudio.playCandlestick();

              for (let i = 0; i < 14; i++) {
                g.particles.push({
                  x: item.x + item.w / 2,
                  y: item.y + item.h / 2,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 5,
                  size: 3.5,
                  color: '#fef08a',
                  alpha: 1,
                  life: 0,
                  maxLife: 20,
                  type: 'spark',
                });
              }

              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: item.x,
                y: item.y - 15,
                text: '🕯️ 主教銀燭台！聖光救贖+1❤️ 擊退賈維爾+20m！',
                color: '#fef08a',
                opacity: 1,
              });
            } else if (item.type === 'heart') {
              if (g.hearts < 3) g.hearts += 1;
              g.score += 250;
              gameAudio.playCollectBread();
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: item.x,
                y: item.y - 10,
                text: '❤️ +1 生命愛心',
                color: '#f87171',
                opacity: 1,
              });
            }
          }
        }
      });

      // Update Gavroche's Slingshot Pebbles
      g.slingshotPebbles.forEach((pebble) => {
        pebble.x += pebble.vx;
        pebble.y += pebble.vy;
        pebble.vy += 0.12; // slight gravity
        pebble.life++;

        // Spark trail
        if (pebble.life % 2 === 0) {
          g.particles.push({
            x: pebble.x,
            y: pebble.y,
            vx: -pebble.vx * 0.1,
            vy: (Math.random() - 0.5) * 1.5,
            size: 2,
            color: '#fde047',
            alpha: 0.8,
            life: 0,
            maxLife: 8,
            type: 'spark',
          });
        }

        // Collide pebble with enemies (Counter-attack on Thénardier, Gendarmes, Elite & Grenadiers!)
        g.enemies.forEach((enemy) => {
          if (!enemy.alive) return;
          if (
            pebble.x > enemy.x &&
            pebble.x < enemy.x + enemy.w &&
            pebble.y > enemy.y &&
            pebble.y < enemy.y + enemy.h
          ) {
            pebble.life = 999; // destroy pebble

            // Elite Sergeant Frontal Shield Block check
            if (enemy.type === 'elite_sergeant' && (enemy.hp ?? 2) > 1) {
              const isFrontalHit = (enemy.vx > 0 && pebble.vx < 0) || (enemy.vx < 0 && pebble.vx > 0);
              if (isFrontalHit) {
                gameAudio.playHandcuffClink();
                g.hitStopTimer = 3;
                g.screenShake = 3;
                // Shield deflection sparks
                for (let i = 0; i < 6; i++) {
                  g.particles.push({
                    x: pebble.x,
                    y: pebble.y,
                    vx: -pebble.vx * 0.3 + (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    size: 3,
                    color: '#cbd5e1',
                    alpha: 1,
                    life: 0,
                    maxLife: 12,
                    type: 'spark',
                  });
                }
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: enemy.x,
                  y: enemy.y - 28,
                  text: '🛡️ 正面重盾格擋！繞至背後射擊或踩頭破甲！',
                  color: '#94a3b8',
                  opacity: 1,
                });
                return;
              }

              // Hit from behind! Armor Cracked!
              enemy.hp = 1;
              enemy.staggerTimer = 35;
              enemy.vx *= 1.35;
              gameAudio.playArmorBreak();
              g.hitStopTimer = 5;
              g.screenShake = 6;
              // Armor shard sparks
              for (let i = 0; i < 9; i++) {
                g.particles.push({
                  x: enemy.x + enemy.w / 2,
                  y: enemy.y + 16,
                  vx: (Math.random() - 0.5) * 5,
                  vy: -Math.random() * 4,
                  size: 3.5,
                  color: '#fbbf24',
                  alpha: 1,
                  life: 0,
                  maxLife: 18,
                  type: 'spark',
                });
              }
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 28,
                text: '🛡️ 繞後彈弓破甲！精銳隊長狂暴！再擊一次！',
                color: '#f59e0b',
                opacity: 1,
              });
              return;
            }

            enemy.alive = false;
            enemy.squashTime = 20;
            g.hitStopTimer = 4;
            g.screenShake = 5;
            gameAudio.playStomp();

            if (enemy.type === 'elite_sergeant') {
              g.score += 600;
              g.breadCount += 3;
              g.slingshotAmmo += 1;
              confetti({ particleCount: 22, spread: 55, origin: { y: 0.6 } });
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 30,
                text: '⚔️ 彈弓擊斃精銳隊長！獲得物資(+3🥖 +1🪨)！+600',
                color: '#fbbf24',
                opacity: 1,
              });
            } else if (enemy.type === 'grenadier') {
              g.score += 400;
              g.slingshotAmmo += 2;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 25,
                text: '🎯 狙擊擲彈兵！截獲彈藥(+2🪨)！+400',
                color: '#34d399',
                opacity: 1,
              });
            } else if (enemy.isMimicThief) {
              const recovered = Math.max(10, (enemy.stolenBread || 4) * 2);
              g.breadCount += recovered;
              g.score += 1000;
              confetti({ particleCount: 25, spread: 50, origin: { y: 0.6 } });
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 30,
                text: `🎯 成功制伏泰納第！奪回雙倍麵包 (+${recovered}🥖)！+1000分！`,
                color: '#facc15',
                opacity: 1,
              });
            } else if (enemy.type === 'thenardier') {
              const recovered = enemy.stolenBread || 0;
              g.breadCount += recovered;
              g.score += 500;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 25,
                text: recovered > 0 ? `🎯 擊中泰納第！奪回 ${recovered} 麵包！+500` : '🎯 擊退泰納第！+500',
                color: '#facc15',
                opacity: 1,
              });
            } else {
              g.score += 250;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 20,
                text: '🎯 擊退憲兵！+250',
                color: '#60a5fa',
                opacity: 1,
              });
            }
          }
        });

        // Collide pebble with Enemy Projectiles (Tear Gas canisters in mid-air!)
        g.enemyProjectiles.forEach((proj) => {
          const dSq = (pebble.x - proj.x) ** 2 + (pebble.y - proj.y) ** 2;
          if (dSq < 24 * 24) {
            proj.life = 999;
            pebble.life = 999;
            g.score += 180;
            gameAudio.playExplosion();
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: proj.x,
              y: proj.y - 18,
              text: '🎯 凌空狙爆毒氣罐！+180',
              color: '#38bdf8',
              opacity: 1,
            });
          }
        });

        // Collide pebble with Javert's Handcuffs (shoot them down!)
        g.javertHandcuffs.forEach((hc) => {
          const dSq = (pebble.x - hc.x) ** 2 + (pebble.y - hc.y) ** 2;
          if (dSq < 24 * 24) {
            hc.life = 999;
            pebble.life = 999;
            g.score += 150;
            gameAudio.playHandcuffClink();
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: hc.x,
              y: hc.y - 15,
              text: '💥 擊碎手銬！+150',
              color: '#38bdf8',
              opacity: 1,
            });
          }
        });

        // Collide pebble with Mystery Blocks (trigger unhit blocks remotely!)
        g.mysteryBlocks.forEach((block) => {
          if (!block.hit && pebble.x > block.x && pebble.x < block.x + block.w && pebble.y > block.y && pebble.y < block.y + block.h) {
            pebble.life = 999; // destroy pebble
            triggerMysteryBlock(block, true);
          }
        });

        // Collide pebble with World Props (Explosive Powder Kegs & Crates)
        g.worldProps.forEach((prop) => {
          if (!prop.active) return;
          const hitProp =
            pebble.x > prop.x &&
            pebble.x < prop.x + prop.w &&
            pebble.y > prop.y &&
            pebble.y < prop.y + prop.h;

          if (hitProp) {
            pebble.life = 999;

            // Sniping Ambush Guard above Manhole!
            if (prop.type === 'manhole' && prop.hasAmbush && !prop.ambushDefeated) {
              prop.hasAmbush = false;
              prop.ambushDefeated = true;
              g.score += 300;
              gameAudio.playStomp();
              g.screenShake = 4.5;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 30,
                text: '🎯 彈弓暗算成功！擊暈埋伏憲兵！+300',
                color: '#facc15',
                opacity: 1,
              });
              // Spark particles
              for (let i = 0; i < 6; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y - 15,
                  vx: (Math.random() - 0.5) * 4,
                  vy: -Math.random() * 3,
                  size: 3,
                  color: '#fde047',
                  alpha: 0.9,
                  life: 0,
                  maxLife: 15,
                  type: 'spark',
                });
              }
            } else if (prop.type === 'powder_keg') {
              // HUGE POWDER KEG EXPLOSION!
              prop.active = false;
              gameAudio.playExplosion();
              g.screenShake = 9.0;
              g.hitStopTimer = 4;
              g.score += 500;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 30,
                text: '💥 火藥桶轟然引爆！+500',
                color: '#ef4444',
                opacity: 1,
              });

              // 140px radius blast: obliterate enemies & handcuffs
              g.enemies.forEach((enemy) => {
                if (enemy.alive) {
                  const dist = Math.hypot(
                    enemy.x + enemy.w / 2 - (prop.x + prop.w / 2),
                    enemy.y + enemy.h / 2 - (prop.y + prop.h / 2)
                  );
                  if (dist < 140) {
                    enemy.alive = false;
                    enemy.squashTime = 25;
                    g.score += 250;
                  }
                }
              });

              g.javertHandcuffs.forEach((hc) => {
                const dist = Math.hypot(hc.x - (prop.x + prop.w / 2), hc.y - (prop.y + prop.h / 2));
                if (dist < 140) {
                  hc.life = 999;
                }
              });

              // Fiery explosion particles
              for (let i = 0; i < 16; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y + prop.h / 2,
                  vx: (Math.random() - 0.5) * 7,
                  vy: (Math.random() - 0.5) * 7,
                  size: 5 + Math.random() * 6,
                  color: i % 2 === 0 ? '#ef4444' : '#f59e0b',
                  alpha: 0.95,
                  life: 0,
                  maxLife: 26,
                  type: 'spark',
                });
              }
            } else if (prop.type === 'valve_lever' && !g.dynamicEvent.valvePulled) {
              g.dynamicEvent.valvePulled = true;
              gameAudio.playValveOpen();
              g.score += 800;
              g.screenShake = 7;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 30,
                text: '🎯 彈弓精準命中洩洪閥門！鐵閘門升起！+800',
                color: '#38bdf8',
                opacity: 1,
              });
              g.worldProps.forEach((p) => {
                if (p.type === 'sluice_gate') p.isOpening = true;
              });
              for (let i = 0; i < 14; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y + prop.h / 2,
                  vx: (Math.random() - 0.5) * 6,
                  vy: -Math.random() * 5,
                  size: 4 + Math.random() * 3,
                  color: '#e2e8f0',
                  alpha: 0.9,
                  life: 0,
                  maxLife: 20,
                  type: 'dust',
                });
              }
            } else if (prop.type === 'crate') {
              prop.active = false;
              gameAudio.playCrateBreak();
              g.score += 80;
              const dropType = (g.slingshotAmmo <= 1 && Math.random() < 0.4) ? 'slingshot' : (Math.random() > 0.45 ? 'bread' : 'coin');
              g.collectibles.push({
                x: prop.x + 4,
                y: prop.y - 20,
                w: 24,
                h: 24,
                type: dropType,
                collected: false,
                vy: -2,
                initialY: prop.y - 20,
              });
              for (let i = 0; i < 6; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y + prop.h / 2,
                  vx: (Math.random() - 0.5) * 4,
                  vy: (Math.random() - 0.5) * 3,
                  size: 4,
                  color: '#78350f',
                  alpha: 0.85,
                  life: 0,
                  maxLife: 18,
                  type: 'dust',
                });
              }
            } else if (prop.type === 'iron_crate') {
              prop.active = false;
              gameAudio.playArmorBreak();
              g.score += 200;
              g.hitStopTimer = 4;
              g.screenShake = 6;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 22,
                text: '🎯 彈弓破甲貫穿軍火鐵箱！獲得精銳軍備！+200',
                color: '#38bdf8',
                opacity: 1,
              });
              const dropType = Math.random() < 0.6 ? 'slingshot' : 'shield';
              g.collectibles.push({
                x: prop.x + 4,
                y: prop.y - 20,
                w: 24,
                h: 24,
                type: dropType,
                collected: false,
                vy: -3.5,
                initialY: prop.y - 20,
              });
              for (let i = 0; i < 10; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y + prop.h / 2,
                  vx: (Math.random() - 0.5) * 5,
                  vy: (Math.random() - 0.5) * 4,
                  size: 4,
                  color: '#64748b',
                  alpha: 1,
                  life: 0,
                  maxLife: 20,
                  type: 'dust',
                });
              }
            } else if (prop.type === 'relic_chest') {
              prop.active = false;
              gameAudio.playChestOpen();
              g.score += 500;
              g.hitStopTimer = 5;
              g.screenShake = 6;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 24,
                text: '✨ 彈弓開啟聖物寶箱！聖光普照！+500',
                color: '#fde047',
                opacity: 1,
              });
              const relicLoot = g.hearts < 3 && Math.random() < 0.6 ? 'heart' : 'candlestick';
              g.collectibles.push({
                x: prop.x + 4,
                y: prop.y - 24,
                w: 24,
                h: 24,
                type: relicLoot,
                collected: false,
                vy: -4,
                initialY: prop.y - 24,
              });
              for (let i = 0; i < 12; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y + prop.h / 2,
                  vx: (Math.random() - 0.5) * 6,
                  vy: -Math.random() * 5,
                  size: 3.5,
                  color: '#fef08a',
                  alpha: 1,
                  life: 0,
                  maxLife: 22,
                  type: 'spark',
                });
              }
            } else if (prop.type === 'damp_crate') {
              prop.active = false;
              gameAudio.playWaterSplash();
              g.score += 120;
              g.waterSurgeTimer = 300;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 18,
                text: '🌊 彈弓擊破水箱！獲得【激流疾跑】加速！+120',
                color: '#38bdf8',
                opacity: 1,
              });
              g.collectibles.push({
                x: prop.x + 4,
                y: prop.y - 20,
                w: 24,
                h: 24,
                type: 'bread',
                collected: false,
                vy: -2.5,
                initialY: prop.y - 20,
              });
            } else if (prop.type === 'booby_crate') {
              prop.active = false;
              gameAudio.playExplosion();
              g.screenShake = 9;
              g.score += 250;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: prop.x + prop.w / 2,
                y: prop.y - 24,
                text: '🎯 遠程狙爆誘餌炸藥！消滅追兵！+250',
                color: '#ef4444',
                opacity: 1,
              });
              for (let i = 0; i < 16; i++) {
                g.particles.push({
                  x: prop.x + prop.w / 2,
                  y: prop.y + prop.h / 2,
                  vx: (Math.random() - 0.5) * 7,
                  vy: (Math.random() - 0.5) * 7,
                  size: 5,
                  color: '#ef4444',
                  alpha: 1,
                  life: 0,
                  maxLife: 20,
                  type: 'spark',
                });
              }
              // Wipes out nearby enemies in 140px radius!
              g.enemies.forEach((enemy) => {
                if (enemy.alive) {
                  const dist = Math.hypot(
                    enemy.x + enemy.w / 2 - (prop.x + prop.w / 2),
                    enemy.y + enemy.h / 2 - (prop.y + prop.h / 2)
                  );
                  if (dist < 140) {
                    enemy.alive = false;
                    enemy.squashTime = 25;
                    g.score += 200;
                  }
                }
              });
            }
          }
        });
      });
      g.slingshotPebbles = g.slingshotPebbles.filter((p) => p.life < 90 && p.y < 440);

      // Javert Handcuff Throwing (Escalates with Alert Level)
      const throwThreshold = g.alertLevel >= 3 ? 52 : 38;
      const throwCooldown = g.alertLevel === 4 ? 140 : g.alertLevel === 3 ? 180 : 230;
      if (g.javertDist < throwThreshold) {
        g.javertThrowTimer++;
        if (g.javertThrowTimer > throwCooldown) {
          g.javertThrowTimer = 0;
          gameAudio.playHandcuffClink();
          const targetY = player.y + 8;
          g.javertHandcuffs.push({
            id: Date.now() + Math.random(),
            x: g.cameraX + 20,
            y: Math.max(160, Math.min(330, targetY - 40)),
            vx: 6.4 + (g.alertLevel >= 3 ? 1.0 : 0),
            vy: -1.2,
            rot: 0,
            life: 0,
          });

          // Alert Level 4: Double Handcuff Volley!
          if (g.alertLevel === 4) {
            g.javertHandcuffs.push({
              id: Date.now() + Math.random() + 1,
              x: g.cameraX - 25,
              y: Math.max(130, Math.min(290, targetY - 70)),
              vx: 7.2,
              vy: -1.8,
              rot: 0.15,
              life: 0,
            });
          }

          g.floatingTexts.push({
            id: Date.now() + Math.random(),
            x: player.x,
            y: 180,
            text: g.alertLevel === 4 ? '🚨 賈維爾投擲【雙重連鎖鐵銬】！' : '🚨 警督投擲手銬！小心跳躍或投石擊碎！',
            color: '#ef4444',
            opacity: 1,
          });

          if (Math.random() < 0.6) {
            triggerDialogue({
              speaker: 'javert',
              speakerName: '警督 賈維爾',
              avatarIcon: '👮',
              text: '「戴上鐵銬吧，24601！你的自由到此為止！」',
              tag: '⛓️ 逮捕飛銬',
              tagColor: '#ef4444',
              themeColor: '#dc2626',
              timer: 170,
              maxTimer: 170,
            });
          } else {
            triggerDialogue({
              speaker: 'gavroche',
              speakerName: '小頑童 加夫洛許',
              avatarIcon: '🪨',
              text: '「大叔小心頭頂！用加夫洛許彈弓把飛銬射碎！」',
              tag: '⚡ 警戒提醒',
              tagColor: '#38bdf8',
              themeColor: '#0284c7',
              timer: 170,
              maxTimer: 170,
            });
          }
        }
      }

      // Update Javert's Handcuffs
      g.javertHandcuffs.forEach((hc) => {
        hc.x += hc.vx;
        hc.y += hc.vy;
        hc.vy += 0.08;
        hc.rot += 0.22;
        hc.life++;

        // Collision with player
        const distSq = (player.x + player.w / 2 - hc.x) ** 2 + (player.y + player.h / 2 - hc.y) ** 2;
        if (distSq < 22 * 22) {
          hc.life = 999; // consume handcuff
          if (player.invincibleFlash <= 0 && player.graceTimer <= 0) {
            if (g.hasCosetteShield) {
              g.hasCosetteShield = false;
              gameAudio.playShieldBreak();
              player.invincibleFlash = 80;
              g.hitStopTimer = 6;
              g.screenShake = 6;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x,
                y: player.y - 20,
                text: '🛡️ 珂賽特的庇護！化解手銬！',
                color: '#f472b6',
                opacity: 1,
              });
            } else if (checkBreadEmergencySalvation()) {
              player.vx = -3.0;
            } else {
              g.hearts -= 1;
              player.invincibleFlash = 90;
              player.vx = -3.5;
              g.hitStopTimer = 5;
              g.screenShake = 8;
              gameAudio.playHurt();
              g.javertDist = Math.max(10, g.javertDist - 15);
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x,
                y: player.y - 20,
                text: '⛓️ 被手銬擊中！警督逼近！',
                color: '#ef4444',
                opacity: 1,
              });
              if (g.hearts <= 0) {
                handleGameOver();
                return;
              }
            }
          }
        }
      });
      g.javertHandcuffs = g.javertHandcuffs.filter((hc) => hc.life < 160 && hc.y < 430);

      // --- Update Enemy Projectiles (Tear Gas Canisters & Thénardier Caltrop Traps) ---
      g.enemyProjectiles.forEach((proj) => {
        proj.life++;

        if (proj.type === 'caltrop') {
          // Caltrop physics: falls to ground then stays armed
          if (!proj.isArmed) {
            proj.x += proj.vx;
            proj.y += proj.vy;
            proj.vy += 0.22; // Gravity
            proj.rot += 0.15;
            if (proj.y >= 356) {
              proj.y = 356;
              proj.vx = 0;
              proj.vy = 0;
              proj.isArmed = true;
            }
          }

          // Stepped on by player!
          const isPlayerStepping =
            Math.abs(player.x + player.w / 2 - proj.x) < 18 &&
            Math.abs(player.y + player.h - proj.y) < 14;

          if (isPlayerStepping && proj.isArmed) {
            proj.life = 999;
            gameAudio.playTrapSnap();
            player.vx *= 0.25;
            player.vy = -3.4;
            g.screenShake = 6;
            g.hitStopTimer = 4;

            if (player.invincibleFlash <= 0 && player.graceTimer <= 0) {
              if (g.hasCosetteShield) {
                g.hasCosetteShield = false;
                gameAudio.playShieldBreak();
                player.invincibleFlash = 80;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 20,
                  text: '🛡️ 珂賽特的守護！抵擋了地菱毒刺！',
                  color: '#f472b6',
                  opacity: 1,
                });
              } else if (checkBreadEmergencySalvation()) {
                // saved by bread emergency!
              } else {
                g.hearts -= 1;
                player.invincibleFlash = 85;
                gameAudio.playHurt();
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 20,
                  text: '💥 踩中德納第的撒菱毒刺！-1❤️ (腳部刺痛硬直！)',
                  color: '#ef4444',
                  opacity: 1,
                });
                if (g.hearts <= 0) {
                  handleGameOver();
                  return;
                }
              }
            }
          }
          return;
        }

        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.vy += 0.14; // Gravity
        proj.rot += 0.2;

        // Green gas particle trail
        if (proj.life % 3 === 0) {
          g.particles.push({
            x: proj.x,
            y: proj.y,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            size: 3,
            color: '#86efac',
            alpha: 0.6,
            life: 0,
            maxLife: 15,
            type: 'dust',
          });
        }

        // Collide projectile with player
        const distSq = (player.x + player.w / 2 - proj.x) ** 2 + (player.y + player.h / 2 - proj.y) ** 2;
        if (distSq < 22 * 22) {
          proj.life = 999; // destroy
          if (player.invincibleFlash <= 0 && player.graceTimer <= 0) {
            if (g.hasCosetteShield) {
              g.hasCosetteShield = false;
              gameAudio.playShieldBreak();
              player.invincibleFlash = 80;
              g.hitStopTimer = 6;
              g.screenShake = 6;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x,
                y: player.y - 20,
                text: '🛡️ 珂賽特的守護！淨化催淚毒氣！',
                color: '#f472b6',
                opacity: 1,
              });
            } else if (checkBreadEmergencySalvation()) {
              // saved by bread emergency!
            } else {
              g.hearts -= 1;
              player.invincibleFlash = 90;
              player.vx = proj.vx > 0 ? 3.5 : -3.5;
              g.hitStopTimer = 5;
              g.screenShake = 7;
              gameAudio.playHurt();
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x,
                y: player.y - 20,
                text: '☣️ 遭催淚瓦斯波及！體力受損！',
                color: '#4ade80',
                opacity: 1,
              });
              if (g.hearts <= 0) {
                handleGameOver();
                return;
              }
            }
          }
        }
      });
      g.enemyProjectiles = g.enemyProjectiles.filter((p) => (p.type === 'caltrop' ? p.life < 500 : p.life < 180 && p.y < 440));

      // --- Dynamic Environmental Encounters & Ambush Events ---
      if (g.worldDistance >= g.nextEventDist && !g.dynamicEvent.active) {
        const isSewer = player.y >= 350;
        let chosenType: DynamicEventType = 'barricade_crisis';
        if (isSewer) {
          chosenType = 'sluice_lockdown';
        } else {
          chosenType = Math.random() > 0.45 ? 'pincer_ambush' : 'barricade_crisis';
        }

        g.dynamicEvent.active = true;
        g.dynamicEvent.type = chosenType;
        g.nextEventDist += 580 + Math.random() * 200;

        if (chosenType === 'pincer_ambush') {
          g.dynamicEvent.timer = 500; // ~8.3s
          g.dynamicEvent.maxDuration = 500;
          g.dynamicEvent.bannerTitle = '⚠️ 兩翼包夾！警笛大作！';
          g.dynamicEvent.bannerSub = '前後憲兵合圍！利用雨遮鷹架飛躍或引爆火藥破局！';
          gameAudio.playWhistle();
          g.screenShake = 8;
          // Spawn rear ambusher (Left side)
          g.enemies.push({
            x: player.x - 220,
            y: 360 - 42,
            w: 32,
            h: 42,
            vx: 3.2,
            minX: player.x - 350,
            maxX: player.x + 400,
            alive: true,
            squashTime: 0,
            type: 'gendarme',
          });
          // Spawn forward squad leader (Right side)
          g.enemies.push({
            x: player.x + 240,
            y: 360 - 42,
            w: 32,
            h: 42,
            vx: -2.4,
            minX: player.x - 100,
            maxX: player.x + 500,
            alive: true,
            squashTime: 0,
            type: 'elite_sergeant',
            hp: 2,
            maxHp: 2,
          });
          g.floatingTexts.push({
            id: Date.now() + Math.random(),
            x: player.x,
            y: 160,
            text: '⚠️ 兩翼憲兵包抄夾擊！小心前後夾殺！',
            color: '#ef4444',
            opacity: 1,
          });
        } else if (chosenType === 'sluice_lockdown') {
          g.dynamicEvent.timer = 540; // ~9s
          g.dynamicEvent.maxDuration = 540;
          g.dynamicEvent.bannerTitle = '🚨 下水道水閘封鎖！急流激增！';
          g.dynamicEvent.bannerSub = '鐵閘門落下！踩踏崩塌石磚躍起，或拉開頂部洩洪閥門！';
          g.dynamicEvent.valvePulled = false;
          gameAudio.playGateSlam();
          g.screenShake = 12;
          // Spawn rear and front sluice gates
          g.worldProps.push({
            id: Date.now() + Math.random(),
            x: player.x - 180,
            y: 350,
            w: 18,
            h: 90,
            type: 'sluice_gate',
            active: true,
            gateHeight: 10,
          });
          g.worldProps.push({
            id: Date.now() + Math.random(),
            x: player.x + 360,
            y: 350,
            w: 18,
            h: 90,
            type: 'sluice_gate',
            active: true,
            gateHeight: 10,
          });
          // Spawn emergency valve lever above
          g.worldProps.push({
            id: Date.now() + Math.random(),
            x: player.x + 120,
            y: 220,
            w: 32,
            h: 32,
            type: 'valve_lever',
            active: true,
          });
          // Spawn escape crumble platforms leading up to valve
          g.platforms.push({ x: player.x + 30, y: 310, w: 70, h: 18, type: 'crumble' });
          g.platforms.push({ x: player.x + 100, y: 250, w: 75, h: 18, type: 'crumble' });
        } else {
          // Barricade crisis
          g.dynamicEvent.timer = 720;
          g.dynamicEvent.maxDuration = 720;
          g.dynamicEvent.bannerTitle = '🚨 街壘戰火封鎖！地面迫擊警戒！';
          g.dynamicEvent.bannerSub = '鑽入地下水道可避開地面砲火！';
          g.mortarSpawnTimer = 40;
          gameAudio.playAlarmAlert();
          g.screenShake = 10;
          g.floatingTexts.push({
            id: Date.now() + Math.random(),
            x: player.x,
            y: 160,
            text: '🚨 街壘爆發激戰！砲兵開始轟炸街道！',
            color: '#ef4444',
            opacity: 1,
          });
        }
      }

      if (g.dynamicEvent.active) {
        g.dynamicEvent.timer--;
        if (g.dynamicEvent.timer <= 0) {
          const finishedType = g.dynamicEvent.type;
          g.dynamicEvent.active = false;
          // Clean up gates
          g.worldProps.forEach((p) => {
            if (p.type === 'sluice_gate') p.isOpening = true;
          });
          if (finishedType === 'pincer_ambush') {
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: player.x,
              y: 160,
              text: '🕊️ 成功擺脫兩翼包夾！突破重圍！+600分！',
              color: '#4ade80',
              opacity: 1,
            });
            g.score += 600;
          } else if (finishedType === 'sluice_lockdown') {
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: player.x,
              y: 160,
              text: '🕊️ 下水道水閘危機解除！+700分！',
              color: '#38bdf8',
              opacity: 1,
            });
            g.score += 700;
          } else {
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: player.x,
              y: 160,
              text: '🕊️ 戰火砲擊暫歇！成功突破封鎖線！+500分！',
              color: '#4ade80',
              opacity: 1,
            });
            g.score += 500;
          }
        } else {
          // If in sluice lockdown and valve not pulled, water current gives backward resistance
          if (g.dynamicEvent.type === 'sluice_lockdown' && !g.dynamicEvent.valvePulled && player.y >= 350) {
            player.vx -= 0.15;
          }

          // Periodic Mortar Shell Spawning for barricade crisis
          if (g.dynamicEvent.type === 'barricade_crisis') {
            g.mortarSpawnTimer++;
            if (g.mortarSpawnTimer > 120) { // every 2 seconds
              g.mortarSpawnTimer = 0;
              // Target placed ahead of player on street level (y = 360)
              const targetX = player.x + 120 + Math.random() * 260;
              g.mortarStrikes.push({
                id: Date.now() + Math.random(),
                targetX,
                targetY: 360,
                warningTimer: 68, // ~1.13s warning beacon
                shellY: 60,
                exploded: false,
              });
            }
          }
        }
      }

      // --- Update Mortar Strikes ---
      g.mortarStrikes.forEach((strike) => {
        strike.warningTimer--;
        // Shell falls during last 20 frames
        if (strike.warningTimer <= 20) {
          const progress = 1 - Math.max(0, strike.warningTimer) / 20;
          strike.shellY = 60 + (strike.targetY - 60) * (progress * progress);
        }

        if (strike.warningTimer <= 0 && !strike.exploded) {
          strike.exploded = true;
          gameAudio.playExplosion();
          g.screenShake = 9;

          // Explosion blast particles
          for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const spd = 2.5 + Math.random() * 3.5;
            g.particles.push({
              x: strike.targetX,
              y: strike.targetY,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd - 1.5,
              size: 4 + Math.random() * 3,
              color: i % 2 === 0 ? '#f97316' : '#ef4444',
              alpha: 1,
              life: 0,
              maxLife: 20,
              type: 'spark',
            });
          }

          // Damage check: player in sewer (y > 380) is 100% safe from street artillery!
          const isPlayerInSewer = player.y > 380;
          const distToBlast = Math.abs((player.x + player.w / 2) - strike.targetX);

          if (!isPlayerInSewer && distToBlast < 60 && Math.abs((player.y + player.h) - strike.targetY) < 40) {
            if (player.invincibleFlash <= 0 && player.graceTimer <= 0) {
              if (g.hasCosetteShield) {
                g.hasCosetteShield = false;
                gameAudio.playShieldBreak();
                player.invincibleFlash = 90;
                g.screenShake = 8;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 20,
                  text: '🛡️ 珂賽特的守護！擋下砲彈衝擊！',
                  color: '#f472b6',
                  opacity: 1,
                });
              } else if (checkBreadEmergencySalvation()) {
                player.vx = player.x < strike.targetX ? -4 : 4;
                player.vy = -5;
              } else {
                g.hearts -= 1;
                player.invincibleFlash = 90;
                player.vx = player.x < strike.targetX ? -5 : 5;
                player.vy = -6;
                g.hitStopTimer = 6;
                g.screenShake = 11;
                gameAudio.playHurt();
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 20,
                  text: '💥 遭迫擊砲火波及！快躲入下水道暗道！',
                  color: '#ef4444',
                  opacity: 1,
                });
                if (g.hearts <= 0) {
                  handleGameOver();
                  return;
                }
              }
            }
          }
        }
      });
      g.mortarStrikes = g.mortarStrikes.filter((s) => s.warningTimer > -15);

      // Update Enemies (Gendarmes & Thenardiers & Mimic Thieves & Elites - Enhanced AI)
      g.enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        // Stagger / Stun Timer for Elite Sergeant
        if (enemy.staggerTimer !== undefined && enemy.staggerTimer > 0) {
          enemy.staggerTimer--;
          return; // briefly staggered, cannot move or hurt player
        }

        const distToPlayerX = player.x - enemy.x;
        const distToPlayerY = Math.abs((player.y + player.h / 2) - (enemy.y + enemy.h / 2));
        const isFacingPlayer = (enemy.vx > 0 && distToPlayerX > 0) || (enemy.vx < 0 && distToPlayerX < 0);

        // 1. Gendarme AI: Line-of-Sight Detection & Sprint Pursuit
        if (!enemy.type || enemy.type === 'gendarme') {
          if (distToPlayerY < 45 && Math.abs(distToPlayerX) < 260) {
            // Player spotted in direct line of sight!
            enemy.vx = Math.sign(distToPlayerX) * 3.2; // Chase player!
          } else {
            // Standard patrol pacing
            if (Math.abs(enemy.vx) > 2.0) {
              enemy.vx = Math.sign(enemy.vx) * 1.8;
            }
          }
        }

        // 2. Elite Sergeant AI: Heavy Shield Phalanx & Relentless Pressure
        if (enemy.type === 'elite_sergeant') {
          if (Math.abs(distToPlayerX) < 320) {
            // Always face towards player to present heavy shield!
            const speed = (enemy.hp ?? 2) <= 1 ? 3.4 : 2.2; // Berserk sprint if armor cracked!
            enemy.vx = Math.sign(distToPlayerX) * speed;
          }
        }

        // 3. Grenadier AI: Tactical Spacing & Predictive Grenade Launch
        if (enemy.type === 'grenadier') {
          enemy.throwCooldown = (enemy.throwCooldown || 0) + 1;
          
          // Defensive spacing: backstep if player charges too close (< 130px)
          if (Math.abs(distToPlayerX) < 130 && distToPlayerY < 50) {
            enemy.vx = -Math.sign(distToPlayerX) * 2.6; // Tactical retreat
          } else if (Math.abs(distToPlayerX) > 380) {
            enemy.vx = Math.sign(distToPlayerX) * 1.6; // Advance into range
          }

          // Predictive launch with player velocity compensation
          if (Math.abs(distToPlayerX) < 520 && enemy.throwCooldown > 180) {
            enemy.throwCooldown = 0;
            gameAudio.playGrenadeLaunch();
            const launchLeft = distToPlayerX < 0;
            // Predict future player position based on player.vx
            const leadX = player.vx * 14;
            const targetDist = Math.abs(distToPlayerX + leadX);
            g.enemyProjectiles.push({
              id: Date.now() + Math.random(),
              x: enemy.x + (launchLeft ? -6 : enemy.w + 6),
              y: enemy.y + 12,
              vx: (launchLeft ? -1 : 1) * Math.max(3.2, Math.min(7.5, targetDist * 0.016)),
              vy: -4.8,
              rot: 0,
              life: 0,
              type: 'tear_gas',
            });
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: enemy.x,
              y: enemy.y - 22,
              text: '💣 預判擲出催淚瓦斯！小心閃避！',
              color: '#4ade80',
              opacity: 1,
            });
          }
        }

        // 4. Thénardier Cunning AI: Caltrops Spike Traps, Dagger Charge & Agile Escape
        if (enemy.type === 'thenardier') {
          // A. Caltrop Spike Trap Tossing (every ~150 frames when player is near)
          enemy.caltropTimer = (enemy.caltropTimer || 0) + 1;
          if (Math.abs(distToPlayerX) < 350 && enemy.caltropTimer > 150) {
            enemy.caltropTimer = 0;
            gameAudio.playTrapSnap();
            const tossDir = Math.sign(enemy.vx || 1);
            // Drop 2 caltrops behind / ahead
            g.enemyProjectiles.push({
              id: Date.now() + Math.random(),
              x: enemy.x + (tossDir > 0 ? -12 : enemy.w + 12),
              y: enemy.y + 16,
              vx: -tossDir * 2.6,
              vy: -3.5,
              rot: 0,
              life: 0,
              type: 'caltrop',
              isArmed: false,
            });
            g.enemyProjectiles.push({
              id: Date.now() + Math.random() + 1,
              x: enemy.x + (tossDir > 0 ? -26 : enemy.w + 26),
              y: enemy.y + 16,
              vx: -tossDir * 4.2,
              vy: -4.0,
              rot: 0,
              life: 0,
              type: 'caltrop',
              isArmed: false,
            });
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: enemy.x,
              y: enemy.y - 24,
              text: '😈 德納第撒下毒刺地菱！小心跳躍避開！',
              color: '#f97316',
              opacity: 1,
            });
          }

          // B. Dagger Charge Wind-up & Lunge
          if (Math.abs(distToPlayerX) > 75 && Math.abs(distToPlayerX) < 220 && distToPlayerY < 35 && !enemy.isDaggerCharging) {
            enemy.daggerChargeTimer = (enemy.daggerChargeTimer || 0) + 1;
            if (enemy.daggerChargeTimer > 100) {
              enemy.isDaggerCharging = true;
              enemy.daggerChargeTimer = 26; // lunge duration
              enemy.vx = Math.sign(distToPlayerX) * 5.8;
              gameAudio.playDaggerSlash();
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 26,
                text: '🗡️ 德納第短刀突刺！',
                color: '#ef4444',
                opacity: 1,
              });
            }
          } else if (enemy.isDaggerCharging) {
            enemy.daggerChargeTimer = (enemy.daggerChargeTimer || 0) - 1;
            if (enemy.daggerChargeTimer <= 0) {
              enemy.isDaggerCharging = false;
              enemy.daggerChargeTimer = 0;
              enemy.vx = Math.sign(enemy.vx) * (enemy.isMimicThief ? 4.6 : 2.2);
            }
          }

          // C. Flee timer for Mimic Thénardier
          if (enemy.fleeTimer !== undefined && enemy.fleeTimer > 0) {
            enemy.fleeTimer--;
            if (!enemy.isDaggerCharging) {
              enemy.vx = Math.sign(enemy.vx || 1) * 4.6;
            }
            if (enemy.fleeTimer <= 0) {
              enemy.alive = false;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 25,
                text: '💨 德納第攜贓遁入暗巷逃脫了！',
                color: '#94a3b8',
                opacity: 1,
              });
              return;
            }
          }
        }

        enemy.x += enemy.vx;
        if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) {
          enemy.vx *= -1; // Turn around
        }

        // Collision with player
        const isOverlap =
          player.x < enemy.x + enemy.w &&
          player.x + player.w > enemy.x &&
          player.y < enemy.y + enemy.h &&
          player.y + player.h > enemy.y;

        if (isOverlap) {
          // If in Grace Mode, knock out enemy immediately
          if (player.graceTimer > 0) {
            enemy.alive = false;
            if (enemy.isMimicThief) {
              const recovered = Math.max(10, (enemy.stolenBread || 4) * 2);
              g.breadCount += recovered;
              g.score += 1000;
              confetti({ particleCount: 20, spread: 50, origin: { y: 0.6 } });
            } else {
              g.score += 300;
            }
            gameAudio.playStomp();
            g.floatingTexts.push({
              id: Date.now() + Math.random(),
              x: enemy.x,
              y: enemy.y - 20,
              text: '💥 聖光驅逐！制伏敵人！',
              color: '#facc15',
              opacity: 1,
            });
          }
          // Mario Stomp from above!
          else if (player.vy > 0 && player.y + player.h - enemy.y < 24) {
            const isHelmPlunge = player.isHelmSplitter;
            player.vy = isHelmPlunge ? -13.2 : keys.upHeld ? -12.0 : -8.0; // Holding jump key triggers higher kinetic bounce
            player.canDoubleJump = true; // Stomping an enemy restores air jump!

            // Synergistic Combo Reset Hook (Dead Cells & Mario Integration)
            player.comboStage = 0;
            player.comboChainTimer = 0;
            player.attackActiveTimer = 0;
            player.attackTotalTimer = 0;
            player.isHelmSplitter = false;

            if (isHelmPlunge) {
              // Plunge-Stomp Siphon: Drops extra bread + pulls nearby loot!
              g.breadCount += 2;
              g.slingshotAmmo += 1;
              g.score += 300;
              g.hitStopTimer = 5;
              g.screenShake = 7.0;
              confetti({ particleCount: 28, spread: 65, origin: { y: 0.6 } });
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x + player.w / 2,
                y: player.y - 30,
                text: '✨ 震地重踏！[CRITICAL STOMP + 資源爆破 🥖+2 🪨+1]',
                color: '#fde047',
                opacity: 1,
              });

              // Siphon all nearby collectibles in a 280px radius
              g.collectibles.forEach((item) => {
                if (!item.collected) {
                  const dx = player.x - item.x;
                  const dy = player.y - item.y;
                  if (dx * dx + dy * dy < 280 * 280) {
                    item.x = player.x;
                    item.y = player.y;
                  }
                }
              });
            } else {
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: player.x + player.w / 2,
                y: player.y - 25,
                text: '🎯 踏頭重置連擊！[COMBO RESET ⚡]',
                color: '#facc15',
                opacity: 1,
              });
            }

            // Elite Sergeant Armor Check
            if (enemy.type === 'elite_sergeant' && (enemy.hp ?? 2) > 1) {
              enemy.hp = 1;
              enemy.staggerTimer = 35;
              enemy.vx *= 1.35;
              gameAudio.playArmorBreak();
              g.hitStopTimer = 5;
              g.screenShake = 6;
              g.squashStretch = { scaleX: 1.35, scaleY: 0.68 };
              for (let i = 0; i < 9; i++) {
                g.particles.push({
                  x: enemy.x + enemy.w / 2,
                  y: enemy.y + 16,
                  vx: (Math.random() - 0.5) * 5,
                  vy: -Math.random() * 4,
                  size: 3.5,
                  color: '#fbbf24',
                  alpha: 1,
                  life: 0,
                  maxLife: 18,
                  type: 'spark',
                });
              }
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 25,
                text: '🛡️ 踏裂重甲！精銳隊長狂暴！再踩一次！',
                color: '#f59e0b',
                opacity: 1,
              });
              return;
            }

            enemy.alive = false;
            enemy.squashTime = 18;
            g.hitStopTimer = 4; // Hitstop freeze-frame
            g.screenShake = 5; // Punchy screen shake
            g.squashStretch = { scaleX: 1.35, scaleY: 0.68 }; // Stomp impact squash
            gameAudio.playStomp();

            if (enemy.type === 'elite_sergeant') {
              g.score += 600;
              g.breadCount += 3;
              g.slingshotAmmo += 1;
              confetti({ particleCount: 22, spread: 55, origin: { y: 0.6 } });
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 28,
                text: '⚔️ 踩碎精銳憲兵隊長！奪得物資(+3🥖 +1🪨)！+600',
                color: '#fbbf24',
                opacity: 1,
              });
            } else if (enemy.type === 'grenadier') {
              g.score += 400;
              g.slingshotAmmo += 2;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 25,
                text: '🎯 踩制擲彈兵！繳獲彈藥(+2🪨)！+400',
                color: '#34d399',
                opacity: 1,
              });
            } else if (enemy.isMimicThief) {
              const recovered = Math.max(10, (enemy.stolenBread || 4) * 2);
              g.breadCount += recovered;
              g.score += 1000;
              confetti({ particleCount: 25, spread: 60, origin: { y: 0.6 } });
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 25,
                text: `💰 踏平泰納第！奪回雙倍麵包 (+${recovered}🥖)！+1000`,
                color: '#facc15',
                opacity: 1,
              });
            } else if (enemy.type === 'thenardier') {
              const recovered = enemy.stolenBread || 0;
              g.breadCount += recovered;
              g.score += 350;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 20,
                text: recovered > 0 ? `💰 抓獲泰納第！奪回 ${recovered} 麵包！+350` : '💰 踏平泰納第！+350',
                color: '#facc15',
                opacity: 1,
              });
            } else {
              g.score += 200;
              g.floatingTexts.push({
                id: Date.now() + Math.random(),
                x: enemy.x,
                y: enemy.y - 15,
                text: '👢 踩踏脫身！+200',
                color: '#60a5fa',
                opacity: 1,
              });
            }

            // Expanding shockwave ring
            g.particles.push({
              x: enemy.x + enemy.w / 2,
              y: enemy.y + 10,
              vx: 0,
              vy: 0,
              size: 8,
              color: '#60a5fa',
              alpha: 1,
              life: 0,
              maxLife: 15,
              type: 'ring',
            });

            // Impact sparks
            for (let i = 0; i < 7; i++) {
              const ang = (Math.PI * 2 * i) / 7;
              g.particles.push({
                x: enemy.x + enemy.w / 2,
                y: enemy.y + 10,
                vx: Math.cos(ang) * (3 + Math.random() * 2),
                vy: Math.sin(ang) * (3 + Math.random() * 2),
                size: 3,
                color: '#93c5fd',
                alpha: 1,
                life: 0,
                maxLife: 16,
                type: 'spark',
              });
            }
          }
          // Body Collision from side
          else if (player.invincibleFlash <= 0) {
            if (enemy.type === 'thenardier') {
              // Thénardier treacherous attack: Deals Heart Damage, Steals Bread, and Knocks Valjean back!
              const stealAmount = Math.min(g.breadCount, 8);
              g.breadCount -= stealAmount;
              enemy.stolenBread = (enemy.stolenBread || 0) + stealAmount;
              enemy.vx = (player.facingRight ? 1 : -1) * 4.2; // Sprints away in sinister laughter
              gameAudio.playMimicLaugh();
              gameAudio.playDaggerSlash();

              if (g.hasCosetteShield) {
                g.hasCosetteShield = false;
                gameAudio.playShieldBreak();
                player.invincibleFlash = 80;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 25,
                  text: '🛡️ 珂賽特守護抵擋了德納第的短刀刺殺！',
                  color: '#f472b6',
                  opacity: 1,
                });
              } else if (checkBreadEmergencySalvation()) {
                player.vy = -5.0;
                player.vx = player.facingRight ? -4 : 4;
              } else {
                g.hearts -= 1;
                player.invincibleFlash = 85;
                player.vy = -5.5;
                player.vx = player.facingRight ? -4.5 : 4.5;
                g.hitStopTimer = 6;
                g.screenShake = 8;
                gameAudio.playHurt();
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: enemy.x,
                  y: enemy.y - 25,
                  text: stealAmount > 0 ? `😈 遭德納第惡棍短刀刺傷！-1❤️ 搶走 ${stealAmount}🥖！` : '😈 遭德納第短刀刺傷！-1❤️！',
                  color: '#ef4444',
                  opacity: 1,
                });
                if (g.hearts <= 0) {
                  handleGameOver();
                  return;
                }
              }
            } else {
              // Gendarme or Elite or Grenadier attack
              if (g.hasCosetteShield) {
                // Check Perfect Parry: If player was attacking or dashing at the moment of impact!
                const isParryActive = keys.attack || keys.dash || player.attackActiveTimer > 0;
                if (isParryActive) {
                  // Shield is PRESERVED! Staggers enemy & charges Finisher!
                  gameAudio.playComboSlash(3, false);
                  gameAudio.playCandlestickShimmer();
                  player.invincibleFlash = 45;
                  player.comboStage = 3;
                  player.comboChainTimer = 35;
                  enemy.staggerTimer = 50;
                  enemy.vx = (player.facingRight ? 1 : -1) * 3.5;
                  g.hitStopTimer = 6;
                  g.screenShake = 6.5;
                  g.javertDist = Math.min(100, g.javertDist + 15);
                  g.floatingTexts.push({
                    id: Date.now() + Math.random(),
                    x: player.x,
                    y: player.y - 25,
                    text: '🛡️ 完美誓約格擋！[PERFECT PARRY ⚔️ 瞬充終結技！]',
                    color: '#f472b6',
                    opacity: 1,
                  });
                  for (let i = 0; i < 12; i++) {
                    g.particles.push({
                      x: player.x + player.w / 2,
                      y: player.y + player.h / 2,
                      vx: (Math.random() - 0.5) * 6,
                      vy: (Math.random() - 0.5) * 6,
                      size: 3.5,
                      color: '#f472b6',
                      alpha: 1,
                      life: 0,
                      maxLife: 20,
                      type: 'spark',
                    });
                  }
                  return;
                }

                // Normal shield absorption
                g.hasCosetteShield = false;
                gameAudio.playShieldBreak();
                player.invincibleFlash = 90;
                player.vy = -6;
                player.vx = player.facingRight ? -3 : 3;
                g.hitStopTimer = 6;
                g.screenShake = 6;
                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 20,
                  text: '🛡️ 珂賽特的守護！抵擋傷害！',
                  color: '#f472b6',
                  opacity: 1,
                });
              } else if (checkBreadEmergencySalvation()) {
                player.vy = -5.5;
                player.vx = player.facingRight ? -4 : 4;
              } else {
                g.hearts -= 1;
                player.invincibleFlash = 60 * 1.5; // 1.5s invulnerability
                player.vy = -6;
                player.vx = player.facingRight ? -4.5 : 4.5;
                g.hitStopTimer = 5; // Hurt freeze
                g.screenShake = 8; // Heavy impact shake
                g.squashStretch = { scaleX: 0.82, scaleY: 1.25 };
                gameAudio.playHurt();
                g.javertDist = Math.max(10, g.javertDist - 20); // Javert closes in!

                const hitMsg =
                  enemy.type === 'elite_sergeant'
                    ? '⚔️ 遭精銳隊長重擊！警督逼近！'
                    : enemy.type === 'grenadier'
                    ? '💥 遭擲彈兵刺刀突刺！警督逼近！'
                    : '⚠️ 受傷！警督逼近！';

                g.floatingTexts.push({
                  id: Date.now() + Math.random(),
                  x: player.x,
                  y: player.y - 20,
                  text: hitMsg,
                  color: '#ef4444',
                  opacity: 1,
                });

                if (g.hearts <= 0) {
                  handleGameOver();
                  return;
                }
              }
            }
          }
        }
      });

      // Timers decrement
      if (player.graceTimer > 0) player.graceTimer--;
      if (player.invincibleFlash > 0) player.invincibleFlash--;

      // Check Fall into Chasm / Void
      if (player.y > 480) {
        if (g.hasCosetteShield) {
          // Cosette's shield saves player from pit!
          g.hasCosetteShield = false;
          gameAudio.playShieldBreak();
          g.floatingTexts.push({
            id: Date.now(),
            x: player.x,
            y: 280,
            text: '🛡️ 珂賽特托起墜落！免除扣心！',
            color: '#f472b6',
            opacity: 1,
          });
        } else {
          gameAudio.playHurt();
          g.hearts -= 1;
          if (g.hearts <= 0) {
            handleGameOver();
            return;
          }
        }

        // Find safe platform behind player to respawn onto
        const safePlats = g.platforms
          .filter((p) => (p.type === 'ground' || p.type === 'sewer') && p.x < player.x)
          .sort((a, b) => (b.x + b.w) - (a.x + a.w));
        const safePlat = safePlats[0];
        if (safePlat) {
          player.x = Math.max(safePlat.x + 40, Math.min(safePlat.x + safePlat.w - 50, player.x - 120));
          player.y = safePlat.y - player.h;
        } else {
          player.x = Math.max(120, player.x - 200);
          player.y = 300;
        }
        player.vx = 0;
        player.vy = 0;
        player.isGrounded = true;
        player.invincibleFlash = 60 * 2; // 2 seconds flash
        g.floatingTexts.push({
          id: Date.now() + 1,
          x: player.x,
          y: player.y - 25,
          text: '⚠️ 重回路面！',
          color: '#f87171',
          opacity: 1,
        });
      }

      // Camera Follows Player with Predictive Lookahead & Damped Spring
      const desiredCamX = updateCameraLookahead(g.cameraX, player.x, player.vx, player.facingRight, 800);
      if (desiredCamX > g.cameraX) {
        g.cameraX = desiredCamX;
      }

      // World Distance & Score Progression
      g.worldDistance = Math.max(g.worldDistance, Math.floor((player.x - 120) / 10));
      g.score += Math.floor(player.vx > 0 ? 0.35 : 0);
      const curDist = Math.floor(g.worldDistance);

      // --- Escalating Wanted & Crisis Alert Levels (4 Stages) ---
      let nextAlertLevel = 1;
      let nextAlertTitle = '暗夜潛行';
      if (curDist >= 1600) {
        nextAlertLevel = 4;
        nextAlertTitle = '鐵壁死局';
      } else if (curDist >= 800) {
        nextAlertLevel = 3;
        nextAlertTitle = '起義交火';
      } else if (curDist >= 300) {
        nextAlertLevel = 2;
        nextAlertTitle = '全城通緝';
      }

      if (nextAlertLevel > g.alertLevel) {
        g.alertLevel = nextAlertLevel;
        g.alertTitle = nextAlertTitle;
        gameAudio.playPoliceWhistle();
        g.screenShake = 9;
        g.floatingTexts.push({
          id: Date.now() + Math.random(),
          x: player.x,
          y: player.y - 45,
          text: `🚨 警戒升級：Level ${nextAlertLevel} 【${nextAlertTitle}】！`,
          color: nextAlertLevel >= 3 ? '#ef4444' : '#f59e0b',
          opacity: 1,
        });
      }

      // --- Story Milestone Cinematic Dialogues ---
      if (curDist >= 120 && g.lastMilestoneDist < 120) {
        g.lastMilestoneDist = 120;
        triggerDialogue({
          speaker: 'gavroche',
          speakerName: '小頑童 加夫洛許',
          avatarIcon: '🪨',
          text: '「尚萬強大叔！看人孔蓋！按 [S/↓] 潛入暗道能甩開憲兵視線！」',
          tag: '💡 暗道指南',
          tagColor: '#38bdf8',
          themeColor: '#0284c7',
          timer: 230,
          maxTimer: 230,
        });
      } else if (curDist >= 300 && g.lastMilestoneDist < 300) {
        g.lastMilestoneDist = 300;
        triggerDialogue({
          speaker: 'javert',
          speakerName: '警督 賈維爾',
          avatarIcon: '👮',
          text: '「全城進入一級戒備！憲兵隊架設探照燈，任何人不得匿藏逃犯！」',
          tag: '🚨 全城通緝',
          tagColor: '#f97316',
          themeColor: '#ea580c',
          timer: 240,
          maxTimer: 240,
        });
      } else if (curDist >= 600 && g.lastMilestoneDist < 600) {
        g.lastMilestoneDist = 600;
        triggerDialogue({
          speaker: 'gavroche',
          speakerName: '小頑童 加夫洛許',
          avatarIcon: '🪨',
          text: '「自由！市民們築起了革命街壘！快過來大叔，接住加夫洛許的石子袋！」',
          tag: '🚩 街壘起義',
          tagColor: '#ef4444',
          themeColor: '#dc2626',
          timer: 240,
          maxTimer: 240,
        });
      } else if (curDist >= 850 && g.lastMilestoneDist < 850) {
        g.lastMilestoneDist = 850;
        triggerDialogue({
          speaker: 'valjean',
          speakerName: '尚萬強 (24601)',
          avatarIcon: '🥖',
          text: '「法律只懂得處決偷麵包的飢民，卻從不醫治人間的悲慘！」',
          tag: '⚔️ 宿命詰問',
          tagColor: '#f59e0b',
          themeColor: '#d97706',
          timer: 240,
          maxTimer: 240,
        });
      } else if (curDist >= 1200 && g.lastMilestoneDist < 1200) {
        g.lastMilestoneDist = 1200;
        triggerDialogue({
          speaker: 'cosette',
          speakerName: '珂賽特的心聲',
          avatarIcon: '🌸',
          text: '「爸爸……雲端的小白花會為你擋下災厄，請一定要平安歸來……」',
          tag: '🕊️ 心靈庇護',
          tagColor: '#f472b6',
          themeColor: '#ec4899',
          timer: 240,
          maxTimer: 240,
        });
      } else if (curDist >= 1400 && g.lastMilestoneDist < 1400) {
        g.lastMilestoneDist = 1400;
        triggerDialogue({
          speaker: 'javert',
          speakerName: '警督 賈維爾',
          avatarIcon: '👮',
          text: '「下水道也是巴黎的一部分！暗河也洗刷不掉你身為苦役犯的罪孽！」',
          tag: '⛓️ 窮追不捨',
          tagColor: '#ef4444',
          themeColor: '#b91c1c',
          timer: 240,
          maxTimer: 240,
        });
      } else if (curDist >= 1832 && g.lastMilestoneDist < 1832) {
        g.lastMilestoneDist = 1832;
        triggerDialogue({
          speaker: 'gavroche',
          speakerName: '小頑童 加夫洛許',
          avatarIcon: '🪨',
          text: '「你聽見人民在歌唱嗎？！1832 年的巴黎屬於自由！大叔衝啊！」',
          tag: '🔥 六月起義',
          tagColor: '#ef4444',
          themeColor: '#dc2626',
          timer: 260,
          maxTimer: 260,
        });
      } else if (curDist >= 2460 && g.lastMilestoneDist < 2460) {
        g.lastMilestoneDist = 2460;
        triggerDialogue({
          speaker: 'bishop',
          speakerName: '米里哀主教的微光',
          avatarIcon: '🕯️',
          text: '「尚萬強，我的兄弟，你的靈魂已屬於光明，奔向新生吧！」',
          tag: '✨ 靈魂救贖',
          tagColor: '#fde047',
          themeColor: '#ca8a04',
          timer: 280,
          maxTimer: 280,
        });
      }

      // --- Dialogue Timer Countdown ---
      if (g.activeDialogue) {
        g.activeDialogue.timer--;
        if (g.activeDialogue.timer <= 0) {
          if (g.dialogueQueue.length > 0) {
            g.activeDialogue = g.dialogueQueue.shift()!;
            gameAudio.playDialogueChime(g.activeDialogue.speaker);
          } else {
            g.activeDialogue = null;
          }
        }
      }

      // --- Escalating Javert Pursuit Physics & Tension ---
      const pursuitPressure = 1 + Math.min(2.4, curDist / 800);
      g.searchlightAlert = false;
      const isInSewer = player.y >= 350;

      // Searchlight Detection (when Javert is close and player is on street layer)
      if (g.javertDist < (g.alertLevel >= 3 ? 65 : 48) && g.chapter !== 3 && !isInSewer) {
        const sweepCenter = g.cameraX + 360 + Math.sin(Date.now() / (550 - g.alertLevel * 50)) * (200 + g.alertLevel * 30);
        if (Math.abs(player.x + player.w / 2 - sweepCenter) < (65 + g.alertLevel * 10)) {
          const isUnderRoof = g.platforms.some(
            (p) => p.y < player.y && p.x - 10 <= player.x && p.x + p.w + 10 >= player.x + player.w
          );
          if (!isUnderRoof) {
            g.searchlightAlert = true;
          }
        }
      }

      const baseSpeed = 4.4;
      if (g.citizenSupportTimer > 0) {
        // Citizens push Javert back!
        g.javertDist = Math.min(100, g.javertDist + 0.05);
      } else if (isInSewer) {
        // Safe sewer stealth: Javert loses scent
        if (player.vx > baseSpeed) {
          g.javertDist = Math.min(100, g.javertDist + 0.05);
        }
      } else {
        // Street layer pursuit dynamics: player must stay active!
        const searchlightPenalty = g.searchlightAlert ? 0.09 * pursuitPressure : 0;
        if (player.vx > baseSpeed * 1.25 || g.waterSurgeTimer > 0) {
          // Sprinting or water surge pulls away!
          g.javertDist = Math.min(100, g.javertDist + 0.04);
        } else if (player.vx > baseSpeed * 0.75) {
          // Normal running: Javert slowly matches and exerts pressure at high distances!
          const creep = (0.015 + (curDist > 500 ? 0.015 : 0)) * pursuitPressure;
          g.javertDist = Math.max(0, g.javertDist - creep);
        } else if (player.vx <= 0) {
          // Stopped, climbing or knocked back: Javert surges forward fast!
          const rush = (0.08 + searchlightPenalty) * pursuitPressure;
          g.javertDist = Math.max(0, g.javertDist - rush);
        } else if (g.searchlightAlert) {
          g.javertDist = Math.max(0, g.javertDist - 0.06 * pursuitPressure);
        }
      }

      // Update 3A Game Audio Spatial Engine, Dynamic Movements & Adaptive Pursuit Tension
      gameAudio.updateGameState(player.x, player.y, g.javertDist, g.hearts, g.chapter);

      // Heartbeat Sound & Screen Tension Pulse (< 42m)
      if (g.javertDist < 42) {
        g.heartbeatTimer++;
        const beatInterval = Math.max(22, Math.floor((g.javertDist / 42) * 55));
        if (g.heartbeatTimer >= beatInterval) {
          g.heartbeatTimer = 0;
          gameAudio.playHeartbeat();
        }
      }

      if (g.javertDist <= 0) {
        g.floatingTexts.push({
          id: Date.now(),
          x: player.x,
          y: player.y - 20,
          text: '🚨 賈維爾追上了！',
          color: '#ef4444',
          opacity: 1,
        });
        g.hearts = 0;
        handleGameOver();
        return;
      }

      // --- Deterministic 60Hz Particle Physics Simulation & Safe Bounds Pruning (Object Pool Zero-GC) ---
      const minParticleX = g.cameraX - 80;
      const maxParticleX = g.cameraX + 800;
      let aliveParticleCount = 0;
      const particles = g.particles;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life < p.maxLife && p.x >= minParticleX && p.x <= maxParticleX) {
          if (aliveParticleCount !== i) {
            particles[aliveParticleCount] = p;
          }
          aliveParticleCount++;
          if (aliveParticleCount >= 60) break;
        } else {
          // Release back to object pool
          if ('active' in p) {
            (p as any).active = false;
          }
        }
      }
      particles.length = aliveParticleCount;
    };

    const gameLoop = (timestamp: number) => {
      if (!isRunning) return;

      const currentTime = timestamp || performance.now();
      let frameDelta = currentTime - lastTimestamp;
      if (frameDelta > 100) frameDelta = 100; // Cap large lags / tab switching
      lastTimestamp = currentTime;

      accumulator += frameDelta;

      // Fixed timestep integrator loop (deterministic 60Hz physics sub-steps with dynamic Delta Time normalizer)
      let steps = 0;
      const dtScale = normalizeDeltaTime(FIXED_TIMESTEP, 60);
      while (accumulator >= FIXED_TIMESTEP && steps < MAX_PHYSICS_STEPS) {
        if (!isRunning) break;
        updatePhysicsStep(dtScale);
        accumulator -= FIXED_TIMESTEP;
        steps++;
      }

      // Discard excess lag debt to avoid spiral of death
      if (accumulator > FIXED_TIMESTEP * 2) {
        accumulator = 0;
      }

      const g = gameRef.current;
      const player = g.player;

      // Procedural Chunk Spawning (Always generate at least 1600px ahead to prevent void edges)
      while (g.cameraX + 1600 > g.nextSpawnX) {
        generateWorldChunk(g.nextSpawnX);
      }

      // React UI sync throttled (~5.5 Hz UI sync, eliminates mobile stutter/lag)
      if (currentTime - g.lastTime > 180) {
        g.lastTime = currentTime;
        let manholeAction: 'dive' | 'climb' | null = null;
        const isNear = g.worldProps.some(
          (wp) => wp.active && wp.type === 'manhole' && Math.abs(player.x + player.w / 2 - (wp.x + wp.w / 2)) < 42
        );
        if (isNear) {
          manholeAction = player.y < 350 ? 'dive' : 'climb';
        }
        setHudState({
          score: Math.floor(g.score),
          distance: Math.floor(g.worldDistance),
          hearts: g.hearts,
          breadCount: g.breadCount,
          candlestickCount: g.candlestickCount,
          slingshotAmmo: g.slingshotAmmo,
          hasCosetteShield: g.hasCosetteShield,
          graceTimeLeft: Math.ceil(player.graceTimer / 60),
          waterSurgeLeft: Math.ceil(g.waterSurgeTimer / 60),
          javertDistance: Math.round(g.javertDist),
          isNearManhole: manholeAction,
          eventBanner: g.dynamicEvent.active ? { title: g.dynamicEvent.bannerTitle, active: true } : null,
          alertLevel: g.alertLevel,
          alertTitle: g.alertTitle,
        });
      }

      // 2. Rendering on Canvas
      drawScene(ctx, canvas.width, canvas.height);

      if (isRunning) {
        g.animationId = requestAnimationFrame(gameLoop);
      }
    };

    const handleGameOver = () => {
      isRunning = false;
      const g = gameRef.current;
      gameAudio.playGameOver();
      setGameState('gameover');

      const finalScore = Math.floor(g.score);
      const finalDist = Math.floor(g.worldDistance);

      setFinalStats({ score: finalScore, distance: finalDist });
      setHudState((prev) => ({ ...prev, score: finalScore, distance: finalDist, hearts: 0 }));

      // Check high scores
      if (finalScore > highScore) {
        setHighScore(finalScore);
        try {
          localStorage.setItem(STORAGE_KEY_HIGHSCORE, String(finalScore));
        } catch {}
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      if (finalDist > maxDistance) {
        setMaxDistance(finalDist);
        try {
          localStorage.setItem(STORAGE_KEY_MAXDIST, String(finalDist));
        } catch {}
      }
    };

    // Helper: Draw Entire Frame
    const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.save(); // Top-level canvas state safeguard

      const g = gameRef.current;
      const camX = g.cameraX;
      const player = g.player;

      ctx.clearRect(0, 0, width, height);

      // --- Background Layers (Parallax) ---
      // 1. Sky Gradient based on chapter (Offscreen cached GPU blit)
      if (spriteAtlas) {
        const sky = g.chapter === 3 ? spriteAtlas.sky3 : g.chapter === 2 ? spriteAtlas.sky2 : spriteAtlas.sky1;
        ctx.drawImage(sky, 0, 0, width, height);
      } else {
        ctx.fillStyle = g.chapter === 3 ? '#0b1912' : g.chapter === 2 ? '#181216' : '#10162a';
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Full Moon or Street Vault Arch (Offscreen cached GPU blit)
      if (g.chapter !== 3) {
        const moonX = 680 - camX * 0.05;
        const moonY = 80;
        if (spriteAtlas) {
          ctx.drawImage(spriteAtlas.moon, moonX - 65, moonY - 65);
        } else {
          ctx.save();
          ctx.fillStyle = '#fef9c3';
          ctx.beginPath();
          ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 3. Distant Skyline / Sewer Vault Background (Context-aware based on Chapter)
      ctx.save();
      if (g.chapter === 3) {
        // === CHAPTER 3: UNDERGROUND SEWER VAULT ARCHES & PIPES ===
        ctx.fillStyle = '#0a140f';
        // Massive vaulted brick tunnel arches
        const archOffset = ((Math.floor(camX * 0.3) % 180) + 180) % 180;
        for (let x = -archOffset - 180; x < width + 240; x += 180) {
          // Vault stone column
          ctx.fillStyle = '#0f1f17';
          ctx.fillRect(x, 0, 24, height);
          ctx.fillRect(x - 6, 0, 36, 40); // Column capital

          // Arched ceiling ribs
          ctx.strokeStyle = '#142a1f';
          ctx.lineWidth = 14;
          ctx.beginPath();
          ctx.arc(x + 90, 80, 80, Math.PI, 0);
          ctx.stroke();

          // Overhead iron drainage pipe
          ctx.fillStyle = '#1c2820';
          ctx.fillRect(x + 24, 110, 156, 18);
          // Pipe joint flanges
          ctx.fillStyle = '#2d3f33';
          ctx.fillRect(x + 60, 106, 10, 26);
          ctx.fillRect(x + 130, 106, 10, 26);

          // Wall Torch Sconce & Emerald Glow
          const torchX = x + 12;
          const torchY = 190;
          ctx.fillStyle = '#3f3f46';
          ctx.fillRect(torchX - 3, torchY, 6, 16);

          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.torchGlow, torchX - 45, torchY - 6 - 45);
          } else {
            const glowGrad = ctx.createRadialGradient(torchX, torchY - 6, 2, torchX, torchY - 6, 45);
            glowGrad.addColorStop(0, 'rgba(52, 211, 153, 0.6)');
            glowGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
            glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(torchX, torchY - 6, 45, 0, Math.PI * 2);
            ctx.fill();
          }

          const torchPulse = Math.sin(Date.now() / 240 + x * 0.1) * 1.2;
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(torchX, torchY - 6, 4.5 + torchPulse, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // === CHAPTER 1 & 2: PARIS CITY SKYLINE ===
        ctx.fillStyle = g.chapter === 2 ? '#181216' : '#0c111e';
        const skylineOffset = ((Math.floor(camX * 0.2) % 120) + 120) % 120;
        for (let x = -skylineOffset - 120; x < width + 240; x += 120) {
          // Notre Dame style towers or church steeples
          ctx.fillRect(x + 10, 220, 28, 140);
          ctx.fillRect(x + 46, 200, 22, 160);
          ctx.beginPath();
          ctx.moveTo(x + 46, 200);
          ctx.lineTo(x + 57, 160);
          ctx.lineTo(x + 68, 200);
          ctx.fill();
          ctx.fillRect(x + 75, 235, 35, 125);
        }
      }
      ctx.restore();

      // 4. Midground Paris Rooftops or Low Sewer Wall
      ctx.save();
      if (g.chapter === 3) {
        // Sewer damp brick lower wall
        ctx.fillStyle = '#0d1a13';
        ctx.fillRect(0, 280, width, height - 280);
        ctx.strokeStyle = '#08110c';
        ctx.lineWidth = 1.5;
        const brickOffset = ((Math.floor(camX * 0.6) % 40) + 40) % 40;
        for (let x = -brickOffset - 40; x < width + 40; x += 40) {
          ctx.strokeRect(x, 290, 38, 18);
          ctx.strokeRect(x + 20, 310, 38, 18);
          ctx.strokeRect(x, 330, 38, 18);
        }
      } else {
        ctx.fillStyle = g.chapter === 2 ? '#221518' : '#141824';
        const midOffset = ((Math.floor(camX * 0.5) % 80) + 80) % 80;
        for (let x = -midOffset - 80; x < width + 160; x += 80) {
          ctx.fillRect(x, 260, 70, 100);
          // Chimney
          ctx.fillRect(x + 15, 245, 8, 15);
        }
      }
      ctx.restore();

      // --- World Space (Transformed by Camera & Damped Harmonic Spring Screen Shake) ---
      ctx.save();
      const shakeOffset = calculateDampedSpringShake(g.screenShake, 0, g.hitStopTimer);
      ctx.translate(Math.round(-camX + shakeOffset.x), Math.round(shakeOffset.y));

      // Draw Platforms (View-Frustum Culled & Strictly clipped)
      g.platforms.forEach((plat) => {
        if (plat.isBroken || plat.x + plat.w < camX - 60 || plat.x > camX + width + 60) return;
        ctx.save();
        ctx.beginPath();
        ctx.rect(plat.x, plat.y, plat.w, plat.h);
        ctx.clip();

        if (plat.type === 'ground' || plat.type === 'sewer') {
          // Cobblestone ground
          ctx.fillStyle = plat.type === 'sewer' ? '#1c2820' : '#272528';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

          // Top Stone Curb
          ctx.fillStyle = plat.type === 'sewer' ? '#2e4334' : '#44403c';
          ctx.fillRect(plat.x, plat.y, plat.w, 10);

          // Cobblestone patterns aligned to global 24px grid
          ctx.strokeStyle = plat.type === 'sewer' ? '#121c16' : '#1c1917';
          ctx.lineWidth = 1.5;
          const gridStartX = Math.floor(plat.x / 24) * 24;
          for (let cx = gridStartX; cx < plat.x + plat.w; cx += 24) {
            ctx.strokeRect(cx, plat.y + 10, 22, 16);
            ctx.strokeRect(cx, plat.y + 26, 22, 16);
          }
        } else if (plat.type === 'brick') {
          // Brick block platform
          ctx.fillStyle = '#78350f';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(plat.x, plat.y, plat.w, 4);

          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.5;
          const brickStartX = Math.floor(plat.x / 20) * 20;
          for (let bx = brickStartX; bx < plat.x + plat.w; bx += 20) {
            ctx.strokeRect(bx, plat.y + 4, 18, plat.h - 4);
          }
        } else if (plat.type === 'scaffold') {
          // Wooden barricade scaffold
          ctx.fillStyle = '#5c3a21';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(plat.x, plat.y, plat.w, 3);
          // Crossbeams
          ctx.strokeStyle = '#3e2410';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(plat.x, plat.y);
          ctx.lineTo(plat.x + plat.w, plat.y + plat.h);
          ctx.moveTo(plat.x + plat.w, plat.y);
          ctx.lineTo(plat.x, plat.y + plat.h);
          ctx.stroke();
        } else if (plat.type === 'awning') {
          // Parisian Striped Bistro Awning Canopy
          ctx.fillStyle = '#065f46';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          const stripeW = 12;
          for (let sx = plat.x; sx < plat.x + plat.w; sx += stripeW * 2) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(sx, plat.y, stripeW, plat.h);
          }
          // Scalloped gold border at bottom
          ctx.fillStyle = '#d97706';
          ctx.fillRect(plat.x, plat.y + plat.h - 4, plat.w, 4);
          ctx.strokeStyle = '#042f2e';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        } else if (plat.type === 'crumble') {
          // Historic Crumbling Stone Ledge with Cracks
          const shakeOff = plat.crumbleTimer ? Math.sin(plat.crumbleTimer * 2.5) * 2.2 : 0;
          ctx.fillStyle = '#57534e';
          ctx.fillRect(plat.x, plat.y + shakeOff, plat.w, plat.h);
          ctx.fillStyle = '#78716c';
          ctx.fillRect(plat.x, plat.y + shakeOff, plat.w, 3);
          // Cracks
          ctx.strokeStyle = '#292524';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(plat.x + 12, plat.y + shakeOff);
          ctx.lineTo(plat.x + 22, plat.y + plat.h + shakeOff);
          ctx.moveTo(plat.x + plat.w - 18, plat.y + shakeOff);
          ctx.lineTo(plat.x + plat.w - 28, plat.y + plat.h + shakeOff);
          ctx.stroke();
        } else if (plat.type === 'stream') {
          // Rapid Sewer Water Stream Platform
          ctx.fillStyle = '#0f3a2c';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          // Animated ripples
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 1.6;
          const streamOff = (Date.now() / 50) % 24;
          for (let rx = plat.x - streamOff; rx < plat.x + plat.w; rx += 24) {
            ctx.beginPath();
            ctx.moveTo(rx, plat.y + 4);
            ctx.lineTo(rx + 14, plat.y + 4);
            ctx.stroke();
          }
        }
        ctx.restore();
      });

      // Draw Interactive World Props (View-Frustum Culled)
      g.worldProps.forEach((prop) => {
        if (!prop.active) return;
        if (prop.x + prop.w < camX - 60 || prop.x > camX + width + 60) return;
        ctx.save();

        if (prop.type === 'lantern') {
          // Vintage Street Lamp Post & Bouncing Lantern
          ctx.translate(prop.x + prop.w / 2, prop.y + prop.h);
          if (prop.sway && prop.sway > 0) {
            ctx.rotate(Math.sin(Date.now() / 80) * 0.25 * prop.sway);
          }
          ctx.translate(-(prop.x + prop.w / 2), -(prop.y + prop.h));

          // Cast-iron pole
          ctx.fillStyle = '#292524';
          ctx.fillRect(prop.x + prop.w / 2 - 3, prop.y + 12, 6, prop.h - 12);

          // Top lantern cage
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(prop.x + 2, prop.y, prop.w - 4, 4); // Roof cap
          ctx.fillRect(prop.x + prop.w / 2 - 2, prop.y - 4, 4, 4); // Finial loop

          // Glass chamber glow
          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.lanternGlow, prop.x + prop.w / 2 - 32, prop.y + 8 - 32);
          } else {
            const lanternGlow = ctx.createRadialGradient(
              prop.x + prop.w / 2,
              prop.y + 8,
              2,
              prop.x + prop.w / 2,
              prop.y + 8,
              28
            );
            lanternGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
            lanternGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.4)');
            lanternGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = lanternGlow;
            ctx.beginPath();
            ctx.arc(prop.x + prop.w / 2, prop.y + 8, 28, 0, Math.PI * 2);
            ctx.fill();
          }

          // Glass core
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(prop.x + 5, prop.y + 4, prop.w - 10, 12);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(prop.x + 5, prop.y + 4, prop.w - 10, 12);
        } else if (prop.type === 'flag_spring') {
          // Revolutionary Tricolor Spring
          const fx = prop.x;
          const fy = prop.y;
          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.flagSpring, fx, fy);
          } else {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(fx + 4, fy + 8, prop.w - 8, 10);
          }
        } else if (prop.type === 'steam_vent') {
          // Paris Sewer Iron Steam Grating
          const vx = prop.x;
          const vy = prop.y;
          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.steamVent, vx, vy);
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(vx, vy, prop.w, prop.h);
          }

          // Steam vent internal eerie green/blue glow & steam jet
          const isErupting = ((prop.timer || 0) % 140) > 40;
          if (isErupting) {
            if (spriteAtlas) {
              ctx.drawImage(spriteAtlas.steamGlow, vx + 4, vy - 120, prop.w - 8, 120);
            } else {
              const steamGlow = ctx.createLinearGradient(vx, vy, vx, vy - 120);
              steamGlow.addColorStop(0, 'rgba(148, 163, 184, 0.45)');
              steamGlow.addColorStop(0.5, 'rgba(203, 213, 225, 0.25)');
              steamGlow.addColorStop(1, 'rgba(241, 245, 249, 0)');
              ctx.fillStyle = steamGlow;
              ctx.fillRect(vx + 4, vy - 120, prop.w - 8, 120);
            }
          }
        } else if (prop.type === 'crate') {
          // Destructible Supply Crate
          const cx = prop.x;
          const cy = prop.y;
          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.crate, cx, cy);
          } else {
            ctx.fillStyle = '#92400e';
            ctx.fillRect(cx, cy, prop.w, prop.h);
          }
        } else if (prop.type === 'iron_crate') {
          // Reinforced Iron Armory Crate (Shows dented when durability === 1)
          const cx = prop.x;
          const cy = prop.y;
          if (spriteAtlas) {
            const isDented = prop.durability === 1;
            ctx.drawImage(isDented ? spriteAtlas.ironCrateDented : spriteAtlas.ironCrate, cx, cy);
          } else {
            ctx.fillStyle = '#334155';
            ctx.fillRect(cx, cy, prop.w, prop.h);
          }
        } else if (prop.type === 'relic_chest') {
          // Bishop's Gilded Relic Chest
          const cx = prop.x;
          const cy = prop.y;
          const auraPulse = Math.sin(Date.now() / 250) * 0.25 + 0.75;
          const glowGrad = ctx.createRadialGradient(cx + 17, cy + 16, 4, cx + 17, cy + 16, 26);
          glowGrad.addColorStop(0, `rgba(254, 240, 138, ${0.4 * auraPulse})`);
          glowGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = glowGrad;
          ctx.fillRect(cx - 10, cy - 10, prop.w + 20, prop.h + 20);

          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.relicChest, cx, cy);
          } else {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(cx, cy, prop.w, prop.h);
          }
        } else if (prop.type === 'damp_crate') {
          // Mossy Sewer Cistern Crate
          const cx = prop.x;
          const cy = prop.y;
          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.dampCrate, cx, cy);
          } else {
            ctx.fillStyle = '#1e3a34';
            ctx.fillRect(cx, cy, prop.w, prop.h);
          }
        } else if (prop.type === 'booby_crate') {
          // Booby-trapped Hazard TNT Crate
          const cx = prop.x;
          const cy = prop.y;
          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.boobyCrate, cx, cy);
          } else {
            ctx.fillStyle = '#78350f';
            ctx.fillRect(cx, cy, prop.w, prop.h);
          }
          if (prop.isArmed && prop.fuseTimer !== undefined && prop.fuseTimer > 0) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx + prop.w / 2, cy - 3, 3.5 + Math.sin(Date.now() / 30) * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (prop.type === 'powder_keg') {
          // Explosive Barricade Powder Keg
          const kx = prop.x;
          const ky = prop.y;
          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.powderKeg, kx, ky);
          } else {
            ctx.fillStyle = '#451a03';
            ctx.fillRect(kx, ky, prop.w, prop.h);
          }

          // Sparking fuse flame (smooth breathing pulse, zero random jitter)
          const isFuseActive = prop.fuseTimer !== undefined && prop.fuseTimer > 0;
          const sparkSize = isFuseActive ? 3.5 + Math.sin(Date.now() / 40) * 1.5 : 2.2;
          ctx.fillStyle = isFuseActive ? '#ef4444' : '#f59e0b';
          ctx.beginPath();
          ctx.arc(kx + prop.w / 2 + 3, ky - 4, Math.max(1.5, sparkSize), 0, Math.PI * 2);
          ctx.fill();
        } else if (prop.type === 'manhole') {
          // Paris Sewer Cast-Iron Manhole Cover & Iron Rung Ladder Down
          const mx = prop.x;
          const my = prop.y;
          if (spriteAtlas) {
            ctx.drawImage(spriteAtlas.manhole, mx, my);
          } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(mx, my, prop.w, prop.h);
          }

          // Extended Iron Ladder extending downwards through stone bedrock (y: 360 to 420)
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(mx + 8, my + 10);
          ctx.lineTo(mx + 8, my + 64);
          ctx.moveTo(mx + prop.w - 8, my + 10);
          ctx.lineTo(mx + prop.w - 8, my + 64);
          for (let ry = my + 18; ry <= my + 60; ry += 10) {
            ctx.moveTo(mx + 8, ry);
            ctx.lineTo(mx + prop.w - 8, ry);
          }
          ctx.stroke();

          // If Ambush Gendarme is guarding this exit on the street!
          if (prop.hasAmbush && !prop.ambushDefeated) {
            // Silhouette of ambush gendarme guarding with rifle & lantern
            const gx = mx + 16;
            const gy = my - 34;
            // Bicorne hat
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(gx + 8, gy - 2, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head & Glowing Red Alert Eye
            ctx.fillStyle = '#f87171';
            ctx.fillRect(gx + 5, gy + 3, 3, 3);
            // Uniform Coat
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(gx + 2, gy + 8, 14, 24);
            // Rifle barrel
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(gx - 2, gy + 30);
            ctx.lineTo(gx - 2, gy - 8);
            ctx.stroke();

            // Ambush red glow
            ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
            ctx.beginPath();
            ctx.arc(gx + 8, gy + 14, 24, 0, Math.PI * 2);
            ctx.fill();
          }

          // Interactive HUD prompts based on player depth
          const isPlayerNear = Math.abs(player.x + player.w / 2 - (mx + prop.w / 2)) < 36;
          const bob = Math.sin(Date.now() / 150) * 3;

          if (isPlayerNear && player.y < 350) {
            // On street: prompt to enter sewer
            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('⬇ [S/下鍵] 沿梯潛入暗道', mx + prop.w / 2, my - 6 + bob);
          } else if (isPlayerNear && player.y >= 350) {
            // Down in sewer: prompt to climb back up or warn of ambush
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            if (prop.hasAmbush && !prop.ambushDefeated) {
              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 11px sans-serif';
              ctx.fillText('🚨 [上方埋伏！] 按[X/J]彈弓暗算 或 [W/↑]強登', mx + prop.w / 2, my + 30 + bob);
            } else {
              ctx.fillStyle = '#38bdf8';
              ctx.font = 'bold 11px sans-serif';
              ctx.fillText('⬆ [W/上鍵] 攀爬回街頭', mx + prop.w / 2, my + 30 + bob);
            }
          }
        } else if (prop.type === 'valve_lever') {
          // Emergency Sluice Release Valve (Brass Cog Wheel & Steam Valve Pipe)
          const vx = prop.x;
          const vy = prop.y;
          const isPulled = g.dynamicEvent.valvePulled;
          // Steam Pipe Backing
          ctx.fillStyle = '#475569';
          ctx.fillRect(vx + 12, vy - 10, 8, 38);
          // Pipe Flange
          ctx.fillStyle = '#334155';
          ctx.fillRect(vx + 8, vy + 24, 16, 4);

          // Brass Valve Wheel
          ctx.save();
          ctx.translate(vx + 16, vy + 12);
          if (!isPulled) {
            ctx.rotate(Date.now() / 250);
          }
          ctx.fillStyle = isPulled ? '#10b981' : '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, 0, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          // Wheel Spokes
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-13, 0); ctx.lineTo(13, 0);
          ctx.moveTo(0, -13); ctx.lineTo(0, 13);
          ctx.stroke();
          ctx.restore();

          // Pulse Glow & Pull Prompt
          if (!isPulled) {
            const bob = Math.sin(Date.now() / 120) * 3;
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('⚙️ 觸碰拉開洩洪閥', vx + 16, vy - 16 + bob);
          }
        } else if (prop.type === 'sluice_gate') {
          // Heavy Iron Sluice Drop-Gate (Rivet Plates & Vertical Bars)
          const gx = prop.x;
          const gy = prop.y;
          const gh = prop.gateHeight ?? 90;

          // Iron frame track
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(gx - 3, gy - 20, prop.w + 6, 120);

          // Moving iron gate slab
          ctx.fillStyle = '#334155';
          ctx.fillRect(gx, gy, prop.w, gh);

          // Vertical iron rebar slats
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(gx + 4, gy); ctx.lineTo(gx + 4, gy + gh);
          ctx.moveTo(gx + prop.w - 4, gy); ctx.lineTo(gx + prop.w - 4, gy + gh);
          ctx.stroke();

          // Cross beams & brass rivets
          ctx.fillStyle = '#1e293b';
          for (let ry = gy + 8; ry < gy + gh - 4; ry += 16) {
            ctx.fillRect(gx, ry, prop.w, 4);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(gx + 2, ry + 1, 2, 2);
            ctx.fillRect(gx + prop.w - 4, ry + 1, 2, 2);
            ctx.fillStyle = '#1e293b';
          }

          // Danger Warning Light at top of gate
          ctx.fillStyle = prop.isOpening ? '#22c55e' : '#ef4444';
          ctx.beginPath();
          ctx.arc(gx + prop.w / 2, gy - 8, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Draw Lower Sewer Water Current stream (y: 418~450, strictly anchored to world coordinates)
      ctx.save();
      if (spriteAtlas) {
        ctx.drawImage(spriteAtlas.water, camX - 60, 418, width + 120, 32);
      } else {
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(camX - 60, 418, width + 120, 32);
      }

      // Flowing water surface ripples (aligned to fixed world grid with smooth downstream drift)
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.65)';
      ctx.lineWidth = 1.5;
      const startGridX = Math.floor((camX - 60) / 48) * 48;
      const flowOffset = (Date.now() / 40) % 48;
      for (let wx = startGridX - 48; wx < camX + width + 48; wx += 48) {
        const rippleX = wx + flowOffset;
        ctx.beginPath();
        ctx.moveTo(rippleX, 420);
        ctx.quadraticCurveTo(rippleX + 12, 417.5, rippleX + 24, 420);
        ctx.stroke();
      }

      // Toxic sewer gas bubbles floating up (anchored to fixed world columns, zero jitter)
      ctx.fillStyle = 'rgba(110, 231, 183, 0.45)';
      const startBubbleX = Math.floor((camX - 60) / 80) * 80;
      const nowSec = Date.now() / 1000;
      for (let bx = startBubbleX; bx < camX + width + 80; bx += 80) {
        const colSeed = Math.abs(Math.floor(bx / 80));
        const cycle = (nowSec * 1.2 + colSeed * 0.7) % 1;
        const bubbleY = 442 - cycle * 22;
        const bubbleX = bx + 40 + Math.sin(nowSec * 2 + colSeed) * 4;
        const bubbleRadius = 1.5 + (colSeed % 2) * 0.8;
        const bubbleAlpha = Math.sin(cycle * Math.PI) * 0.5;

        ctx.save();
        ctx.globalAlpha = Math.max(0, bubbleAlpha);
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, bubbleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Draw Mystery Blocks (View-Frustum Culled)
      g.mysteryBlocks.forEach((block) => {
        if (block.x + block.w < camX - 60 || block.x > camX + width + 60) return;
        const by = block.y + block.bounceOffset;

        if (spriteAtlas) {
          if (block.hit) {
            ctx.drawImage(spriteAtlas.mysteryBoxHit, block.x, by);
          } else if (block.isMimic) {
            ctx.drawImage(spriteAtlas.mimicBox, block.x, by);
          } else {
            ctx.drawImage(spriteAtlas.mysteryBox, block.x, by);
          }
        } else {
          ctx.fillStyle = block.hit ? '#57534e' : block.isMimic ? '#831843' : '#d97706';
          ctx.fillRect(block.x, by, block.w, block.h);
        }
      });

      // Draw Collectibles (View-Frustum Culled)
      g.collectibles.forEach((item) => {
        if (item.collected) return;
        if (item.x + item.w < camX - 60 || item.x > camX + width + 60) return;

        if (spriteAtlas) {
          if (item.type === 'bread') {
            ctx.drawImage(spriteAtlas.bread, item.x, item.y);
          } else if (item.type === 'coin') {
            ctx.drawImage(spriteAtlas.coin, item.x + 2, item.y + 2);
          } else if (item.type === 'slingshot') {
            ctx.drawImage(spriteAtlas.slingshot, item.x, item.y);
          } else if (item.type === 'shield') {
            ctx.drawImage(spriteAtlas.shield, item.x, item.y);
          } else if (item.type === 'candlestick') {
            ctx.drawImage(spriteAtlas.candlestick, item.x, item.y);
          } else if (item.type === 'heart') {
            ctx.drawImage(spriteAtlas.heart, item.x, item.y);
          }
        } else {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(item.x, item.y, item.w, item.h);
        }
      });

      // Draw Gavroche's Slingshot Pebbles (with Empowered Meteor & Holy Radiance effects)
      g.slingshotPebbles.forEach((pebble) => {
        ctx.save();
        if (pebble.isEmpowered) {
          // Blazing Meteor Strike from Melee Deflection
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 14;
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(pebble.x, pebble.y, pebble.radius + 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(pebble.x, pebble.y, pebble.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        } else if (pebble.isHoly) {
          // Holy Radiant Orb from Bishop's Grace
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(pebble.x, pebble.y, pebble.radius + 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pebble.x, pebble.y, pebble.radius * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Standard Pebble
          ctx.fillStyle = '#78716c';
          ctx.beginPath();
          ctx.arc(pebble.x, pebble.y, pebble.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        ctx.restore();
      });

      // Draw Javert's Handcuffs
      g.javertHandcuffs.forEach((hc) => {
        ctx.save();
        ctx.translate(hc.x, hc.y);
        ctx.rotate(hc.rot);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-7, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(7, 0, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-1, 0);
        ctx.lineTo(1, 0);
        ctx.stroke();
        ctx.restore();
      });

      // Draw Enemies (View-Frustum Culled)
      g.enemies.forEach((enemy) => {
        if (!enemy.alive && enemy.squashTime <= 0) return;
        if (enemy.x + enemy.w < camX - 80 || enemy.x > camX + width + 80) return;

        ctx.save();
        const ex = enemy.x;
        const ey = enemy.y;

        if (enemy.squashTime > 0) {
          // Stomped flat
          ctx.fillStyle = enemy.type === 'thenardier' ? '#78350f' : '#1e3a8a';
          ctx.fillRect(ex, ey + 30, enemy.w, 12);
          enemy.squashTime--;
        } else if (enemy.type === 'thenardier') {
          // Thénardier Robber & Pickpocket
          // Brown patchy coat
          ctx.fillStyle = '#78350f';
          ctx.fillRect(ex + 6, ey + 14, 20, 20);
          // Red tattered scarf
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(ex + 7, ey + 12, 18, 4);

          // Head
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(ex + 8, ey + 5, 16, 9);
          // Crooked hat
          ctx.fillStyle = '#451a03';
          ctx.fillRect(ex + 5, ey - 2, 22, 6);
          ctx.fillRect(ex + 3, ey + 3, 26, 2);

          // Sly eyes & mustache
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(enemy.vx > 0 ? ex + 18 : ex + 10, ey + 8, 3, 2);
          ctx.fillRect(enemy.vx > 0 ? ex + 15 : ex + 8, ey + 11, 7, 2);

          // Stolen goods sack on back
          ctx.fillStyle = '#ca8a04';
          const sackX = enemy.vx > 0 ? ex - 2 : ex + 20;
          ctx.beginPath();
          ctx.arc(sackX + 6, ey + 22, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Quick scampering legs
          ctx.fillStyle = '#292524';
          const scurPhase = Math.sin(Date.now() / 70);
          ctx.fillRect(ex + 8, ey + 34, 5, 8 + scurPhase * 3);
          ctx.fillRect(ex + 18, ey + 34, 5, 8 - scurPhase * 3);

          // Fleeing Thief Countdown & Loot Tag
          if (enemy.isMimicThief && enemy.fleeTimer !== undefined && enemy.fleeTimer > 0) {
            const ratio = enemy.fleeTimer / 210;
            // Circular timer ring above head
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(ex + enemy.w / 2, ey - 10, 7, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2);
            ctx.stroke();

            // Stolen bread count tag
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`🥖x${enemy.stolenBread || 4}`, ex + enemy.w / 2, ey - 16);
          }
        } else if (enemy.type === 'elite_sergeant') {
          // --- Elite Sergeant (Heavy Brass Cuirass, Feathered Bicorne & Sabre) ---
          const isStaggered = (enemy.staggerTimer ?? 0) > 0;
          const isCracked = (enemy.hp ?? 2) <= 1;

          // Vibration if staggered
          const stagOffset = isStaggered ? (Math.random() - 0.5) * 4 : 0;
          const drawEx = ex + stagOffset;

          // Heavy Officer Coat (Deep Navy with Gold Epaulettes)
          ctx.fillStyle = isStaggered ? '#fef08a' : '#0f172a';
          ctx.fillRect(drawEx + 5, ey + 13, 22, 21);

          // Golden Epaulettes on shoulders
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(drawEx + 3, ey + 13, 5, 4);
          ctx.fillRect(drawEx + 24, ey + 13, 5, 4);

          // Armor Cuirass (Polished Gold/Brass if intact, cracked gunmetal if broken)
          if (isCracked) {
            ctx.fillStyle = '#475569';
            ctx.fillRect(drawEx + 7, ey + 16, 18, 16);
            // Red jagged crack line
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(drawEx + 11, ey + 18);
            ctx.lineTo(drawEx + 15, ey + 24);
            ctx.lineTo(drawEx + 20, ey + 30);
            ctx.stroke();
          } else {
            ctx.fillStyle = '#eab308';
            ctx.fillRect(drawEx + 7, ey + 16, 18, 16);
            // Armor highlight sheen
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(drawEx + 10, ey + 18, 3, 12);
            // Steel rivet trim
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(drawEx + 8, ey + 30, 16, 2);
          }

          // Face
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(drawEx + 9, ey + 5, 14, 10);
          // Fierce Officer Mustache
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(enemy.vx > 0 ? drawEx + 14 : drawEx + 9, ey + 11, 8, 2);

          // Bicorne Officer Hat with Gold Trim
          ctx.fillStyle = '#090d16';
          ctx.fillRect(drawEx + 4, ey - 2, 24, 7);
          ctx.fillStyle = '#f59e0b'; // Gold border
          ctx.fillRect(drawEx + 4, ey + 4, 24, 2);

          // Red Officer Plume swaying on hat
          ctx.fillStyle = '#dc2626';
          const plumeSway = Math.sin(Date.now() / 90) * 2;
          ctx.beginPath();
          ctx.moveTo(drawEx + 16, ey - 2);
          ctx.quadraticCurveTo(drawEx + 16 + plumeSway * 2, ey - 10, drawEx + 12 + plumeSway * 3, ey - 14);
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = '#ef4444';
          ctx.stroke();

          // Tall Cavalry Boots
          ctx.fillStyle = '#1e293b';
          const walkPhase = Math.sin(Date.now() / 110);
          ctx.fillRect(drawEx + 7, ey + 34, 7, 8 + walkPhase * 2.5);
          ctx.fillRect(drawEx + 18, ey + 34, 7, 8 - walkPhase * 2.5);

          // Officer Sabre (Steel blade with gold guard)
          const sabreRight = enemy.vx > 0;
          ctx.fillStyle = '#facc15';
          ctx.fillRect(sabreRight ? drawEx + 24 : drawEx + 2, ey + 20, 5, 4); // Guard
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(sabreRight ? drawEx + 28 : drawEx - 4, ey + 14, sabreRight ? 12 : -12, 3); // Blade

          // Overhead HP Badge
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          if (isCracked) {
            ctx.fillStyle = '#ef4444';
            ctx.fillText('🛡️ [破甲狂暴!]', drawEx + enemy.w / 2, ey - 18);
          } else {
            ctx.fillStyle = '#facc15';
            ctx.fillText('🛡️🛡️ [精銳重甲]', drawEx + enemy.w / 2, ey - 18);
          }
        } else if (enemy.type === 'grenadier') {
          // --- Grenadier (Bearskin Shako, Forest Green Coat, Tear Gas Grenade) ---
          // Dark Prussian Green military coat
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(ex + 6, ey + 14, 20, 20);

          // White chest cross-belts (X pattern)
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(ex + 8, ey + 14);
          ctx.lineTo(ex + 24, ey + 32);
          ctx.moveTo(ex + 24, ey + 14);
          ctx.lineTo(ex + 8, ey + 32);
          ctx.stroke();

          // Face
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(ex + 9, ey + 6, 14, 9);

          // Tall Imperial Bearskin Hat
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(ex + 6, ey - 8, 20, 15);
          // Brass Grenade Plate emblem on bearskin
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(ex + 16, ey - 1, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Legs walking
          ctx.fillStyle = '#0f172a';
          const walkPhase = Math.sin(Date.now() / 120);
          ctx.fillRect(ex + 8, ey + 34, 6, 8 + walkPhase * 2);
          ctx.fillRect(ex + 18, ey + 34, 6, 8 - walkPhase * 2);

          // Held Gas Grenade in hand with sparkling orange fuse!
          const handRight = enemy.vx > 0;
          const bombX = handRight ? ex + 26 : ex + 2;
          const bombY = ey + 22;
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(bombX, bombY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#22c55e'; // Green seal band
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Sizzling orange fuse spark
          ctx.fillStyle = Math.random() > 0.5 ? '#f97316' : '#facc15';
          ctx.fillRect(bombX - 1, bombY - 7, 3, 3);

          // Throwing cooldown telegraph alert
          if ((enemy.throwCooldown || 0) > 140) {
            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('💣 瓦斯準備!', ex + enemy.w / 2, ey - 12);
          }
        } else {
          // French Police Gendarme
          // Blue uniform coat
          ctx.fillStyle = '#1e3a8a';
          ctx.fillRect(ex + 6, ey + 14, 20, 20);

          // White cross-belt
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ex + 8, ey + 14);
          ctx.lineTo(ex + 24, ey + 32);
          ctx.stroke();

          // Face
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(ex + 9, ey + 6, 14, 10);

          // Shako / Bicorne Police Hat
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(ex + 5, ey, 22, 8);
          // Red cockade on hat
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(ex + 14, ey + 2, 4, 4);

          // Legs walking
          ctx.fillStyle = '#0f172a';
          const walkPhase = Math.sin(Date.now() / 120);
          ctx.fillRect(ex + 8, ey + 34, 6, 8 + walkPhase * 2);
          ctx.fillRect(ex + 18, ey + 34, 6, 8 - walkPhase * 2);

          // Police Baton in hand
          ctx.fillStyle = '#78350f';
          ctx.fillRect(enemy.vx > 0 ? ex + 24 : ex + 2, ey + 18, 4, 16);
        }
        ctx.restore();
      });

      // --- Draw Enemy Projectiles (Tear Gas Canisters & Thénardier Caltrops) ---
      g.enemyProjectiles.forEach((proj) => {
        if (proj.type === 'caltrop') {
          ctx.save();
          ctx.translate(proj.x, proj.y);
          ctx.rotate(proj.rot);
          // 3-pronged spiked forged caltrop star
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(0, -9);
          ctx.moveTo(0, 0); ctx.lineTo(-7, 6);
          ctx.moveTo(0, 0); ctx.lineTo(7, 6);
          ctx.stroke();
          // Blood-red / steel pointed tip glints
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-1.5, -10, 3, 3);
          ctx.fillRect(-8, 5, 3, 3);
          ctx.fillRect(5, 5, 3, 3);
          ctx.restore();
          return;
        }

        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.rot);

        // Canister cylinder body
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-6, -9, 12, 18);
        // Toxic green band
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-6, -2, 12, 5);
        // Top nozzle
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-3, -12, 6, 3);

        ctx.restore();

        // Surrounding hazardous vapor glow (Offscreen pre-baked texture)
        if (spriteAtlas) {
          ctx.drawImage(spriteAtlas.toxicGlow, proj.x - 18, proj.y - 18);
        } else {
          ctx.save();
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, 14, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(74, 222, 128, 0.22)';
          ctx.fill();
          ctx.restore();
        }
      });

      // --- Draw Mortar Strikes & Warning Reticles (Barricade Crisis Event) ---
      g.mortarStrikes.forEach((strike) => {
        // Red hazard impact zone ellipse on street
        ctx.save();
        const pulse = Math.sin(Date.now() / 80) * 0.25 + 0.75;
        ctx.beginPath();
        ctx.ellipse(strike.targetX, strike.targetY, 38, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239, 68, 68, ${0.28 * pulse})`;
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();

        // Crosshair beacon in center
        ctx.beginPath();
        ctx.moveTo(strike.targetX - 16, strike.targetY);
        ctx.lineTo(strike.targetX + 16, strike.targetY);
        ctx.moveTo(strike.targetX, strike.targetY - 8);
        ctx.lineTo(strike.targetX, strike.targetY + 8);
        ctx.stroke();

        // Pulsing Warning Tag
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ 砲擊警戒', strike.targetX, strike.targetY - 14);
        ctx.restore();

        // Falling mortar artillery shell
        if (strike.warningTimer <= 20 && !strike.exploded) {
          ctx.save();
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.ellipse(strike.targetX, strike.shellY, 4, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          // Fiery tail
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(strike.targetX - 3, strike.shellY - 6);
          ctx.lineTo(strike.targetX + 3, strike.shellY - 6);
          ctx.lineTo(strike.targetX, strike.shellY - 16);
          ctx.fill();
          ctx.restore();
        }
      });

      // --- Offscreen Hazard Indicators (Right Screen Edge Telegraphing) ---
      // Ensures high-speed mobile runners never face cheap offscreen surprise hits!
      const rightEdgeX = camX + width;
      g.enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        if (enemy.x > rightEdgeX && enemy.x < rightEdgeX + 320) {
          if (enemy.type === 'elite_sergeant' || enemy.type === 'grenadier') {
            ctx.save();
            ctx.fillStyle = enemy.type === 'elite_sergeant' ? '#f59e0b' : '#10b981';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'right';
            const alertText = enemy.type === 'elite_sergeant' ? '▶ ⚔️ 精銳隊長' : '▶ 💣 擲彈兵';
            ctx.fillText(alertText, rightEdgeX - 12, enemy.y + 18);
            ctx.restore();
          }
        }
      });
      g.mortarStrikes.forEach((strike) => {
        if (!strike.exploded && strike.targetX > rightEdgeX && strike.targetX < rightEdgeX + 320) {
          ctx.save();
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText('▶ 🚨 迫擊砲擊', rightEdgeX - 12, 340);
          ctx.restore();
        }
      });

      // Draw Ghost Motion Trails (Dash & Grace Kinetic Silhouettes)
      g.ghostTrails.forEach((trail) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, trail.alpha);
        const tAnchorX = trail.x + player.w / 2;
        const tAnchorY = trail.y + player.h;
        ctx.translate(tAnchorX, tAnchorY);
        ctx.scale(trail.scaleX, trail.scaleY);
        ctx.translate(-tAnchorX, -tAnchorY);

        // Ghost Silhouette (Golden glow if Grace mode, Cyan/Amber if Sprint)
        ctx.fillStyle = trail.isGrace ? '#fef08a' : '#38bdf8';
        ctx.fillRect(trail.x + 6, trail.y + 16, 24, 24);
        ctx.fillRect(trail.x + 10, trail.y + 5, 16, 12);
        ctx.fillRect(trail.x + 8, trail.y, 20, 6);
        ctx.fillRect(trail.x + 8, trail.y + 40, 7, 12);
        ctx.fillRect(trail.x + 21, trail.y + 40, 7, 12);
        ctx.restore();
      });

      // Draw Player (尚萬強 Jean Valjean - 24601)
      ctx.save();
      const px = player.x;
      const py = player.y;

      // Apply Squash and Stretch around player bottom-center anchor
      const anchorX = px + player.w / 2;
      const anchorY = py + player.h;
      ctx.translate(anchorX, anchorY);
      ctx.scale(g.squashStretch.scaleX, g.squashStretch.scaleY);
      ctx.translate(-anchorX, -anchorY);

      // Invincible Grace Mode Halo & Sparkles (Offscreen pre-baked texture)
      if (player.graceTimer > 0) {
        if (spriteAtlas) {
          const auraPulse = Math.sin(Date.now() / 80) * 6;
          const aSize = 96 + auraPulse;
          ctx.drawImage(
            spriteAtlas.graceAura,
            px + player.w / 2 - aSize / 2,
            py + player.h / 2 - aSize / 2,
            aSize,
            aSize
          );
        } else {
          const auraRadius = 36 + Math.sin(Date.now() / 80) * 4;
          const auraGrad = ctx.createRadialGradient(
            px + player.w / 2,
            py + player.h / 2,
            10,
            px + player.w / 2,
            py + player.h / 2,
            auraRadius
          );
          auraGrad.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
          auraGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.4)');
          auraGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(px + player.w / 2, py + player.h / 2, auraRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Cosette's Shield Bubble Aura
      if (g.hasCosetteShield) {
        const bubbleRad = 32 + Math.sin(Date.now() / 110) * 3;
        ctx.save();
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = 'rgba(251, 207, 232, 0.2)';
        ctx.beginPath();
        ctx.arc(px + player.w / 2, py + player.h / 2, bubbleRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3 orbiting protective flower petals
        for (let i = 0; i < 3; i++) {
          const ang = Date.now() / 350 + (i * Math.PI * 2) / 3;
          const pxPetal = px + player.w / 2 + Math.cos(ang) * (bubbleRad + 3);
          const pyPetal = py + player.h / 2 + Math.sin(ang) * (bubbleRad + 3);
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(pxPetal, pyPetal, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Hurt Flash
      if (player.invincibleFlash % 6 > 3) {
        // Skip drawing frame for flashing effect
      } else {
        // Valjean Sprite (Vector Drawn 16-bit Aesthetic)
        const isFacing = player.facingRight;
        const walkCycle = Math.sin(Date.now() / 90);

        // Brown worker long coat
        ctx.fillStyle = player.graceTimer > 0 ? '#b45309' : '#573318';
        ctx.fillRect(px + 6, py + 16, 24, 24);

        // Fluttering Coat Tail behind
        ctx.beginPath();
        ctx.moveTo(px + (isFacing ? 6 : 30), py + 26);
        ctx.lineTo(px + (isFacing ? -8 : 44) - (player.vx * 2), py + 42);
        ctx.lineTo(px + (isFacing ? 12 : 24), py + 40);
        ctx.fill();

        // White Scarf / Convict Collar with 24601 yellow ribbon
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(px + (isFacing ? 10 : 18), py + 14, 8, 5);

        // Face / Head
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(px + 10, py + 5, 16, 12);

        // Cap / Hair (Dark grey worker flat cap)
        ctx.fillStyle = '#292524';
        ctx.fillRect(px + 8, py, 20, 6);
        ctx.fillRect(px + (isFacing ? 12 : 4), py + 4, 20, 3); // Brim

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px + (isFacing ? 20 : 12), py + 9, 3, 3);

        // Legs & Boots
        ctx.fillStyle = '#1c1917';
        if (player.isGrounded) {
          ctx.fillRect(px + 8, py + 40, 7, 12 + walkCycle * 3);
          ctx.fillRect(px + 21, py + 40, 7, 12 - walkCycle * 3);
        } else {
          // Jumping pose (tucked knees)
          ctx.fillRect(px + 8, py + 38, 7, 9);
          ctx.fillRect(px + 21, py + 36, 7, 9);
        }

        // Silver Candlestick in Hand (when held or in Grace)
        if (player.graceTimer > 0 || g.candlestickCount > 0) {
          const handX = isFacing ? px + 28 : px + 2;
          const handY = py + 20;
          // Silver Base
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(handX, handY, 4, 12);
          ctx.fillRect(handX - 2, handY + 10, 8, 3);
          // Candle Flame
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(handX + 2, handY - 3, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(handX + 2, handY - 3, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore(); // Restore Player Sprite Context

      // Draw 3-Stage Melee Slash Visual FX & Downward Helm Splitter
      if (player.attackTotalTimer > 0) {
        ctx.save();
        const isFacing = player.facingRight;
        const slashCenterX = isFacing ? player.x + player.w + 14 : player.x - 14;
        const slashCenterY = player.y + player.h * 0.45;

        if (player.isHelmSplitter) {
          // Downward Helm Splitter (Golden Blade Plunge & Sonic Shockwave)
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(player.x + player.w / 2, player.y - 10);
          ctx.lineTo(player.x + player.w / 2, player.y + player.h + 24);
          ctx.stroke();

          ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
          ctx.beginPath();
          ctx.moveTo(player.x + player.w / 2 - 12, player.y);
          ctx.lineTo(player.x + player.w / 2 + 12, player.y);
          ctx.lineTo(player.x + player.w / 2, player.y + player.h + 28);
          ctx.closePath();
          ctx.fill();
        } else if (player.comboStage === 3) {
          // Stage 3 Ground Heavy Finisher (Wide Fiery Crescent Arc)
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 5;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          const startAngle = isFacing ? -Math.PI * 0.45 : Math.PI * 0.55;
          const endAngle = isFacing ? Math.PI * 0.45 : Math.PI * 1.45;
          ctx.arc(slashCenterX, slashCenterY, 36, startAngle, endAngle);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(slashCenterX, slashCenterY, 34, startAngle, endAngle);
          ctx.stroke();
        } else if (player.comboStage === 2) {
          // Stage 2 Sweeping Blade Arc
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          const startAngle = isFacing ? -Math.PI * 0.35 : Math.PI * 0.65;
          const endAngle = isFacing ? Math.PI * 0.35 : Math.PI * 1.35;
          ctx.arc(slashCenterX, slashCenterY, 28, startAngle, endAngle);
          ctx.stroke();
        } else {
          // Stage 1 Fast Horizontal Sweep
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          const startAngle = isFacing ? -Math.PI * 0.3 : Math.PI * 0.7;
          const endAngle = isFacing ? Math.PI * 0.3 : Math.PI * 1.3;
          ctx.arc(slashCenterX, slashCenterY, 24, startAngle, endAngle);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw Particles (Dust, Sparks, Shockwave Rings - Render only, no state mutation)
      g.particles.forEach((p) => {
        const progress = Math.min(1, Math.max(0, p.life / p.maxLife));
        const currentAlpha = Math.max(0, p.alpha * (1 - progress));

        if (p.type === 'ring') {
          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2.0 * (1 - progress);
          ctx.globalAlpha = currentAlpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + progress * 20, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, p.size * (1 - progress * 0.4)), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Floating Notification Texts (with Crisp Shadow Outlines & In-place Zero-GC)
      let aliveTextCount = 0;
      for (let fti = 0; fti < g.floatingTexts.length; fti++) {
        const ft = g.floatingTexts[fti];
        ctx.save();
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.globalAlpha = Math.max(0, ft.opacity);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
        ft.y -= 1;
        ft.opacity -= 0.02;
        if (ft.opacity > 0) {
          g.floatingTexts[aliveTextCount++] = ft;
        }
      }
      g.floatingTexts.length = aliveTextCount;

      // --- Dynamic Scheme 3: Citizen Revolutionary Uprising Barricade ---
      if (g.citizenSupportTimer > 0) {
        ctx.save();
        const barricadeX = Math.max(g.cameraX + 40, player.x - 170);
        const barricadeY = 320;

        // Wooden crates & overturned cart
        ctx.fillStyle = '#78350f';
        ctx.fillRect(barricadeX - 25, barricadeY, 50, 40);
        ctx.fillRect(barricadeX - 10, barricadeY - 20, 28, 22);

        // Huge waving French Tricolor Flag
        const bWave = Math.sin(Date.now() / 120) * 5;
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(barricadeX - 6, barricadeY - 50 + bWave * 0.5, 12, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(barricadeX + 6, barricadeY - 50 + bWave * 0.7, 12, 22);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(barricadeX + 18, barricadeY - 50 + bWave, 12, 22);
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(barricadeX - 9, barricadeY - 56, 3, 56);

        // Parisian Rebel Citizen Silhouettes
        ctx.fillStyle = '#1e293b';
        // Citizen 1
        ctx.fillRect(barricadeX - 18, barricadeY - 14, 14, 20);
        ctx.beginPath();
        ctx.arc(barricadeX - 11, barricadeY - 20, 7, 0, Math.PI * 2);
        ctx.fill();
        // Red Phrygian cap
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(barricadeX - 13, barricadeY - 27, 8, 8);

        // Citizen cheer text floating
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('「前進，同胞們！」', barricadeX + 6, barricadeY - 60);

        ctx.restore();
      }

      // --- Dynamic Scheme 3: Gendarme Sweeping Searchlight ---
      if (g.javertDist < 48 && g.chapter !== 3) {
        ctx.save();
        const beamTargetX = g.cameraX + 360 + Math.sin(Date.now() / 600) * 220;
        const beamSourceX = g.cameraX + 60;
        const beamSourceY = 20;

        // Volumetric Cone Gradient
        const coneGrad = ctx.createLinearGradient(beamSourceX, beamSourceY, beamTargetX, 360);
        if (g.searchlightAlert) {
          coneGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
          coneGrad.addColorStop(0.8, 'rgba(239, 68, 68, 0.28)');
          coneGrad.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
        } else {
          coneGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
          coneGrad.addColorStop(0.8, 'rgba(253, 224, 71, 0.16)');
          coneGrad.addColorStop(1, 'rgba(253, 224, 71, 0.02)');
        }

        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(beamSourceX, beamSourceY);
        ctx.lineTo(beamTargetX - 70, 360);
        ctx.lineTo(beamTargetX + 70, 360);
        ctx.closePath();
        ctx.fill();

        // Spot on the ground
        ctx.fillStyle = g.searchlightAlert ? 'rgba(239, 68, 68, 0.35)' : 'rgba(253, 224, 71, 0.25)';
        ctx.beginPath();
        ctx.ellipse(beamTargetX, 360, 68, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Warning target lock reticle if caught!
        if (g.searchlightAlert) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.strokeRect(player.x - 4, player.y - 4, player.w + 8, player.h + 8);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️ 探照燈鎖定！', player.x + player.w / 2, player.y - 12);
        }

        ctx.restore();
      }

      ctx.restore(); // Restore World Space Transform

      // --- Theatrical Cinematic Vignette Overlay ---
      ctx.save();
      if (spriteAtlas) {
        ctx.drawImage(spriteAtlas.vignette, 0, 0, width, height);
      }
      ctx.restore();

      // --- Front HUD / Overlay (Screen Space) ---
      // 1. Citizen Uprising Banner (Screen Top-Center)
      if (g.citizenSupportTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
        ctx.beginPath();
        ctx.roundRect(width / 2 - 140, 14, 280, 26, 6);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `🚩 巴黎市民起義掩護中！ (${Math.ceil(g.citizenSupportTimer / 60)}s)`,
          width / 2,
          31
        );
        ctx.restore();
      }

      // 1b. Dynamic Encounter & Crisis Battlefield Banner & Ambience
      if (g.dynamicEvent.active) {
        ctx.save();
        const pulse = Math.sin(Date.now() / 150) * 0.12 + 0.28;

        if (g.dynamicEvent.type === 'pincer_ambush') {
          // Left & Right Flank Red Danger Warning Bands
          const flash = Math.sin(Date.now() / 90) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + flash * 0.2})`;
          ctx.fillRect(0, 0, 24, height);
          ctx.fillRect(width - 24, 0, 24, height);

          // Danger Arrows
          ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + flash * 0.4})`;
          ctx.font = 'bold 16px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('▶▶', 12, height / 2);
          ctx.fillText('◀◀', width - 12, height / 2);

          // Amber Ambush Banner
          ctx.fillStyle = 'rgba(217, 119, 6, 0.94)';
          ctx.beginPath();
          ctx.roundRect(width / 2 - 180, g.citizenSupportTimer > 0 ? 46 : 14, 360, 26, 6);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            `⚠️ 兩翼包夾！警笛大作！ (${Math.ceil(g.dynamicEvent.timer / 60)}s) 飛躍或火藥破局！`,
            width / 2,
            (g.citizenSupportTimer > 0 ? 46 : 14) + 17
          );
        } else if (g.dynamicEvent.type === 'sluice_lockdown') {
          // Sewer water rising haze
          ctx.fillStyle = `rgba(6, 182, 212, ${pulse * 0.25})`;
          ctx.fillRect(0, 0, width, height);

          // Cyan Sluice Gate Banner
          ctx.fillStyle = 'rgba(14, 116, 144, 0.94)';
          ctx.beginPath();
          ctx.roundRect(width / 2 - 180, g.citizenSupportTimer > 0 ? 46 : 14, 360, 26, 6);
          ctx.fill();
          ctx.strokeStyle = '#67e8f9';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            g.dynamicEvent.valvePulled
              ? '🕊️ 洩洪閥門已拉開！水閘升起中！'
              : `🚨 下水道水閘封鎖！ (${Math.ceil(g.dynamicEvent.timer / 60)}s) 踩石磚拉開頂部閥門！`,
            width / 2,
            (g.citizenSupportTimer > 0 ? 46 : 14) + 17
          );
        } else {
          // Battlefield orange-red haze
          ctx.fillStyle = `rgba(239, 68, 68, ${pulse * 0.3})`;
          ctx.fillRect(0, 0, width, height);

          // Crisis top banner
          ctx.fillStyle = 'rgba(185, 28, 28, 0.92)';
          ctx.beginPath();
          ctx.roundRect(width / 2 - 170, g.citizenSupportTimer > 0 ? 46 : 14, 340, 26, 6);
          ctx.fill();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            `🚨 街壘戰火砲擊危機！ (${Math.ceil(g.dynamicEvent.timer / 60)}s) 下水道可避難！`,
            width / 2,
            (g.citizenSupportTimer > 0 ? 46 : 14) + 17
          );
        }
        ctx.restore();
      }

      // 2. Searchlight Locked Alert Banner
      if (g.searchlightAlert) {
        ctx.save();
        ctx.fillStyle = 'rgba(185, 28, 28, 0.92)';
        ctx.beginPath();
        ctx.roundRect(width / 2 - 150, 46, 300, 24, 5);
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚨 被憲兵探照燈發現！立即躲入屋簷平台下！', width / 2, 62);
        ctx.restore();
      }

      // 3. Tension Vignette Pulse when Javert is closely pursuing (< 42m)
      if (g.javertDist < 42) {
        ctx.save();
        const vigRatio = 1 - (g.javertDist / 42); // 0 at 42m, 1 at 0m
        const pulse = 0.5 + Math.sin(Date.now() / 130) * 0.5;
        const alpha = Math.min(0.68, vigRatio * (0.26 + pulse * 0.38));
        const grad = ctx.createRadialGradient(
          width / 2, height / 2, width * 0.32,
          width / 2, height / 2, width * 0.68
        );
        grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        grad.addColorStop(0.7, `rgba(220, 38, 38, ${alpha * 0.55})`);
        grad.addColorStop(1, `rgba(185, 28, 28, ${alpha})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 4. Cinematic Story & Banter Dialogue Banner (Top Center)
      if (g.activeDialogue) {
        ctx.save();
        const diag = g.activeDialogue;
        const bannerW = 460;
        const bannerH = 46;
        const bannerX = width / 2 - bannerW / 2;
        const bannerY = 14;

        // Smooth fade-in & fade-out
        let alpha = 1;
        if (diag.timer > diag.maxTimer - 15) {
          alpha = (diag.maxTimer - diag.timer) / 15;
        } else if (diag.timer < 15) {
          alpha = diag.timer / 15;
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        // Glass container backdrop
        ctx.fillStyle = 'rgba(11, 15, 23, 0.94)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
        } else {
          ctx.rect(bannerX, bannerY, bannerW, bannerH);
        }
        ctx.fill();

        // Glowing border with character theme color
        ctx.strokeStyle = diag.themeColor || '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Left accent strip
        ctx.fillStyle = diag.themeColor || '#f59e0b';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(bannerX + 2, bannerY + 2, 4, bannerH - 4, [6, 0, 0, 6]);
        } else {
          ctx.fillRect(bannerX + 2, bannerY + 2, 4, bannerH - 4);
        }
        ctx.fill();

        // Circular portrait badge
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.beginPath();
        ctx.arc(bannerX + 26, bannerY + bannerH / 2, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = diag.themeColor || '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Portrait Emoji
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(diag.avatarIcon, bannerX + 26, bannerY + bannerH / 2 + 1);

        // Speaker Name & Tag
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = diag.themeColor || '#f59e0b';
        ctx.fillText(diag.speakerName, bannerX + 50, bannerY + 17);

        // Tag pill
        ctx.font = 'bold 9px monospace';
        ctx.fillStyle = diag.tagColor || '#ef4444';
        const nameW = ctx.measureText(diag.speakerName).width;
        ctx.fillText(`[${diag.tag}]`, bannerX + 50 + nameW + 8, bannerY + 17);

        // Dialogue Quote Text
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(diag.text, bannerX + 50, bannerY + 34);

        ctx.restore();
      }

      // 5. Javert Distance Indicator Bar at Bottom
      const javertX = Math.max(10, Math.min(220, (g.javertDist / 100) * 220));
      const isCritical = g.javertDist < 35;
      ctx.fillStyle = isCritical ? 'rgba(45, 10, 15, 0.9)' : 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(16, height - 32, 280, 22);
      ctx.strokeStyle = isCritical ? '#ef4444' : 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = isCritical ? 1.5 : 1;
      ctx.strokeRect(16, height - 32, 280, 22);

      // Javert marker text
      ctx.fillStyle = isCritical ? '#f87171' : '#ef4444';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`👮 賈維爾 (${Math.round(g.javertDist)}m)`, 22, height - 17);

      // Distance gauge line
      ctx.fillStyle = g.javertDist < 25 ? '#ef4444' : g.javertDist < 45 ? '#f59e0b' : '#10b981';
      ctx.fillRect(125, height - 23, Math.min(110, (g.javertDist / 100) * 110), 6);

      // Urgency / Safe prompt
      ctx.fillStyle = isCritical ? '#fca5a5' : '#94a3b8';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(isCritical ? '⚠️ 緊迫！按Shift衝刺！' : '🏃 安全拉開', 242, height - 17);

      ctx.restore(); // Top-level canvas safeguard restore
    };

    gameLoop(0);

    return () => {
      isRunning = false;
      if (gameRef.current.animationId) {
        cancelAnimationFrame(gameRef.current.animationId);
      }
    };
  }, [isOpen, gameState, highScore, maxDistance]);

  // Lock body scroll while game modal is open to avoid affecting main web page
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Global Keyboard event handlers (Isolated from main website)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in player name input, do not capture game control keys
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      // Game shortcuts with strict page scroll prevention
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        keysRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        keysRef.current.right = true;
      } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key === ' ') {
        e.preventDefault();
        keysRef.current.up = true;
        keysRef.current.upHeld = true;
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        keysRef.current.down = true;
      } else if (e.key === 'Shift' || e.key.toLowerCase() === 'l') {
        e.preventDefault();
        keysRef.current.dash = true;
      } else if (e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'z') {
        e.preventDefault();
        keysRef.current.attack = true;
      } else if (e.key.toLowerCase() === 'x' || e.key.toLowerCase() === 'k') {
        e.preventDefault();
        keysRef.current.throw = true;
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setGameState((prev) => {
          if (prev === 'playing') return 'paused';
          if (prev === 'paused') return 'playing';
          return prev;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        keysRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        keysRef.current.right = false;
      } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key === ' ') {
        keysRef.current.up = false;
        keysRef.current.upHeld = false;
      } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
        keysRef.current.down = false;
      } else if (e.key === 'Shift' || e.key.toLowerCase() === 'l') {
        keysRef.current.dash = false;
      } else if (e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'z') {
        keysRef.current.attack = false;
      } else if (e.key.toLowerCase() === 'x' || e.key.toLowerCase() === 'k') {
        keysRef.current.throw = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  // Start game action
  const handleStartGame = () => {
    initGameWorld();
    setGameState('playing');
    ambientSynth.playButtonClickSFX();
    if (!isMuted) {
      gameAudio.startBGM();
    }
  };

  // Toggle Mute
  const handleToggleSound = () => {
    const nextMuted = gameAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  // Record score into local Hall of Fame
  const handleSaveToLeaderboard = (e: React.FormEvent) => {
    e.preventDefault();
    const name = playerNameInput.trim() || '無名逃亡者';
    const entry: LeaderboardEntry = {
      name,
      score: finalStats.score,
      distance: finalStats.distance,
      date: new Date().toLocaleDateString('zh-TW').replace(/\//g, '.'),
      title: getPlayerTitle(finalStats.distance),
    };

    const updated = [entry, ...leaderboard]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    setLeaderboard(updated);
    setHasRecordedScore(true);
    try {
      localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(updated));
    } catch {}
    ambientSynth.playSuccessSFX();
  };

  // Copy share result
  const handleShareResult = () => {
    const title = getPlayerTitle(finalStats.distance);
    const text = `🥖 我在《悲慘世界》慈大附中英文公演隱藏小遊戲【尚萬強大逃亡：巴黎夜行】跑了 ${finalStats.distance} 公尺，獲得「${title}」稱號！最終得分：${finalStats.score} 分！快來慈大附中公演網站揭開彩蛋挑戰！`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
      ambientSynth.playSuccessSFX();
    });
  };

  // Safe Exit
  const handleSafeClose = () => {
    gameAudio.stopBGM();
    setGameState('intro');
    onClose();
  };

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal?.();
      }
    } else {
      if (dialog.open) {
        dialog.close?.();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none border-none outline-none w-full h-full max-w-none max-h-none m-0 bg-transparent"
        onCancel={(e) => {
          e.preventDefault();
          handleSafeClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-4xl max-h-[100dvh] sm:max-h-[92vh] bg-[#11131a] border-2 border-amber-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col text-stone-200"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#181318] via-[#24171a] to-[#181318] border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 font-mono text-[11px] font-bold">
                EASTER EGG • 24601
              </span>
              <h2 className="font-cinzel text-sm sm:text-base font-bold text-amber-200 tracking-wider">
                尚萬強大逃亡：巴黎夜行 (Valjean's Escape)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTouchControlMode((prev) => {
                    if (prev === 'docked') return 'floating';
                    if (prev === 'floating') return 'off';
                    return 'docked';
                  });
                  triggerHaptic('selection');
                }}
                className={`px-2 py-1 text-xs rounded border flex items-center gap-1 transition-colors select-none ${
                  touchControlMode !== 'off'
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                    : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
                }`}
                title="切換虛擬按鍵模式 (底部/浮動/關閉)"
              >
                <span>📱 觸控: {touchControlMode === 'docked' ? '底部按鍵' : touchControlMode === 'floating' ? '浮動搖桿' : '已關閉'}</span>
              </button>
              <button
                onClick={handleToggleSound}
                className="p-1.5 text-stone-400 hover:text-amber-200 rounded hover:bg-stone-800 transition-colors"
                title={isMuted ? '開啟遊戲音效' : '靜音'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>
              <button
                onClick={() => setShowHowToPlay((p) => !p)}
                className="p-1.5 text-stone-400 hover:text-amber-200 rounded hover:bg-stone-800 transition-colors"
                title="遊戲玩法操作"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={handleSafeClose}
                className="p-1.5 text-stone-400 hover:text-white rounded hover:bg-stone-800 transition-colors"
                title="關閉遊戲"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* In-Game Isolated HUD Bar (Visible during gameplay) */}
          {gameState === 'playing' && <GameHUD hud={hudState} />}

          {/* Canvas Viewport */}
          <div className="relative aspect-[16/9] w-full max-h-[58vh] sm:max-h-[66vh] bg-black overflow-hidden flex items-center justify-center flex-1 touch-none select-none">
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              onTouchStart={(e) => {
                if (gameState !== 'playing' || touchControlMode === 'floating') return;
                const touch = e.touches[0];
                if (!touch || !canvasRef.current) return;
                const rect = canvasRef.current.getBoundingClientRect();
                const touchX = touch.clientX - rect.left;
                const touchY = touch.clientY - rect.top;
                touchStartPos.current = { x: touchX, y: touchY };

                // Right 50% tap -> Jump
                if (touchX > rect.width * 0.5) {
                  keysRef.current.up = true;
                  keysRef.current.upHeld = true;
                  triggerHaptic('light');
                } else {
                  // Left side -> Directional Move
                  if (touchX < rect.width * 0.25) {
                    keysRef.current.left = true;
                    keysRef.current.right = false;
                  } else {
                    keysRef.current.right = true;
                    keysRef.current.left = false;
                  }
                }
              }}
              onTouchMove={(e) => {
                if (gameState !== 'playing' || touchControlMode === 'floating' || !touchStartPos.current || !canvasRef.current) return;
                const touch = e.touches[0];
                if (!touch) return;
                const rect = canvasRef.current.getBoundingClientRect();
                const currentX = touch.clientX - rect.left;
                const currentY = touch.clientY - rect.top;
                const dx = currentX - touchStartPos.current.x;
                const dy = currentY - touchStartPos.current.y;

                if (dy > 40 && Math.abs(dy) > Math.abs(dx)) {
                  keysRef.current.down = true;
                }
                if (dx > 50 && Math.abs(dx) > Math.abs(dy)) {
                  keysRef.current.dash = true;
                }
              }}
              onTouchEnd={() => {
                if (gameState !== 'playing' || touchControlMode === 'floating') return;
                keysRef.current.upHeld = false;
                keysRef.current.left = false;
                keysRef.current.right = false;
                keysRef.current.down = false;
                keysRef.current.dash = false;
                touchStartPos.current = null;
              }}
              onTouchCancel={() => {
                if (gameState !== 'playing' || touchControlMode === 'floating') return;
                keysRef.current.upHeld = false;
                keysRef.current.left = false;
                keysRef.current.right = false;
                keysRef.current.down = false;
                keysRef.current.dash = false;
                touchStartPos.current = null;
              }}
              className="w-full h-full object-contain"
              style={{ imageRendering: 'pixelated', touchAction: 'none' }}
            />

            {/* Floating On-Canvas Virtual Gamepad (Active when floating mode is selected) */}
            {touchControlMode === 'floating' && gameState === 'playing' && (
              <FloatingMobileControls
                keysRef={keysRef}
                slingshotAmmo={hudState.slingshotAmmo}
                isNearManhole={hudState.isNearManhole}
              />
            )}

            {/* INTRO SCREEN OVERLAY */}
            {gameState === 'intro' && (
              <div className="absolute inset-0 bg-[#0d0f14]/90 backdrop-blur-sm p-6 sm:p-10 flex flex-col justify-between text-center overflow-y-auto">
                <div className="space-y-3 max-w-lg mx-auto my-auto">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8c2d2d]/30 border border-[#8c2d2d] text-red-200 text-xs font-serif-tc">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>慈大附中公演彩蛋 • 角色專屬機制升級</span>
                  </div>

                  <h1 className="font-cinzel text-2xl sm:text-4xl font-extrabold text-amber-300 tracking-wider">
                    RUN 24601
                  </h1>
                  <p className="text-xs sm:text-sm text-stone-300 font-serif-tc leading-relaxed">
                    在 19 世紀巴黎的深夜石板路與暗黑下水道中狂奔！
                    頂撞「？」金磚收集主教麵包、加夫洛許石子與珂賽特護盾，
                    投石擊退巡邏憲兵與狡猾的泰納第，小心賈維爾警督投擲手銬！
                  </p>

                  <div className="p-2 rounded-lg bg-stone-900/90 border border-amber-500/40 text-left text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-amber-300">
                      <span>📱 手機 / 移動端操作指南：</span>
                      <span className="text-[10px] text-stone-400 font-mono">支援雙拇指多點觸控</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-stone-300">
                      <div>🕹️ <strong>左側按鍵</strong>：左右移動 / 遇人孔蓋點擊「潛入」</div>
                      <div>🔺 <strong>跳躍鍵</strong>：短按小跳 / 長按大跳 / 空中二段跳</div>
                      <div>⚡ <strong>衝刺鍵</strong>：按住極速狂奔</div>
                      <div>🪨 <strong>投石鍵</strong>：加夫洛許彈弓遠程擊退敵人</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-1 text-[11px] text-stone-300 font-sans">
                    <div className="p-2 rounded bg-stone-900/80 border border-sky-900/60 text-left">
                      <div className="text-sm font-bold text-sky-300 mb-0.5">🪨 加夫洛許</div>
                      <span className="text-stone-400">彈弓投石 (開局贈5石)</span>
                    </div>
                    <div className="p-2 rounded bg-stone-900/80 border border-pink-900/60 text-left">
                      <div className="text-sm font-bold text-pink-300 mb-0.5">🛡️ 珂賽特</div>
                      <span className="text-pink-300 font-bold">雲端護盾 (抵擋傷害)</span>
                    </div>
                    <div className="p-2 rounded bg-stone-900/80 border border-amber-900/60 text-left">
                      <div className="text-sm font-bold text-amber-300 mb-0.5">🥖 奇蹟充飢</div>
                      <span className="text-amber-400 font-bold">5麵包瀕死免除即死</span>
                    </div>
                    <div className="p-2 rounded bg-stone-900/80 border border-emerald-900/60 text-left">
                      <div className="text-sm font-bold text-emerald-300 mb-0.5">📦 5種補給箱</div>
                      <span className="text-emerald-400 font-bold">木/鐵/聖物/濕箱/詭雷</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleStartGame}
                      className="px-8 py-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-sm rounded shadow-lg flex items-center gap-2 cursor-pointer transition-all scale-105"
                    >
                      <Play className="w-4 h-4 fill-stone-950" />
                      <span>👉 點擊開始逃亡！(Start Game)</span>
                    </button>
                    <button
                      onClick={() => setShowLeaderboardTab(true)}
                      className="px-4 py-3 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs rounded border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>英雄風雲榜</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-stone-500 font-mono">
                  最高紀錄：{highScore} 分 • 最遠逃亡：{maxDistance} 公尺
                </div>
              </div>
            )}

            {/* PAUSE OVERLAY */}
            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-4">
                <h3 className="font-cinzel text-2xl font-bold text-amber-300 tracking-wider">
                  遊戲暫停 (PAUSED)
                </h3>
                <p className="text-xs text-stone-400 font-sans">
                  按下 ESC、P 或點擊下方按鈕繼續逃亡
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setGameState('playing')}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-stone-950" />
                    <span>繼續遊戲</span>
                  </button>
                  <button
                    onClick={handleStartGame}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>重新開始</span>
                  </button>
                </div>
              </div>
            )}

            {/* GAME OVER SCREEN */}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-[#090b10]/95 backdrop-blur-sm p-6 flex flex-col justify-between text-center overflow-y-auto">
                <div className="max-w-md mx-auto my-auto space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs text-red-400 font-mono tracking-widest uppercase">
                      GAME OVER
                    </span>
                    <h3 className="font-serif-tc text-2xl font-bold text-stone-100">
                      巴黎長夜落幕
                    </h3>
                    <p className="text-xs text-amber-300 font-serif-tc">
                      榮獲稱號：【{getPlayerTitle(finalStats.distance)}】
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-2 text-xs">
                    <div className="p-3 bg-stone-900/90 border border-stone-800 rounded">
                      <div className="text-stone-400">最終得分</div>
                      <div className="text-2xl font-bold font-mono text-amber-400">{finalStats.score}</div>
                    </div>
                    <div className="p-3 bg-stone-900/90 border border-stone-800 rounded">
                      <div className="text-stone-400">逃亡里程</div>
                      <div className="text-2xl font-bold font-mono text-white">{finalStats.distance} m</div>
                    </div>
                  </div>

                  {/* Leaderboard Submission Form */}
                  {!hasRecordedScore ? (
                    <form onSubmit={handleSaveToLeaderboard} className="p-3 bg-stone-900/70 border border-stone-800 rounded space-y-2">
                      <div className="text-[11px] text-stone-300 font-sans">
                        登錄大名至「慈大附中英雄榜」：
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={12}
                          value={playerNameInput}
                          onChange={(e) => setPlayerNameInput(e.target.value)}
                          placeholder="例如：高二知足小明"
                          className="flex-1 bg-stone-950 border border-stone-700 rounded px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded cursor-pointer"
                        >
                          紀錄成績
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-2 bg-emerald-950/60 border border-emerald-700/60 rounded text-emerald-300 text-xs">
                      ✓ 已成功將戰報成績錄入榮譽殿堂！
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleStartGame}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>再逃一次！(Replay)</span>
                    </button>
                    <button
                      onClick={handleShareResult}
                      className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded border border-stone-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>{copyFeedback ? '已複製戰報！' : '分享成績'}</span>
                    </button>
                    <button
                      onClick={() => setShowLeaderboardTab(true)}
                      className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs rounded border border-stone-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>風雲榜</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* High-Performance Ergonomic Mobile Controls with Contextual Action */}
          {touchControlMode === 'docked' && (
            <MobileControls
              keysRef={keysRef}
              slingshotAmmo={hudState.slingshotAmmo}
              isNearManhole={hudState.isNearManhole}
            />
          )}

          {/* DESKTOP KEYBOARD CONTROLS HELPER BAR */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 bg-[#0d0f14] border-t border-stone-800 text-[11px] text-stone-400 font-mono">
            <div className="flex items-center gap-3.5 flex-wrap">
              <span>← → 或 A/D 移動</span>
              <span className="text-emerald-400 font-bold">↓ 或 S：下潛暗道</span>
              <span>↑ 或 W 或空白鍵：跳躍 (空中二段跳 / 踏頭重置)</span>
              <span className="text-amber-300 font-bold">J 或 Z：🗡️ 近戰三段平砍 (空中下墜斬)</span>
              <span className="text-sky-300 font-bold">X 或 K：🪨 加夫洛許投石</span>
              <span>Shift 或 L：💨 翻滾衝刺 (打斷後搖)</span>
              <span>Esc 或 P：暫停</span>
            </div>
            <div className="text-amber-400 font-bold">
              目標：衝破 24601 公尺！
            </div>
          </div>

          {/* HOW TO PLAY MODAL OVERLAY (HTML5 Native Popover) */}
          {showHowToPlay && (
            <div
              popover="manual"
              className="absolute inset-0 bg-black/90 z-20 p-6 flex flex-col justify-between overflow-y-auto w-full h-full m-0 border-none text-stone-200"
            >
              <div className="max-w-lg mx-auto space-y-3.5">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <h3 className="font-cinzel text-base font-bold text-amber-300">
                    操作攻略與角色機制 • HOW TO PLAY
                  </h3>
                  <button
                    onClick={() => setShowHowToPlay(false)}
                    className="text-stone-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs text-stone-300 font-sans leading-relaxed">
                  <div className="p-2.5 bg-amber-950/40 rounded border border-amber-600/60 space-y-1">
                    <strong className="text-amber-300 font-bold block">📱 0. 手機 / 平板觸控與鍵盤快捷手冊</strong>
                    <p>• <strong>🗡️ 斬擊 (J / Z 鍵)</strong>：近戰三段平砍連擊！地面第三段施展終結重斬，空中第三段自動覆蓋為「下墜斬」急速俯衝！<br />
                    • <strong>🪨 投石 (X / K 鍵)</strong>：遠端消耗加夫洛許石子彈藥，精準擊潰遠程敵兵、引爆炸藥箱或識破偽裝箱！<br />
                    • <strong>▲ 跳躍 & 踏頭重置 (W / Space / ↑)</strong>：短按小跳、長按大跳；下落踩踏敵兵頭頂可高空彈跳並【立即重置連擊段數與空中二段跳】！<br />
                    • <strong>⚡ 衝刺 (Shift / L 鍵)</strong>：快速翻滾衝刺，可隨時打斷平砍攻擊後搖（Dead Cells 級後搖取消）！</p>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded border border-emerald-900/60 space-y-1">
                    <strong className="text-emerald-300 font-bold block">💧 1. 巴黎立體雙層地圖 [S/↓ 潛入暗道，W/↑ 攀梯回街頭]</strong>
                    <p>街頭遇人孔蓋按 [S/↓] 順鐵梯潛入暗道。下水道為賈維爾視野盲區（追捕暫停，可安心戰術折返！）。在底層靠近梯子按 [W/↑] 可爬回街頭；若遇井口憲兵埋伏，可用加夫洛許彈弓 [X鍵] 或近戰斬擊擊暈 (+350分)！</p>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded border border-purple-900/60 space-y-1">
                    <strong className="text-purple-300 font-bold block">😈 2. 泰納第偽裝箱與反擊追討 [¿ 偽裝箱]</strong>
                    <p>帶有紫紅色澤的 ¿ 箱子是泰納第黑幫小偷的偽裝！開箱會被扒走麵包，在倒數時間內用彈弓 [X鍵]、近戰平砍 [J鍵] 或踩踏制伏他，可奪回【雙倍麵包】與 +1000 額外獎分！</p>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded border border-sky-900/60 space-y-1">
                    <strong className="text-sky-300 font-bold block">🪨 3. 加夫洛許的彈弓石子 [X 或 K 鍵遠攻]</strong>
                    <p>頂撞金色問號金磚或拾取石子袋獲得彈藥。按 X / K 鍵發射石子，可遠程識破偽裝箱、擊倒憲兵或擊碎賈維爾的手銬！</p>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded border border-pink-900/60 space-y-1">
                    <strong className="text-pink-300 font-bold block">🛡️ 4. 珂賽特的雲端庇護 [防護罩]</strong>
                    <p>獲得白花守護盾，可抵擋 1 次憲兵肉體衝撞、化解賈維爾手銬，甚至掉入深淵時能托起救回一命！</p>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded border border-yellow-900/60 space-y-1">
                    <strong className="text-yellow-300 font-bold block">🕯️ 5. 米里哀主教的銀燭台 [聖光救贖 +1❤️ / 擊退賈維爾+20m / 10秒無敵磁吸]</strong>
                    <p>獲得銀燭台立即治癒 +1 點生命值、神聖光芒逼退賈維爾 +20 公尺，並進入 10 秒無敵衝撞磁吸模式！</p>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded border border-emerald-900/60 space-y-1">
                    <strong className="text-emerald-300 font-bold block">📦 6. 5 種特色箱子機制 [木箱 / 鐵箱 / 聖物 / 濕箱 / 詭雷]</strong>
                    <p>
                      • <strong>經典木箱</strong>：一踩或投石即碎，掉落麵包或金幣。<br />
                      • <strong>加固鐵箱 (耐久 2)</strong>：需踩踏兩次或投石貫穿，掉落雙倍石子袋與豐厚物資！<br />
                      • <strong>米里哀聖物寶箱</strong>：十字金色聖箱，保底掉落銀燭台或愛心，給予無敵聖光。<br />
                      • <strong>下水道青苔濕箱</strong>：擊碎噴濺激流水花，賦予 5 秒「激流疾跑」無阻狂飆增速！<br />
                      • <strong>炸藥詭雷箱 (TNT)</strong>：受碰觸或投石觸發 1 秒倒數，遠距引爆可震飛半徑 120px 內所有巡邏憲兵！
                    </p>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded border border-amber-900/60 space-y-1">
                    <strong className="text-amber-300 font-bold block">🥖 7. 資源平衡與瀕死奇蹟急救保底機制</strong>
                    <p>
                      • <strong>奇蹟充飢</strong>：當愛心瀕危 (≤1❤️) 遭受致命重擊時，若擁有 ≥5 個白麵包，將自動消耗 5 個麵包發動急救，保住 1 心並獲得 2 秒無敵護體！<br />
                      • <strong>智慧動態補給 (Pity Loot)</strong>：缺血時箱子與金磚大幅提升麵包與愛心掉率；石子耗盡時必優先掉落石子袋，告別死局！<br />
                      • <strong>加夫洛許軍備</strong>：開局即配備 5 顆石子，戰術打擊更從容！
                    </p>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded border border-red-900/60 space-y-1">
                    <strong className="text-red-300 font-bold block">🚨 8. 4 階段警戒升級與深沉心跳緊迫感 (Escalating Tension)</strong>
                    <p>
                      • <strong>動態警戒等級</strong>：由 Lv.1「暗夜潛行」一路升級至 Lv.2「全城通緝」、Lv.3「起義交火」與 Lv.4「鐵壁死局」！警笛長鳴，賈維爾追捕逼近速度與手銬投擲頻率大幅加劇！<br />
                      • <strong>極度逼近心跳暗角</strong>：當賈維爾追至 42m 內，螢幕將泛起劇烈血紅脈衝暗角，且能聽見急促加劇的深沉心跳聲！必須按住 Shift 衝刺或善用下水道暗道甩開！
                    </p>
                  </div>
                  <div className="p-2.5 bg-stone-900 rounded border border-indigo-900/60 space-y-1">
                    <strong className="text-indigo-300 font-bold block">🎭 9. 劇院級角色動態劇情對談廣播 (Story Banter System)</strong>
                    <p>
                      尚萬強、賈維爾警督、頑童加夫洛許、珂賽特與米里哀主教在逃亡路途、投擲手銬與關鍵里程碑時皆會觸發即時對談廣播框，完美重現《悲慘世界》原著音樂劇經典台詞！
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowHowToPlay(false)}
                  className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded cursor-pointer"
                >
                  我知道了，回遊戲！
                </button>
              </div>
            </div>
          )}

          {/* LEADERBOARD OVERLAY (HTML5 Native Popover) */}
          {showLeaderboardTab && (
            <div
              popover="manual"
              className="absolute inset-0 bg-black/90 z-20 p-6 flex flex-col justify-between overflow-y-auto w-full h-full m-0 border-none text-stone-200"
            >
              <div className="max-w-lg mx-auto w-full space-y-4">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h3 className="font-cinzel text-base font-bold text-amber-300">
                      慈大附中英雄榜 • HALL OF FAME
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowLeaderboardTab(false)}
                    className="text-stone-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {leaderboard.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-900/80 border border-stone-800 rounded flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-5 text-center font-bold font-mono ${
                          idx === 0 ? 'text-amber-300 text-sm' : idx === 1 ? 'text-stone-300' : idx === 2 ? 'text-amber-600' : 'text-stone-500'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-stone-100">{entry.name}</div>
                          <div className="text-[10px] text-amber-400/80">{entry.title} • {entry.date}</div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-amber-300 font-bold">{entry.score} 分</div>
                        <div className="text-[10px] text-stone-400">{entry.distance} m</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowLeaderboardTab(false)}
                  className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded"
                >
                  返回遊戲
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </dialog>
    </AnimatePresence>,
    document.body
  );
});

ValjeanEscapeGameModal.displayName = 'ValjeanEscapeGameModal';
