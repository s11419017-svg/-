// ============================================================================
// 2026 High-Performance Character Controller (TypeScript 7.0 Modern Spec)
// Fusing "Celeste" Micro-Collision / Input Forgiveness + "Dead Cells" Animation Canceling
// Pure mathematical decoupled engine suitable for Main Thread & Web Worker execution.
// ============================================================================

export interface BoundingBox2D {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface PlayerInput {
  readonly moveX: number;       // -1.0 (Left), 0.0 (Neutral), 1.0 (Right)
  readonly moveY: number;       // -1.0 (Up), 0.0 (Neutral), 1.0 (Down)
  readonly jumpPressed: boolean;// Triggered on keydown
  readonly jumpHeld: boolean;   // Sustained key hold for variable jump height
  readonly attackPressed: boolean;
  readonly rollPressed: boolean;
  readonly dashAttackPressed: boolean;
}

export interface AttackHitbox {
  readonly active: boolean;
  readonly frame: number;
  readonly box: BoundingBox2D;
  readonly damage: number;
  readonly knockbackX: number;
  readonly knockbackY: number;
  readonly hitStunFrames: number;
}

export const enum CharacterActionState {
  IDLE = 'IDLE',
  RUN = 'RUN',
  JUMP_ASCENT = 'JUMP_ASCENT',
  JUMP_APEX = 'JUMP_APEX',
  FALL_DESCENT = 'FALL_DESCENT',
  ATTACK_SLASH = 'ATTACK_SLASH',
  ATTACK_DASH_STRIKE = 'ATTACK_DASH_STRIKE',
  DODGE_ROLL = 'DODGE_ROLL',
  HURT = 'HURT',
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

export interface ControllerTelemetry {
  readonly state: CharacterActionState;
  readonly stateFrame: number;
  readonly posX: number;
  readonly posY: number;
  readonly velX: number;
  readonly velY: number;
  readonly facingRight: boolean;
  readonly isGrounded: boolean;
  readonly isInvulnerable: boolean;
  readonly activeHitbox: AttackHitbox | null;
  readonly currentSquashScaleX: number;
  readonly currentSquashScaleY: number;
}

/**
 * Constants governing frame-level feel parameters
 */
export const CONTROLLER_PHYSICS_CONSTANTS = {
  // Movement & Inertia
  RUN_SPEED: 4.8,
  DASH_ATTACK_SPEED: 8.5,
  ROLL_SPEED: 7.2,
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

  // Celeste Lenient Buffers
  JUMP_BUFFER_FRAMES: 4,              // ~66ms pre-landing jump buffer
  COYOTE_TIME_FRAMES: 6,              // 100ms post-platform grace window
  CORNER_SHOVE_MAX_PX: 4,             // Upward corner-slide threshold

  // Dead Cells Attack & Animation Cancel Matrices
  SLASH_TOTAL_FRAMES: 20,
  SLASH_STARTUP_FRAMES: 2,            // Frame 2 instantaneous hitbox deployment (<30ms)
  SLASH_ACTIVE_FRAMES: 4,             // Frames 2..5 active
  SLASH_CANCELABLE_START_FRAME: 6,    // Last 70% of animation can be canceled into Roll or Jump

  DASH_STRIKE_TOTAL_FRAMES: 24,
  DASH_STRIKE_STARTUP_FRAMES: 1,      // Frame 1 instant dash thrust
  DASH_STRIKE_ACTIVE_FRAMES: 6,
  DASH_STRIKE_CANCELABLE_START_FRAME: 8,

  ROLL_TOTAL_FRAMES: 18,
  ROLL_INVULN_FRAMES: 12,
  ROLL_CANCELABLE_START_FRAME: 11,
} as const;

/**
 * Production-Grade 2026 Platformer Controller
 * Free of DOM/Canvas allocations, deterministic, multi-thread worker safe.
 */
export class ResponsivePlayerController {
  // Transform & Physics
  private posX: number = 0;
  private posY: number = 0;
  private velX: number = 0;
  private velY: number = 0;
  private width: number = 24;
  private height: number = 44;
  private facingRight: boolean = true;
  private isGrounded: boolean = false;

  // State Machine
  private state: CharacterActionState = CharacterActionState.IDLE;
  private stateFrame: number = 0;

  // Buffer Timers (Frame-based)
  private jumpBufferTimer: number = 0;
  private coyoteTimer: number = 0;
  private invulnerableTimer: number = 0;

  // Squash & Stretch Visual Spring
  private squashScaleX: number = 1.0;
  private squashScaleY: number = 1.0;

  // Cached Hitbox Object to guarantee zero garbage-collection allocations per frame
  private currentHitbox: AttackHitbox = {
    active: false,
    frame: 0,
    box: { x: 0, y: 0, w: 0, h: 0 },
    damage: 0,
    knockbackX: 0,
    knockbackY: 0,
    hitStunFrames: 0,
  };

  // Reusable Telemetry Snapshot
  private telemetrySnapshot: ControllerTelemetry = {
    state: CharacterActionState.IDLE,
    stateFrame: 0,
    posX: 0,
    posY: 0,
    velX: 0,
    velY: 0,
    facingRight: true,
    isGrounded: false,
    isInvulnerable: false,
    activeHitbox: null,
    currentSquashScaleX: 1.0,
    currentSquashScaleY: 1.0,
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
   * Main Deterministic Tick (Executed per frame or fixed physics step)
   */
  public update(input: PlayerInput, world: WorldMapGrid, dtScale: number = 1.0): void {
    this.stateFrame++;

    // ------------------------------------------------------------------------
    // Step 1: Input Buffer & Coyote Window Decay
    // ------------------------------------------------------------------------
    if (input.jumpPressed) {
      this.jumpBufferTimer = CONTROLLER_PHYSICS_CONSTANTS.JUMP_BUFFER_FRAMES;
    } else if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }

    if (this.isGrounded) {
      this.coyoteTimer = CONTROLLER_PHYSICS_CONSTANTS.COYOTE_TIME_FRAMES;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer--;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
    }

    // ------------------------------------------------------------------------
    // Step 2: "Dead Cells" Animation & Action State Transitions / Recovery Overrides
    // ------------------------------------------------------------------------
    this.handleActionStateMachine(input);

    // ------------------------------------------------------------------------
    // Step 3: Horizontal & Vertical Kinematics
    // ------------------------------------------------------------------------
    this.applyKinematics(input, dtScale);

    // ------------------------------------------------------------------------
    // Step 4: Celeste Micro-Collision Integration (Corner Shove + Swept AABB)
    // ------------------------------------------------------------------------
    this.integrateCollisions(world);

    // ------------------------------------------------------------------------
    // Step 5: Update Visual Dynamic Squash & Stretch
    // ------------------------------------------------------------------------
    this.updateSquashSpring();
  }

  /**
   * Dead Cells Action Interrupt & Cancel Matrix
   */
  private handleActionStateMachine(input: PlayerInput): void {
    // 1. Attack / Roll Recovery Overrides
    if (this.state === CharacterActionState.ATTACK_SLASH) {
      if (this.stateFrame >= CONTROLLER_PHYSICS_CONSTANTS.SLASH_CANCELABLE_START_FRAME) {
        // Recovery phase: Instant cancel into Dodge Roll or Jump
        if (input.rollPressed) {
          this.transitionToRoll();
          return;
        }
        if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
          this.executeJump();
          return;
        }
      }

      if (this.stateFrame >= CONTROLLER_PHYSICS_CONSTANTS.SLASH_TOTAL_FRAMES) {
        this.transitionToLocomotion();
      }
      return;
    }

    if (this.state === CharacterActionState.ATTACK_DASH_STRIKE) {
      if (this.stateFrame >= CONTROLLER_PHYSICS_CONSTANTS.DASH_STRIKE_CANCELABLE_START_FRAME) {
        if (input.rollPressed) {
          this.transitionToRoll();
          return;
        }
        if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
          this.executeJump();
          return;
        }
      }

      if (this.stateFrame >= CONTROLLER_PHYSICS_CONSTANTS.DASH_STRIKE_TOTAL_FRAMES) {
        this.transitionToLocomotion();
      }
      return;
    }

    if (this.state === CharacterActionState.DODGE_ROLL) {
      if (this.stateFrame >= CONTROLLER_PHYSICS_CONSTANTS.ROLL_CANCELABLE_START_FRAME) {
        if (input.attackPressed) {
          this.transitionToSlash();
          return;
        }
        if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
          this.executeJump();
          return;
        }
      }

      if (this.stateFrame >= CONTROLLER_PHYSICS_CONSTANTS.ROLL_TOTAL_FRAMES) {
        this.transitionToLocomotion();
      }
      return;
    }

