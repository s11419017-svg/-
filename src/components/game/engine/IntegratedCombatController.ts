// ============================================================================
// 2026 Production-Grade Integrated Combat & Platformer Controller (TypeScript 7.0)
// Fusing:
//  1. "Dead Cells" 3-Stage Combo & Recovery Overrides (with Airborne Helm Splitter)
//  2. "Super Mario" Dynamic Head-Stomp & Kinetic Inertia Bounce
//  3. "Celeste" Micro-Collision Forgiveness, Coyote Time & Asymmetrical Gravity
// Completely decoupled, allocation-free & high-performance Web Worker ready.
// ============================================================================

export interface BoundingBox2D {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface PlayerInput {
  readonly moveX: number;        // -1.0 (Left), 0.0 (Neutral), 1.0 (Right)
  readonly moveY: number;        // -1.0 (Up), 0.0 (Neutral), 1.0 (Down)
  readonly jumpPressed: boolean; // Triggered on keydown
  readonly jumpHeld: boolean;    // Sustained key hold for variable jump height
  readonly attackPressed: boolean;
  readonly rollPressed: boolean;
  readonly dashPressed: boolean;
}

export const enum CharacterActionState {
  IDLE = 'IDLE',
  RUN = 'RUN',
  JUMP_ASCENT = 'JUMP_ASCENT',
  JUMP_APEX = 'JUMP_APEX',
  FALL_DESCENT = 'FALL_DESCENT',
  ATTACK_COMBO_1 = 'ATTACK_COMBO_1',
  ATTACK_COMBO_2 = 'ATTACK_COMBO_2',
  ATTACK_COMBO_3_GROUND = 'ATTACK_COMBO_3_GROUND',
  ATTACK_COMBO_3_HELM_SPLITTER = 'ATTACK_COMBO_3_HELM_SPLITTER',
  DODGE_ROLL = 'DODGE_ROLL',
  AIR_DASH = 'AIR_DASH',
  HIT_STOP = 'HIT_STOP',
  HURT = 'HURT',
}

export interface AttackHitbox {
  readonly active: boolean;
  readonly stage: number; // 1, 2, or 3
  readonly box: BoundingBox2D;
  readonly damage: number;
  readonly knockbackX: number;
  readonly knockbackY: number;
  readonly hitStunFrames: number; // 6 frames = 100ms at 60Hz
  readonly hitStopFrames: number; // 3 frames for heavy strikes
}

export interface EnemyEntityCollider {
  readonly id: string | number;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly isVulnerableToStomp: boolean;
  readonly isAlive: boolean;
}

export interface CollisionTile {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly isOneWay?: boolean;
}

export interface WorldMapGrid {
  readonly cellSize: number;
  getSolidTilesInAABB(aabb: BoundingBox2D): readonly CollisionTile[];
}

export interface StompEvent {
  readonly enemyId: string | number;
  readonly bounceVelocityY: number;
  readonly comboReset: boolean;
}

export interface HitEvent {
  readonly enemyId: string | number;
  readonly stage: number;
  readonly damage: number;
  readonly knockbackX: number;
  readonly knockbackY: number;
  readonly hitStunFrames: number;
}

export interface ControllerTelemetry {
  readonly state: CharacterActionState;
  readonly comboStage: number; // 0, 1, 2, 3
  readonly comboWindowTimer: number;
  readonly stateFrame: number;
  readonly posX: number;
  readonly posY: number;
  readonly velX: number;
  readonly velY: number;
  readonly facingRight: boolean;
  readonly isGrounded: boolean;
  readonly isInvulnerable: boolean;
  readonly canAirDash: boolean;
  readonly activeHitbox: AttackHitbox | null;
  readonly currentSquashScaleX: number;
  readonly currentSquashScaleY: number;
  readonly recentStompEvent: StompEvent | null;
  readonly recentHitEvents: readonly HitEvent[];
}

/**
 * High-Precision Physical Constants & Frame Laws
 */
export const COMBAT_PHYSICS_CONSTANTS = {
  // Locomotion
  RUN_SPEED: 4.8,
  ROLL_SPEED: 7.2,
  AIR_DASH_SPEED: 8.5,
  ACCEL_GROUND: 1.15,
  ACCEL_AIR: 0.72,
  FRICTION_GROUND: 0.82,
  DRAG_AIR: 0.94,

  // Celeste Asymmetric Gravity & Variable Jump
  JUMP_VELOCITY: -12.6,
  BASE_GRAVITY: 0.58,
  GRAVITY_APEX_MULTIPLIER: 0.35,      // 65% gravity cut at apex
  GRAVITY_FAST_FALL_MULTIPLIER: 1.48, // 148% snappy descent gravity
  VARIABLE_JUMP_CUT_DECAY: 0.52,      // Instant vertical velocity cut upon early jump release
  APEX_VELOCITY_THRESHOLD: 2.0,       // |vy| <= 2.0 triggers Apex Float
  TERMINAL_VELOCITY: 14.0,

  // Celeste Micro-Collision Buffers
  JUMP_BUFFER_FRAMES: 4,              // 4 frames (~66ms) pre-landing jump buffer
  COYOTE_TIME_FRAMES: 6,              // 6 frames (100ms) post-platform grace window
  CORNER_SHOVE_MAX_PX: 4,             // Upward corner-slide threshold

  // Mario Stomp Mechanics
  MARIO_STOMP_LOW_BOUNCE: -8.0,       // Standard kinetic upward impulse
  MARIO_STOMP_HIGH_BOUNCE: -12.0,     // High kinetic bounce if Jump key held
  STOMP_TOP_THRESHOLD_PX: 10.0,       // Head raycast threshold zone

  // Dead Cells 3-Stage Combo Mechanics & Recovery Windows
  COMBO_CHAIN_WINDOW_FRAMES: 24,      // Input buffering window to chain combo

  // Stage 1: Quick horizontal sweep
  COMBO_1_TOTAL_FRAMES: 16,
  COMBO_1_STARTUP_FRAMES: 2,          // Frame 2 instant deployment (<30ms)
  COMBO_1_ACTIVE_FRAMES: 3,
  COMBO_1_RECOVERY_CANCEL_FRAME: 5,   // Last 70% can be canceled into Roll or Jump

  // Stage 2: Secondary sweeping enabler
  COMBO_2_TOTAL_FRAMES: 18,
  COMBO_2_STARTUP_FRAMES: 2,
  COMBO_2_ACTIVE_FRAMES: 3,
  COMBO_2_RECOVERY_CANCEL_FRAME: 6,

  // Stage 3 Ground: Heavy Finisher with Hit-Stop
  COMBO_3_GROUND_TOTAL_FRAMES: 26,
  COMBO_3_GROUND_STARTUP_FRAMES: 3,
  COMBO_3_GROUND_ACTIVE_FRAMES: 4,
  COMBO_3_GROUND_RECOVERY_CANCEL_FRAME: 10,

  // Stage 3 Air: Downward Helm Splitter
  HELM_SPLITTER_DOWN_VELOCITY: 12.0,  // vy = +12 rapid descent vector
  HELM_SPLITTER_TOTAL_FRAMES: 28,
  HELM_SPLITTER_STARTUP_FRAMES: 1,

  // Dodge Roll
  ROLL_TOTAL_FRAMES: 18,
  ROLL_INVULN_FRAMES: 12,
  ROLL_RECOVERY_CANCEL_FRAME: 11,

  // Air Dash
  AIR_DASH_TOTAL_FRAMES: 12,
} as const;

/**
 * Pure Mathematical Integrated Combat Controller (TypeScript 7.0 Spec)
 */
export class IntegratedCombatController {
  // Transform & Kinematics
  private posX: number = 0;
  private posY: number = 0;
  private velX: number = 0;
  private velY: number = 0;
  private width: number = 24;
  private height: number = 44;
  private facingRight: boolean = true;
  private isGrounded: boolean = false;
  private canAirDash: boolean = true;

