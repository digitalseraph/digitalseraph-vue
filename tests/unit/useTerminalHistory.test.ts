import { describe, it, expect } from "vitest";
import { ref } from "vue";
import { useTerminalHistory } from "~/composables/useTerminalHistory";

describe("useTerminalHistory", () => {
  it("currentEntry is null when not browsing (index === -1)", () => {
    const history = ref(["whoami", "help"]);
    const nav = useTerminalHistory(history);
    expect(nav.index.value).toBe(-1);
    expect(nav.currentEntry.value).toBeNull();
  });

  it("up() from fresh state selects the newest entry", () => {
    const history = ref(["whoami", "help", "contact"]);
    const nav = useTerminalHistory(history);
    nav.up();
    expect(nav.index.value).toBe(2);
    expect(nav.currentEntry.value).toBe("contact");
  });

  it("up() walks backward and clamps at 0", () => {
    const history = ref(["a", "b", "c"]);
    const nav = useTerminalHistory(history);
    nav.up(); // -> c (index 2)
    nav.up(); // -> b (index 1)
    nav.up(); // -> a (index 0)
    nav.up(); // clamp at 0
    expect(nav.index.value).toBe(0);
    expect(nav.currentEntry.value).toBe("a");
  });

  it("down() walks forward and resets to -1 past the newest", () => {
    const history = ref(["a", "b", "c"]);
    const nav = useTerminalHistory(history);
    nav.up(); nav.up(); // at index 1 (b)
    nav.down(); // -> c (index 2)
    expect(nav.currentEntry.value).toBe("c");
    nav.down(); // past newest -> reset
    expect(nav.index.value).toBe(-1);
    expect(nav.currentEntry.value).toBeNull();
  });

  it("up() on an empty history is a no-op", () => {
    const history = ref<string[]>([]);
    const nav = useTerminalHistory(history);
    nav.up();
    expect(nav.index.value).toBe(-1);
    expect(nav.currentEntry.value).toBeNull();
  });

  it("reset() returns to -1", () => {
    const history = ref(["a", "b"]);
    const nav = useTerminalHistory(history);
    nav.up();
    nav.reset();
    expect(nav.index.value).toBe(-1);
  });
});
