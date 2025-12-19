/**
 * Lock Manager - Prevents race conditions in localStorage operations
 *
 * Usage:
 *   await lockManager.acquireLock('credit:user123', async () => {
 *     // Critical section - guaranteed single execution
 *   });
 */

class LockManager {
  private locks: Map<string, Promise<void>> = new Map();

  /**
   * Acquires a lock for the given key and executes the function
   * @param key - Unique lock identifier (e.g., 'credit:userId', 'booking:bookingId')
   * @param fn - Function to execute while holding the lock
   * @param timeoutMs - Maximum time to wait for lock (default: 5000ms)
   */
  async acquireLock<T>(key: string, fn: () => Promise<T>, timeoutMs: number = 5000): Promise<T> {
    // Wait for any existing lock on this key
    while (this.locks.has(key)) {
      const existingLock = this.locks.get(key);
      if (existingLock) {
        await Promise.race([
          existingLock,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Lock timeout for key: ${key}`)), timeoutMs)
          )
        ]).catch(() => {
          // Timeout - force remove stale lock
          this.locks.delete(key);
        });
      }
    }

    // Create new lock
    let resolveLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    this.locks.set(key, lockPromise);

    try {
      // Execute the critical section
      const result = await fn();
      return result;
    } finally {
      // Always release the lock
      this.locks.delete(key);
      resolveLock!();
    }
  }

  /**
   * Check if a lock is currently held for a key
   */
  isLocked(key: string): boolean {
    return this.locks.has(key);
  }

  /**
   * Clear all locks (use with caution - mainly for testing)
   */
  clearAll(): void {
    this.locks.clear();
  }
}

// Singleton instance
export const lockManager = new LockManager();