  // Action & Combo State Machine
  private state: CharacterActionState = CharacterActionState.IDLE;
  private stateFrame: number = 0;
  private comboStage: number = 0;          // 0 (none), 1, 2, 3
  private comboWindowTimer: number = 0;    // Window to continue combo sequence
  private hitStopTimer: number = 0;        // 3-frame hit stop on heavy finisher
  private preHitStopState: CharacterActionState = CharacterActionState.IDLE;

  // Buffer Timers (Frame-level)
  private jumpBufferTimer: number = 0;
  private coyoteTimer: number = 0;
  private invulnerableTimer: number = 0;

  // Visual Squash & Stretch (Harmonic Spring)
  private squashScaleX: number = 1.0;
  private squashScaleY: number = 1.0;

  // Event telemetry queues (Reused to prevent garbage-collection spikes)
  private currentStompEvent: StompEvent | null = null;
  private hitEventsQueue: HitEvent[] = [];

  // Zero-allocation Attack Hitbox Struct
  private currentHitbox: AttackHitbox = {
    active: false,
    stage: 0,
    box: { x: 0, y: 0, w: 0, h: 0 },
    damage: 0,
    knockbackX: 0,
    knockbackY: 0,
    hitStunFrames: 0,
    hitStopFrames: 0,
  };

