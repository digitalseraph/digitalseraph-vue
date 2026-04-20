// @vitest-environment nuxt
import { describe, it, expect, vi } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { defineComponent, h } from "vue";
import { useArrowNav } from "~/composables/useArrowNav";

function mountWith(handlers: { prev?: () => void; next?: () => void }) {
  const C = defineComponent({
    setup() {
      useArrowNav(handlers);
      return () => h("div");
    },
  });
  return mountSuspended(C);
}

function fire(key: string) {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
}

describe("useArrowNav", () => {
  it("calls next on 'j'", async () => {
    const next = vi.fn();
    await mountWith({ next });
    fire("j");
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls prev on 'k'", async () => {
    const prev = vi.fn();
    await mountWith({ prev });
    fire("k");
    expect(prev).toHaveBeenCalledOnce();
  });

  it("calls next on ArrowRight and prev on ArrowLeft", async () => {
    const prev = vi.fn();
    const next = vi.fn();
    await mountWith({ prev, next });
    fire("ArrowRight");
    fire("ArrowLeft");
    expect(next).toHaveBeenCalledOnce();
    expect(prev).toHaveBeenCalledOnce();
  });

  it("ignores keys when focus is in an INPUT", async () => {
    const next = vi.fn();
    await mountWith({ next });
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "j", bubbles: true }));
    expect(next).not.toHaveBeenCalled();
    input.remove();
  });
});
