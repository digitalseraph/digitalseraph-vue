import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import { useTyping } from "~/composables/useTyping";

describe("useTyping", () => {
  it("renders text progressively when started", async () => {
    vi.useFakeTimers();
    const { displayed, start } = useTyping({ text: "hi", speed: 50 });
    expect(displayed.value).toBe("");
    start();
    vi.advanceTimersByTime(50);
    expect(displayed.value).toBe("h");
    vi.advanceTimersByTime(50);
    expect(displayed.value).toBe("hi");
    vi.useRealTimers();
  });

  it("renders full text instantly when reduced motion is set", () => {
    const reduced = ref(true);
    const { displayed, start } = useTyping({ text: "hello", speed: 50, reduced });
    start();
    expect(displayed.value).toBe("hello");
  });

  it("stop() halts typing mid-stream and displayed freezes at current index", () => {
    vi.useFakeTimers();
    const { displayed, start, stop } = useTyping({ text: "hello", speed: 50 });
    start();
    vi.advanceTimersByTime(150);
    expect(displayed.value).toBe("hel");
    stop();
    vi.advanceTimersByTime(200);
    expect(displayed.value).toBe("hel");
    vi.useRealTimers();
  });

  it("reset() clears displayed and resets done flag", () => {
    vi.useFakeTimers();
    const { displayed, done, start, reset } = useTyping({ text: "hi", speed: 50 });
    start();
    vi.advanceTimersByTime(200);
    expect(displayed.value).toBe("hi");
    expect(done.value).toBe(true);
    reset();
    expect(displayed.value).toBe("");
    expect(done.value).toBe(false);
    vi.useRealTimers();
  });

  it("done flag flips true when typing completes", () => {
    vi.useFakeTimers();
    const { done, start } = useTyping({ text: "hi", speed: 50 });
    expect(done.value).toBe(false);
    start();
    vi.advanceTimersByTime(200);
    expect(done.value).toBe(true);
    vi.useRealTimers();
  });
});
