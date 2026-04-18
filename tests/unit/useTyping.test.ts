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
});
