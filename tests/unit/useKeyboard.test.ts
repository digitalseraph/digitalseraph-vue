// tests/unit/useKeyboard.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { useCommandKey } from "~/composables/useKeyboard";

const makeHarness = (handler: () => void) =>
  defineComponent({
    setup() {
      useCommandKey(handler);
      return () => h("div");
    },
  });

describe("useCommandKey", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fires handler on Meta+K and calls preventDefault", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      cancelable: true,
    });
    const preventSpy = vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);
    expect(handler).toHaveBeenCalledOnce();
    expect(preventSpy).toHaveBeenCalledOnce();
  });

  it("fires handler on Ctrl+K", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
    );
    expect(handler).toHaveBeenCalledOnce();
  });

  it("is case-insensitive (fires on Meta+K and Meta+k)", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "K", metaKey: true })
    );
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("does not fire on plain K without modifier", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not fire on Meta+J (different key)", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "j", metaKey: true })
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("removes listener on unmount", () => {
    const handler = vi.fn();
    const wrapper = mount(makeHarness(handler));
    wrapper.unmount();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
    expect(handler).not.toHaveBeenCalled();
  });
});