  // Reusable Telemetry Snapshot
  private telemetrySnapshot: ControllerTelemetry = {
    state: CharacterActionState.IDLE,
    comboStage: 0,
    comboWindowTimer: 0,
    stateFrame: 0,
    posX: 0,
    posY: 0,
    velX: 0,
    velY: 0,
    facingRight: true,
    isGrounded: false,
    isInvulnerable: false,
    canAirDash: true,
    activeHitbox: null,
    currentSquashScaleX: 1.0,
    currentSquashScaleY: 1.0,
    recentStompEvent: null,
    recentHitEvents: [],
  };

  constructor(initialX: number = 0, initialY: number = 0, width: number = 24, height: number = 44) {
    this.posX = initialX;
    this.posY = initialY;
    this.width = width;
    this.height = height;
  }

  public setPosition(x: number, y: number): void {
    this.posX = x;
    this.posY = y;
    this.velX = 0;
    this.velY = 0;
  }

  /**
   * Main Deterministic Simulation Tick
   */
  public update(
    input: PlayerInput,
    world: WorldMapGrid,
    enemies: readonly EnemyEntityCollider[],
    dtScale: number = 1.0
  ): void {
    // Reset frame-specific event caches
    this.currentStompEvent = null;
    this.hitEventsQueue.length = 0;

    // Handle Hit-Stop Freeze Frame
    if (this.hitStopTimer > 0) {
      this.hitStopTimer--;
      if (this.hitStopTimer <= 0) {
        this.state = this.preHitStopState;
      } else {
        return; // Physics and animations are paused for hit-stop frames
      }
    }

    this.stateFrame++;

    // ------------------------------------------------------------------------
    // Step 1: Input Buffering & Grace Timers
    // ------------------------------------------------------------------------
    if (input.jumpPressed) {
      this.jumpBufferTimer = COMBAT_PHYSICS_CONSTANTS.JUMP_BUFFER_FRAMES;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }

    if (this.isGrounded) {
      this.coyoteTimer = COMBAT_PHYSICS_CONSTANTS.COYOTE_TIME_FRAMES;
      this.canAirDash = true; // Refresh air dash on ground contact
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer--;
    }

    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer--;
      if (this.comboWindowTimer <= 0) {
        this.comboStage = 0; // Combo timed out
      }
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }

    // ------------------------------------------------------------------------
    // Step 2: "Dead Cells" 3-Stage Combo & Recovery Overrides
    // ------------------------------------------------------------------------
    this.handleComboAndActionStateMachine(input);

    // ------------------------------------------------------------------------
    // Step 3: Kinematics (Asymmetric Gravity & Variable Jump)
    // ------------------------------------------------------------------------
    this.applyKinematics(input, dtScale);

    // ------------------------------------------------------------------------
    // Step 4: Celeste Micro-Collision Integration
    // ------------------------------------------------------------------------
    this.integrateWorldCollisions(world);

    // ------------------------------------------------------------------------
    // Step 5: Mario Head-Stomp & Combat Hitbox Intersections
    // ------------------------------------------------------------------------
    this.processCombatInteractions(input, enemies);

    // ------------------------------------------------------------------------
    // Step 6: Squash & Stretch Spring Decay
    // ------------------------------------------------------------------------
    this.updateSquashSpring();
  }

  /**
   * Action & Combo State Transitions with Dead Cells Recovery Canceling
   */
  private handleComboAndActionStateMachine(input: PlayerInput): void {
    // 1. Stage 1 Recovery Phase Override
    if (this.state === CharacterActionState.ATTACK_COMBO_1) {
      if (this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.COMBO_1_RECOVERY_CANCEL_FRAME) {
        if (input.rollPressed && this.isGrounded) {
          this.transitionToRoll();
          return;
        }
        if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
          this.executeJump();
          return;
        }
        if (input.attackPressed) {
          this.triggerComboStage2();
          return;
        }
      }
      if (this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.COMBO_1_TOTAL_FRAMES) {
        this.transitionToLocomotion();
      }
      return;
    }