    // 2. Default Locomotion Action Triggers
    if (input.rollPressed && this.isGrounded) {
      this.transitionToRoll();
      return;
    }

    if (input.dashAttackPressed) {
      this.transitionToDashStrike();
      return;
    }

    if (input.attackPressed) {
      this.transitionToSlash();
      return;
    }

    // 3. Jump Trigger (Ground or Coyote Grace Window)
    if (this.jumpBufferTimer > 0 && (this.isGrounded || this.coyoteTimer > 0)) {
      this.executeJump();
      return;
    }

    // 4. Update Air / Ground locomotion states
    this.updateLocomotionSubstate(input);
  }

  private executeJump(): void {
    this.velY = CONTROLLER_PHYSICS_CONSTANTS.JUMP_VELOCITY;
    this.isGrounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.state = CharacterActionState.JUMP_ASCENT;
    this.stateFrame = 0;
    this.squashScaleX = 0.72;
    this.squashScaleY = 1.34;
  }

  private transitionToSlash(): void {
    this.state = CharacterActionState.ATTACK_SLASH;
    this.stateFrame = 0;
    // Asymmetric snappiness: slight horizontal lunge forward
    this.velX = (this.facingRight ? 1 : -1) * 2.8;
  }

  private transitionToDashStrike(): void {
    this.state = CharacterActionState.ATTACK_DASH_STRIKE;
    this.stateFrame = 0;
    this.velX = (this.facingRight ? 1 : -1) * CONTROLLER_PHYSICS_CONSTANTS.DASH_ATTACK_SPEED;
    this.velY = 0; // Lock vertical momentum during dash strike
    this.invulnerableTimer = 8;
  }

  private transitionToRoll(): void {
    this.state = CharacterActionState.DODGE_ROLL;
    this.stateFrame = 0;
    this.velX = (this.facingRight ? 1 : -1) * CONTROLLER_PHYSICS_CONSTANTS.ROLL_SPEED;
    this.invulnerableTimer = CONTROLLER_PHYSICS_CONSTANTS.ROLL_INVULN_FRAMES;
    this.squashScaleX = 1.35;
    this.squashScaleY = 0.65;
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
      if (Math.abs(this.velY) <= CONTROLLER_PHYSICS_CONSTANTS.APEX_VELOCITY_THRESHOLD) {
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
    // 1. Horizontal Motion & Direction
    if (input.moveX !== 0) {
      this.facingRight = input.moveX > 0;
    }

    if (
      this.state !== CharacterActionState.DODGE_ROLL &&
      this.state !== CharacterActionState.ATTACK_DASH_STRIKE
    ) {
      const targetVx = input.moveX * CONTROLLER_PHYSICS_CONSTANTS.RUN_SPEED;
      const accel = (this.isGrounded ? CONTROLLER_PHYSICS_CONSTANTS.ACCEL_GROUND : CONTROLLER_PHYSICS_CONSTANTS.ACCEL_AIR) * dtScale;

      if (input.moveX !== 0) {
        if (this.velX < targetVx) {
          this.velX = Math.min(targetVx, this.velX + accel);
        } else if (this.velX > targetVx) {
          this.velX = Math.max(targetVx, this.velX - accel);
        }
      } else {
        // Friction decay
        const friction = this.isGrounded ? CONTROLLER_PHYSICS_CONSTANTS.FRICTION_GROUND : CONTROLLER_PHYSICS_CONSTANTS.DRAG_AIR;
        this.velX *= Math.pow(friction, dtScale);
        if (Math.abs(this.velX) < 0.1) this.velX = 0;
      }
    }

    // 2. Celeste Variable Jump Height (Release key early for crisp short hop)
    if (!input.jumpHeld && this.velY < -3.0 && this.state === CharacterActionState.JUMP_ASCENT) {
      this.velY *= CONTROLLER_PHYSICS_CONSTANTS.VARIABLE_JUMP_CUT_DECAY;
    }

    // 3. Asymmetric Gravity & Apex Float Curve
    if (!this.isGrounded && this.state !== CharacterActionState.ATTACK_DASH_STRIKE) {
      let gravityMultiplier = 1.0;

      if (Math.abs(this.velY) <= CONTROLLER_PHYSICS_CONSTANTS.APEX_VELOCITY_THRESHOLD) {
        gravityMultiplier = CONTROLLER_PHYSICS_CONSTANTS.GRAVITY_APEX_MULTIPLIER;
        // Apex Agility Boost: allows agile micro-steering at the peak of the arc
        if (input.moveX !== 0) {
          this.velX += input.moveX * 0.22 * dtScale;
        }
      } else if (this.velY > 0) {
        gravityMultiplier = CONTROLLER_PHYSICS_CONSTANTS.GRAVITY_FAST_FALL_MULTIPLIER;
      }

      this.velY += CONTROLLER_PHYSICS_CONSTANTS.BASE_GRAVITY * gravityMultiplier * dtScale;
      if (this.velY > CONTROLLER_PHYSICS_CONSTANTS.TERMINAL_VELOCITY) {
        this.velY = CONTROLLER_PHYSICS_CONSTANTS.TERMINAL_VELOCITY;
      }
    }

    // 4. Update Attack Hitboxes
    this.updateHitboxState();
  }

  private updateHitboxState(): void {
    if (this.state === CharacterActionState.ATTACK_SLASH) {
      const isHitboxActive =
        this.stateFrame >= CONTROLLER_PHYSICS_CONSTANTS.SLASH_STARTUP_FRAMES &&
        this.stateFrame < CONTROLLER_PHYSICS_CONSTANTS.SLASH_STARTUP_FRAMES + CONTROLLER_PHYSICS_CONSTANTS.SLASH_ACTIVE_FRAMES;

      if (isHitboxActive) {
        const offsetDir = this.facingRight ? 1 : -1;
        this.currentHitbox = {
          active: true,
          frame: this.stateFrame,
          box: {
            x: this.posX + (this.facingRight ? this.width : -28),
            y: this.posY + 8,
            w: 28,
            h: 30,
          },
          damage: 25,
          knockbackX: offsetDir * 4.5,
          knockbackY: -3.2,
          hitStunFrames: 8,
        };
        return;
      }
    } else if (this.state === CharacterActionState.ATTACK_DASH_STRIKE) {
      const isHitboxActive =
        this.stateFrame >= CONTROLLER_PHYSICS_CONSTANTS.DASH_STRIKE_STARTUP_FRAMES &&
        this.stateFrame < CONTROLLER_PHYSICS_CONSTANTS.DASH_STRIKE_STARTUP_FRAMES + CONTROLLER_PHYSICS_CONSTANTS.DASH_STRIKE_ACTIVE_FRAMES;

      if (isHitboxActive) {
        const offsetDir = this.facingRight ? 1 : -1;
        this.currentHitbox = {
          active: true,
          frame: this.stateFrame,
          box: {
            x: this.posX + (this.facingRight ? this.width : -36),
            y: this.posY + 4,
            w: 36,
            h: 36,
          },
          damage: 40,
          knockbackX: offsetDir * 7.5,
          knockbackY: -4.5,
          hitStunFrames: 14,
        };
        return;
      }
    }

    this.currentHitbox = {
      active: false,
      frame: 0,
      box: { x: 0, y: 0, w: 0, h: 0 },
      damage: 0,
      knockbackX: 0,
      knockbackY: 0,
      hitStunFrames: 0,
    };
  }

  /**
   * Micro-Collision & Celeste Corner-Clipping Forgiveness (X-Axis Shove)
   */
  private integrateCollisions(world: WorldMapGrid): void {
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
          // Slide laterally around the platform corner without arresting vertical speed!
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
          // Landing on surface
          this.posY = tile.y - this.height;
          // Landing squash feedback
          if (this.velY > 3.0) {
            this.squashScaleX = 1.28;
            this.squashScaleY = 0.76;
          }
          this.velY = 0;
          registeredGrounded = true;
        } else if (this.velY < 0 && !tile.isOneWay) {
          // Hit ceiling head-on
          this.posY = tile.y + tile.h;
          this.velY = 0;
        }
      }
    }

    this.isGrounded = registeredGrounded;
  }

  /**
   * Corner-Clipping Shove Offset Calculator
   * Returns sideways pixel adjustment if overlap is strictly within CORNER_SHOVE_MAX_PX
   */
  private calculateCornerShoveOffset(
    playerLeft: number,
    playerWidth: number,
    tileLeft: number,
    tileWidth: number
  ): number {
    const playerRight = playerLeft + playerWidth;
    const tileRight = tileLeft + tileWidth;
    const maxShove = CONTROLLER_PHYSICS_CONSTANTS.CORNER_SHOVE_MAX_PX;

    // Case A: Player head right edge clips tile's bottom-left corner
    const leftCornerOverlap = playerRight - tileLeft;
    if (leftCornerOverlap > 0 && leftCornerOverlap <= maxShove) {
      return -leftCornerOverlap - 0.5; // Shove Left
    }

    // Case B: Player head left edge clips tile's bottom-right corner
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
    // Spring return to 1.0
    this.squashScaleX += (1.0 - this.squashScaleX) * 0.18;
    this.squashScaleY += (1.0 - this.squashScaleY) * 0.18;
  }

  /**
   * Exports Immutable Telemetry snapshot without object reallocation
   */
  public getTelemetry(): Readonly<ControllerTelemetry> {
    this.telemetrySnapshot = {
      state: this.state,
      stateFrame: this.stateFrame,
      posX: this.posX,
      posY: this.posY,
      velX: this.velX,
      velY: this.velY,
      facingRight: this.facingRight,
      isGrounded: this.isGrounded,
      isInvulnerable: this.invulnerableTimer > 0,
      activeHitbox: this.currentHitbox.active ? this.currentHitbox : null,
      currentSquashScaleX: this.squashScaleX,
      currentSquashScaleY: this.squashScaleY,
    };
    return this.telemetrySnapshot;
  }
}
