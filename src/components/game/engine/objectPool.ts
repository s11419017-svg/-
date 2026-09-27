// 2026 AAA Zero-Allocation Object Pool Engine
// Provides high-performance reusable pools for Particles, Floating Texts, Projectiles & Bullets
// Eliminating Garbage Collection pauses (Zero GC) during intense gameplay

export interface IPoolable {
  active: boolean;
  reset(): void;
}

export class ObjectPool<T extends IPoolable> {
  private pool: T[];
  private factory: () => T;
  private capacity: number;

  constructor(factory: () => T, initialSize: number = 64, capacity: number = 256) {
    this.factory = factory;
    this.capacity = capacity;
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      const item = this.factory();
      item.active = false;
      this.pool.push(item);
    }
  }

  /**
   * Acquire an object from the pool, resetting its state.
   */
  public acquire(): T {
    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i];
      if (!item.active) {
        item.active = true;
        item.reset();
        return item;
      }
    }

    // Expand if under capacity
    if (this.pool.length < this.capacity) {
      const newItem = this.factory();
      newItem.active = true;
      newItem.reset();
      this.pool.push(newItem);
      return newItem;
    }

    // Reuse oldest if at hard capacity
    const fallback = this.pool[0];
    fallback.reset();
    fallback.active = true;
    return fallback;
  }

  /**
   * Release an object back to the pool
   */
  public release(item: T): void {
    item.active = false;
  }

  /**
   * Iterate over all currently active items in-place (Zero Allocation)
   */
  public forEachActive(callback: (item: T, index: number) => void): void {
    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i];
      if (item.active) {
        callback(item, i);
      }
    }
  }

  /**
   * Compact and release inactive items or update active items in-place
   */
  public updateActive(updater: (item: T) => boolean): void {
    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i];
      if (item.active) {
        const stillAlive = updater(item);
        if (!stillAlive) {
          item.active = false;
        }
      }
    }
  }

  /**
   * Clear all active items
   */
  public clear(): void {
    for (let i = 0; i < this.pool.length; i++) {
      this.pool[i].active = false;
    }
  }

  public getActiveCount(): number {
    let count = 0;
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].active) count++;
    }
    return count;
  }
}

/**
 * Concrete Poolable Game Particle with full vector fields
 */
export class PoolableParticle implements IPoolable {
  public active: boolean = false;
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public size: number = 2;
  public color: string = '#ffffff';
  public alpha: number = 1;
  public life: number = 0;
  public maxLife: number = 20;
  public type: 'dust' | 'spark' | 'ring' = 'dust';

  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.size = 2;
    this.color = '#ffffff';
    this.alpha = 1;
    this.life = 0;
    this.maxLife = 20;
    this.type = 'dust';
  }

  public init(
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    color: string,
    maxLife: number,
    type: 'dust' | 'spark' | 'ring' = 'dust',
    alpha: number = 1
  ): this {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.color = color;
    this.maxLife = maxLife;
    this.type = type;
    this.alpha = alpha;
    this.life = 0;
    this.active = true;
    return this;
  }
}

/**
 * Concrete Poolable Floating Notification Text
 */
export class PoolableFloatingText implements IPoolable {
  public active: boolean = false;
  public id: number = 0;
  public x: number = 0;
  public y: number = 0;
  public text: string = '';
  public color: string = '#ffffff';
  public opacity: number = 1;

  public reset(): void {
    this.id = 0;
    this.x = 0;
    this.y = 0;
    this.text = '';
    this.color = '#ffffff';
    this.opacity = 1;
  }

  public init(x: number, y: number, text: string, color: string): this {
    this.id = Date.now() + Math.random();
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.opacity = 1;
    this.active = true;
    return this;
  }
}

/**
 * Concrete Poolable Ghost Trail
 */
export class PoolableGhostTrail implements IPoolable {
  public active: boolean = false;
  public x: number = 0;
  public y: number = 0;
  public alpha: number = 0.6;
  public scaleX: number = 1;
  public scaleY: number = 1;
  public facingRight: boolean = true;
  public isGrace: boolean = false;

  public reset(): void {
    this.x = 0;
    this.y = 0;
    this.alpha = 0.6;
    this.scaleX = 1;
    this.scaleY = 1;
    this.facingRight = true;
    this.isGrace = false;
  }

  public init(
    x: number,
    y: number,
    alpha: number,
    scaleX: number,
    scaleY: number,
    facingRight: boolean,
    isGrace: boolean
  ): this {
    this.x = x;
    this.y = y;
    this.alpha = alpha;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
    this.facingRight = facingRight;
    this.isGrace = isGrace;
    this.active = true;
    return this;
  }
}