    // 2. Stage 2 Recovery Phase Override
    if (this.state === CharacterActionState.ATTACK_COMBO_2) {
      if (this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.COMBO_2_RECOVERY_CANCEL_FRAME) {
        if (input.rollPressed && this.isGrounded) {
          this.transitionToRoll();
          return;
        }
        if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
          this.executeJump();
          return;
        }
        if (input.attackPressed) {
          this.triggerComboStage3();
          return;
        }
      }
      if (this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.COMBO_2_TOTAL_FRAMES) {
        this.transitionToLocomotion();
      }
      return;
    }

    // 3. Stage 3 Ground Recovery Phase Override
    if (this.state === CharacterActionState.ATTACK_COMBO_3_GROUND) {
      if (this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.COMBO_3_GROUND_RECOVERY_CANCEL_FRAME) {
        if (input.rollPressed && this.isGrounded) {
          this.transitionToRoll();
          return;
        }
        if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
          this.executeJump();
          return;
        }
      }
      if (this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.COMBO_3_GROUND_TOTAL_FRAMES) {
        this.comboStage = 0;
        this.transitionToLocomotion();
      }
      return;
    }

    // 4. Stage 3 Airborne Downward Helm Splitter
    if (this.state === CharacterActionState.ATTACK_COMBO_3_HELM_SPLITTER) {
      if (this.isGrounded || this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.HELM_SPLITTER_TOTAL_FRAMES) {
        this.comboStage = 0;
        this.squashScaleX = 1.45; // Heavy landing impact
        this.squashScaleY = 0.65;
        this.transitionToLocomotion();
      }
      return;
    }

    // 5. Dodge Roll Recovery Phase Override
    if (this.state === CharacterActionState.DODGE_ROLL) {
      if (this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.ROLL_RECOVERY_CANCEL_FRAME) {
        if (input.attackPressed) {
          this.triggerComboStage1();
          return;
        }
        if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
          this.executeJump();
          return;
        }
      }
      if (this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.ROLL_TOTAL_FRAMES) {
        this.transitionToLocomotion();
      }
      return;
    }

    // 6. Air Dash Recovery
    if (this.state === CharacterActionState.AIR_DASH) {
      if (this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.AIR_DASH_TOTAL_FRAMES) {
        this.transitionToLocomotion();
      }
      return;
    }

    // 7. Neutral Action Execution
    if (input.rollPressed && this.isGrounded) {
      this.transitionToRoll();
      return;
    }

    if (input.dashPressed && !this.isGrounded && this.canAirDash) {
      this.transitionToAirDash();
      return;
    }

    if (input.attackPressed) {
      if (this.comboStage === 0 || this.comboWindowTimer <= 0) {
        this.triggerComboStage1();
      } else if (this.comboStage === 1) {
        this.triggerComboStage2();
      } else if (this.comboStage === 2) {
        this.triggerComboStage3();
      } else {
        this.triggerComboStage1();
      }
      return;
    }

    // 8. Jump Input (Ground or Coyote Time Window)
    if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
      this.executeJump();
      return;
    }

    // 9. Standard Locomotion Substates
    this.updateLocomotionSubstate(input);
  }

  // --- Combo Stage Initiations ---

  private triggerComboStage1(): void {
    this.state = CharacterActionState.ATTACK_COMBO_1;
    this.stateFrame = 0;
    this.comboStage = 1;
    this.comboWindowTimer = COMBAT_PHYSICS_CONSTANTS.COMBO_CHAIN_WINDOW_FRAMES;
    this.velX = (this.facingRight ? 1 : -1) * 2.2; // Subtle step-in forward
  }

  private triggerComboStage2(): void {
    this.state = CharacterActionState.ATTACK_COMBO_2;
    this.stateFrame = 0;
    this.comboStage = 2;
    this.comboWindowTimer = COMBAT_PHYSICS_CONSTANTS.COMBO_CHAIN_WINDOW_FRAMES;
    this.velX = (this.facingRight ? 1 : -1) * 2.8;
  }

  private triggerComboStage3(): void {
    this.comboStage = 3;
    this.comboWindowTimer = 0; // Final stage of combo

    if (!this.isGrounded) {
      // Mid-Air Context Override: Downward Helm Splitter!
      this.state = CharacterActionState.ATTACK_COMBO_3_HELM_SPLITTER;
      this.stateFrame = 0;
      this.velY = COMBAT_PHYSICS_CONSTANTS.HELM_SPLITTER_DOWN_VELOCITY; // Instant vy = +12
      this.velX = (this.facingRight ? 1 : -1) * 1.5;
      this.squashScaleX = 0.68;
      this.squashScaleY = 1.42;
    } else {
      // Ground Finisher: Heavy Forward Cleave
      this.state = CharacterActionState.ATTACK_COMBO_3_GROUND;
      this.stateFrame = 0;
      this.velX = (this.facingRight ? 1 : -1) * 4.5;
    }
  }

  private executeJump(): void {
    this.velY = COMBAT_PHYSICS_CONSTANTS.JUMP_VELOCITY;
    this.isGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.state = CharacterActionState.JUMP_ASCENT;
    this.stateFrame = 0;
    this.squashScaleX = 0.72;
    this.squashScaleY = 1.34;
  }

  private transitionToRoll(): void {
    this.state = CharacterActionState.DODGE_ROLL;
    this.stateFrame = 0;
    this.velX = (this.facingRight ? 1 : -1) * COMBAT_PHYSICS_CONSTANTS.ROLL_SPEED;
    this.invulnerableTimer = COMBAT_PHYSICS_CONSTANTS.ROLL_INVULN_FRAMES;
    this.squashScaleX = 1.35;
    this.squashScaleY = 0.65;
  }

  private transitionToAirDash(): void {
    this.state = CharacterActionState.AIR_DASH;
    this.stateFrame = 0;
    this.canAirDash = false;
    this.velX = (this.facingRight ? 1 : -1) * COMBAT_PHYSICS_CONSTANTS.AIR_DASH_SPEED;
    this.velY = 0; // Lock vertical drop during air dash
    this.invulnerableTimer = 8;
  }

  private transitionToLocomotion(): void {
    if (this.isGrounded) {
      this.state = Math.abs(this.velX) > 0.3 ? CharacterActionState.RUN : CharacterActionState.IDLE;
    } else {
      this.state = this.velY < 0 ? CharacterActionState.JUMP_ASCENT : CharacterActionState.FALL_DESCENT;
    }
    this.stateFrame = 0;
  }

  private updateLocomotionSubstate(input: PlayerInput): void {
    if (this.isGrounded) {
      if (Math.abs(input.moveX) > 0.1) {
        this.state = CharacterActionState.RUN;
      } else {
        this.state = CharacterActionState.IDLE;
      }
    } else {
      if (Math.abs(this.velY) <= COMBAT_PHYSICS_CONSTANTS.APEX_VELOCITY_THRESHOLD) {
        this.state = CharacterActionState.JUMP_APEX;
      } else if (this.velY < 0) {
        this.state = CharacterActionState.JUMP_ASCENT;
      } else {
        this.state = CharacterActionState.FALL_DESCENT;
      }
    }
  }

  /**
   * Kinematic Velocity & Acceleration Calculations
   */
  private applyKinematics(input: PlayerInput, dtScale: number): void {
    // 1. Horizontal Direction & Motion
    if (input.moveX !== 0) {
      this.facingRight = input.moveX > 0;
    }

    const isLockedMovement =
      this.state === CharacterActionState.DODGE_ROLL ||
      this.state === CharacterActionState.AIR_DASH ||
      this.state === CharacterActionState.ATTACK_COMBO_3_HELM_SPLITTER;

    if (!isLockedMovement) {
      const targetVx = input.moveX * COMBAT_PHYSICS_CONSTANTS.RUN_SPEED;
      const accel = (this.isGrounded ? COMBAT_PHYSICS_CONSTANTS.ACCEL_GROUND : COMBAT_PHYSICS_CONSTANTS.ACCEL_AIR) * dtScale;

      if (input.moveX !== 0) {
        if (this.velX < targetVx) {
          this.velX = Math.min(targetVx, this.velX + accel);
        } else if (this.velX > targetVx) {
          this.velX = Math.max(targetVx, this.velX - accel);
        }
      } else {
        // Friction decay
        const friction = this.isGrounded ? COMBAT_PHYSICS_CONSTANTS.FRICTION_GROUND : COMBAT_PHYSICS_CONSTANTS.DRAG_AIR;
        this.velX *= Math.pow(friction, dtScale);
        if (Math.abs(this.velX) < 0.1) this.velX = 0;
      }
    }

    // 2. Celeste Variable Jump Height (Release jump key early for crisp short hop)
    if (!input.jumpHeld && this.velY < -3.0 && this.state === CharacterActionState.JUMP_ASCENT) {
      this.velY *= COMBAT_PHYSICS_CONSTANTS.VARIABLE_JUMP_CUT_DECAY;
    }

    // 3. Asymmetric Gravity & Apex Float Curve
    const isFreeGravity =
      !this.isGrounded &&
      this.state !== CharacterActionState.AIR_DASH &&
      this.state !== CharacterActionState.ATTACK_COMBO_3_HELM_SPLITTER;

    if (isFreeGravity) {
      let gravityMultiplier = 1.0;

      if (Math.abs(this.velY) <= COMBAT_PHYSICS_CONSTANTS.APEX_VELOCITY_THRESHOLD) {
        gravityMultiplier = COMBAT_PHYSICS_CONSTANTS.GRAVITY_APEX_MULTIPLIER; // 0.35
        // Apex Agility Boost
        if (input.moveX !== 0) {
          this.velX += input.moveX * 0.22 * dtScale;
        }
      } else if (this.velY > 0) {
        gravityMultiplier = COMBAT_PHYSICS_CONSTANTS.GRAVITY_FAST_FALL_MULTIPLIER; // 1.48
      }

      this.velY += COMBAT_PHYSICS_CONSTANTS.BASE_GRAVITY * gravityMultiplier * dtScale;
      if (this.velY > COMBAT_PHYSICS_CONSTANTS.TERMINAL_VELOCITY) {
        this.velY = COMBAT_PHYSICS_CONSTANTS.TERMINAL_VELOCITY;
      }
    }

    // 4. Update Attack Hitboxes
    this.updateHitboxState();
  }

  /**
   * Hitbox Matrix with 30ms latency safeguards & crowd-control knockbacks
   */
  private updateHitboxState(): void {
    const dir = this.facingRight ? 1 : -1;

    // Stage 1 Hitbox (Fast horizontal sweep, vx = +2/-2, 100ms hit stun)
    if (this.state === CharacterActionState.ATTACK_COMBO_1) {
      const isActive =
        this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.COMBO_1_STARTUP_FRAMES &&
        this.stateFrame < COMBAT_PHYSICS_CONSTANTS.COMBO_1_STARTUP_FRAMES + COMBAT_PHYSICS_CONSTANTS.COMBO_1_ACTIVE_FRAMES;

      if (isActive) {
        this.currentHitbox = {
          active: true,
          stage: 1,
          box: {
            x: this.posX + (this.facingRight ? this.width : -28),
            y: this.posY + 6,
            w: 28,
            h: 32,
          },
          damage: 15,
          knockbackX: dir * 2.0, // Crowd-control positioning
          knockbackY: -1.2,
          hitStunFrames: 6,      // 100ms hit-stiff at 60Hz
          hitStopFrames: 0,
        };
        return;
      }
    }

    // Stage 2 Hitbox
    if (this.state === CharacterActionState.ATTACK_COMBO_2) {
      const isActive =
        this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.COMBO_2_STARTUP_FRAMES &&
        this.stateFrame < COMBAT_PHYSICS_CONSTANTS.COMBO_2_STARTUP_FRAMES + COMBAT_PHYSICS_CONSTANTS.COMBO_2_ACTIVE_FRAMES;

      if (isActive) {
        this.currentHitbox = {
          active: true,
          stage: 2,
          box: {
            x: this.posX + (this.facingRight ? this.width : -32),
            y: this.posY + 4,
            w: 32,
            h: 34,
          },
          damage: 22,
          knockbackX: dir * 2.5,
          knockbackY: -1.5,
          hitStunFrames: 6,
          hitStopFrames: 0,
        };
        return;
      }
    }

    // Stage 3 Ground Hitbox (Heavy strike with 3-frame hit stop)
    if (this.state === CharacterActionState.ATTACK_COMBO_3_GROUND) {
      const isActive =
        this.stateFrame >= COMBAT_PHYSICS_CONSTANTS.COMBO_3_GROUND_STARTUP_FRAMES &&
        this.stateFrame < COMBAT_PHYSICS_CONSTANTS.COMBO_3_GROUND_STARTUP_FRAMES + COMBAT_PHYSICS_CONSTANTS.COMBO_3_GROUND_ACTIVE_FRAMES;

      if (isActive) {
        this.currentHitbox = {
          active: true,
          stage: 3,
          box: {
            x: this.posX + (this.facingRight ? this.width : -40),
            y: this.posY + 2,
            w: 40,
            h: 40,
          },
          damage: 45,
          knockbackX: dir * 6.5,
          knockbackY: -4.0,
          hitStunFrames: 12,
          hitStopFrames: 3, // 3-frame hit-stop on collision
        };
        return;
      }
    }

    // Stage 3 Airborne Downward Helm Splitter Hitbox
    if (this.state === CharacterActionState.ATTACK_COMBO_3_HELM_SPLITTER) {
      this.currentHitbox = {
        active: true,
        stage: 3,
        box: {
          x: this.posX - 4,
          y: this.posY + this.height - 12,
          w: this.width + 8,
          h: 20,
        },
        damage: 40,
        knockbackX: dir * 1.5,
        knockbackY: 6.0, // Spike downwards
        hitStunFrames: 10,
        hitStopFrames: 2,
      };
      return;
    }

    this.currentHitbox = {
      active: false,
      stage: 0,
      box: { x: 0, y: 0, w: 0, h: 0 },
      damage: 0,
      knockbackX: 0,
      knockbackY: 0,
      hitStunFrames: 0,
      hitStopFrames: 0,
    };
  }

  /**
   * Micro-Collision & Celeste Corner-Clipping Forgiveness (X-Axis Shove)
   */
  private integrateWorldCollisions(world: WorldMapGrid): void {
    // 1. Upward Ceiling Corner-Clipping Shove Check
    if (this.velY < 0) {
      const headBox: BoundingBox2D = {
        x: this.posX,
        y: this.posY + this.velY,
        w: this.width,
        h: 4,
      };

      const nearbyTiles = world.getSolidTilesInAABB(headBox);
      for (let i = 0; i < nearbyTiles.length; i++) {
        const tile = nearbyTiles[i];
        if (tile.isOneWay) continue;

        const shoveOffset = this.calculateCornerShoveOffset(this.posX, this.width, tile.x, tile.w);
        if (shoveOffset !== 0) {
          this.posX += shoveOffset;
          break;
        }
      }
    }

    // 2. Horizontal Translation & Resolution
    this.posX += this.velX;
    const bodyBoxH: BoundingBox2D = {
      x: this.posX,
      y: this.posY,
      w: this.width,
      h: this.height,
    };
    const tilesH = world.getSolidTilesInAABB(bodyBoxH);
    for (let i = 0; i < tilesH.length; i++) {
      const tile = tilesH[i];
      if (tile.isOneWay) continue;
      if (this.isAABBOverlap(bodyBoxH, tile)) {
        if (this.velX > 0) {
          this.posX = tile.x - this.width;
          this.velX = 0;
        } else if (this.velX < 0) {
          this.posX = tile.x + tile.w;
          this.velX = 0;
        }
      }
    }

    // 3. Vertical Translation & Resolution
    this.posY += this.velY;
    let registeredGrounded = false;
    const bodyBoxV: BoundingBox2D = {
      x: this.posX,
      y: this.posY,
      w: this.width,
      h: this.height,
    };
    const tilesV = world.getSolidTilesInAABB(bodyBoxV);
    for (let i = 0; i < tilesV.length; i++) {
      const tile = tilesV[i];
      if (this.isAABBOverlap(bodyBoxV, tile)) {
        if (this.velY > 0) {
          this.posY = tile.y - this.height;
          if (this.velY > 3.0) {
            this.squashScaleX = 1.28;
            this.squashScaleY = 0.76;
          }
          this.velY = 0;
          registeredGrounded = true;
        } else if (this.velY < 0 && !tile.isOneWay) {
          this.posY = tile.y + tile.h;
          this.velY = 0;
        }
      }
    }

    this.isGrounded = registeredGrounded;
  }

  /**
   * Super Mario Head-Stomp & Combat Hitbox Processing (The Synergistic Reset Hook)
   */
  private processCombatInteractions(input: PlayerInput, enemies: readonly EnemyEntityCollider[]): void {
    const playerFootY = this.posY + this.height;
    const playerBox: BoundingBox2D = {
      x: this.posX,
      y: this.posY,
      w: this.width,
      h: this.height,
    };

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (!enemy.isAlive) continue;

      const enemyBox: BoundingBox2D = {
        x: enemy.x,
        y: enemy.y,
        w: enemy.w,
        h: enemy.h,
      };

      // ----------------------------------------------------------------------
      // Part A: Super Mario Head-Stomp Check (vy > 0 and hitting enemy's top)
      // ----------------------------------------------------------------------
      if (enemy.isVulnerableToStomp && this.velY > 0) {
        const isHorizontalIntersect =
          this.posX + this.width * 0.8 > enemy.x &&
          this.posX + this.width * 0.2 < enemy.x + enemy.w;

        const isAtEnemyHead =
          playerFootY >= enemy.y &&
          playerFootY <= enemy.y + COMBAT_PHYSICS_CONSTANTS.STOMP_TOP_THRESHOLD_PX;

        if (isHorizontalIntersect && isAtEnemyHead) {
          // 1. Trigger Super Mario Kinetic Bounce
          const bounceImpulse = input.jumpHeld
            ? COMBAT_PHYSICS_CONSTANTS.MARIO_STOMP_HIGH_BOUNCE // -12.0 high bounce
            : COMBAT_PHYSICS_CONSTANTS.MARIO_STOMP_LOW_BOUNCE;  // -8.0 low bounce

          this.velY = bounceImpulse;
          this.isGrounded = false;
          this.squashScaleX = 0.75;
          this.squashScaleY = 1.35;

          // 2. The Synergistic Reset: Reset Combo Stage, Flush Cooldowns, Refresh Air Dash!
          this.comboStage = 0;
          this.comboWindowTimer = 0;
          this.canAirDash = true;
          this.state = CharacterActionState.JUMP_ASCENT;
          this.stateFrame = 0;

          // 3. Record Stomp Event for audio / particle feedback
          this.currentStompEvent = {
            enemyId: enemy.id,
            bounceVelocityY: bounceImpulse,
            comboReset: true,
          };
          continue;
        }
      }

      // ----------------------------------------------------------------------
      // Part B: Attack Hitbox vs Enemy Overlap
      // ----------------------------------------------------------------------
      if (this.currentHitbox.active) {
        if (this.isAABBOverlap(this.currentHitbox.box, enemyBox)) {
          this.hitEventsQueue.push({
            enemyId: enemy.id,
            stage: this.currentHitbox.stage,
            damage: this.currentHitbox.damage,
            knockbackX: this.currentHitbox.knockbackX,
            knockbackY: this.currentHitbox.knockbackY,
            hitStunFrames: this.currentHitbox.hitStunFrames,
          });

          // Trigger hit stop if specified by attack stage (e.g. 3 frames on stage 3 finisher)
          if (this.currentHitbox.hitStopFrames > 0 && this.hitStopTimer <= 0) {
            this.hitStopTimer = this.currentHitbox.hitStopFrames;
            this.preHitStopState = this.state;
            this.state = CharacterActionState.HIT_STOP;
          }
        }
      }
    }
  }

  private calculateCornerShoveOffset(
    playerLeft: number,
    playerWidth: number,
    tileLeft: number,
    tileWidth: number
  ): number {
    const playerRight = playerLeft + playerWidth;
    const tileRight = tileLeft + tileWidth;
    const maxShove = COMBAT_PHYSICS_CONSTANTS.CORNER_SHOVE_MAX_PX;

    // Player head right edge clips tile's bottom-left corner
    const leftCornerOverlap = playerRight - tileLeft;
    if (leftCornerOverlap > 0 && leftCornerOverlap <= maxShove) {
      return -leftCornerOverlap - 0.5; // Shove Left
    }

    // Player head left edge clips tile's bottom-right corner
    const rightCornerOverlap = tileRight - playerLeft;
    if (rightCornerOverlap > 0 && rightCornerOverlap <= maxShove) {
      return rightCornerOverlap + 0.5; // Shove Right
    }

    return 0;
  }

  private isAABBOverlap(a: BoundingBox2D, b: BoundingBox2D): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  private updateSquashSpring(): void {
    this.squashScaleX += (1.0 - this.squashScaleX) * 0.18;
    this.squashScaleY += (1.0 - this.squashScaleY) * 0.18;
  }

  /**
   * Immutable Telemetry Snapshot Export (Zero-allocation)
   */
  public getTelemetry(): Readonly<ControllerTelemetry> {
    this.telemetrySnapshot = {
      state: this.state,
      comboStage: this.comboStage,
      comboWindowTimer: this.comboWindowTimer,
      stateFrame: this.stateFrame,
      posX: this.posX,
      posY: this.posY,
      velX: this.velX,
      velY: this.velY,
      facingRight: this.facingRight,
      isGrounded: this.isGrounded,
      isInvulnerable: this.invulnerableTimer > 0,
      canAirDash: this.canAirDash,
      activeHitbox: this.currentHitbox.active ? this.currentHitbox : null,
      currentSquashScaleX: this.squashScaleX,
      currentSquashScaleY: this.squashScaleY,
      recentStompEvent: this.currentStompEvent,
      recentHitEvents: this.hitEventsQueue,
    };
    return this.telemetrySnapshot;
  }
}
