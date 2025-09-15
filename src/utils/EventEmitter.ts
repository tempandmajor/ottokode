// Browser-compatible EventEmitter implementation
export class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    if (!this.events[event]) {
      return false;
    }

    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });

    return true;
  }

  off(event: string, listener?: Function): this {
    if (!this.events[event]) {
      return this;
    }

    if (!listener) {
      delete this.events[event];
      return this;
    }

    const index = this.events[event].indexOf(listener);
    if (index > -1) {
      this.events[event].splice(index, 1);
    }

    return this;
  }

  removeListener(event: string, listener: Function): this {
    return this.off(event, listener);
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }

  once(event: string, listener: Function): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };

    return this.on(event, onceWrapper);
  }

  listeners(event: string): Function[] {
    return this.events[event] ? [...this.events[event]] : [];
  }

  listenerCount(event: string): number {
    return this.events[event] ? this.events[event].length : 0;
  }

  eventNames(): string[] {
    return Object.keys(this.events);
  }
}