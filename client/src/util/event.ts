export class TypeEvent<EventType> {
  private readonly listeners = new Set<(p: EventType) => void>();

  public invoke(param: EventType) {
    for (const func of this.listeners) {
      func(param);
    }
  }

  public addEventListener(func: (param: EventType) => void) {
    this.listeners.add(func);
  }

  public removeEventListener(func: (param: EventType) => void) {
    this.listeners.delete(func);
  }
}
