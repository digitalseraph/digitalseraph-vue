import { describe, it, expect, vi } from "vitest";
import { ref, nextTick } from "vue";
import { useReveal } from "~/composables/useReveal";

class MockIO {
  static instances: MockIO[] = [];
  callback: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    MockIO.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  fire(isIntersecting: boolean, target: Element) {
    this.callback(
      [{ isIntersecting, target, intersectionRatio: isIntersecting ? 1 : 0 } as any],
      this as any
    );
  }
}

describe("useReveal", () => {
  it("sets visible true when element intersects", async () => {
    vi.stubGlobal("IntersectionObserver", MockIO);
    const el = document.createElement("div");
    const target = ref<HTMLElement | null>(el);
    const { visible } = useReveal(target);
    await nextTick();
    expect(visible.value).toBe(false);
    MockIO.instances[MockIO.instances.length - 1].fire(true, el);
    expect(visible.value).toBe(true);
  });

  it("when once is false, flips visible back to false on exit", async () => {
    vi.stubGlobal("IntersectionObserver", MockIO);
    const el = document.createElement("div");
    const target = ref<HTMLElement | null>(el);
    const { visible } = useReveal(target, { once: false });
    await nextTick();
    const observer = MockIO.instances[MockIO.instances.length - 1];
    observer.fire(true, el);
    expect(visible.value).toBe(true);
    observer.fire(false, el);
    expect(visible.value).toBe(false);
  });
});
