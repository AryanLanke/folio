import { describe, expect, it } from "vitest";
import { GROUP_MS, MAX_STEPS, type History, emptyHistory, record, redo, undo } from "@/lib/history";

// Simulates typing into a field: each call records the previous value and returns the new one
function type(history: History<string>, from: string, to: string, at: number) {
  return { history: record(history, from, at), value: to };
}

describe("undo history", () => {
  it("undoes one step at a time and keeps earlier work", () => {
    let h = emptyHistory<string>();
    h = record(h, "", 1000); // "" -> "Jordan"
    h = record(h, "Jordan", 5000); // "Jordan" -> "Jordan Patel" after a pause
    h = record(h, "Jordan Patel", 9000); // -> "Jordan Patel, Dev" after another pause

    const first = undo(h, "Jordan Patel, Dev")!;
    expect(first.value).toBe("Jordan Patel");
    const second = undo(first.history, first.value)!;
    expect(second.value).toBe("Jordan");
    const third = undo(second.history, second.value)!;
    expect(third.value).toBe("");
    expect(undo(third.history, third.value)).toBeNull();
  });

  it("groups a burst of typing into one step", () => {
    let h = emptyHistory<string>();
    let value = "";
    for (const [i, next] of ["J", "Jo", "Jor", "Jord"].entries()) {
      ({ history: h, value } = type(h, value, next, 1000 + i * 200));
    }
    expect(value).toBe("Jord");
    expect(h.past).toEqual([""]);
    expect(undo(h, value)!.value).toBe("");
  });

  it("starts a new step after a pause", () => {
    let h = emptyHistory<string>();
    h = record(h, "", 1000);
    h = record(h, "a", 1000 + GROUP_MS + 1);
    expect(h.past).toEqual(["", "a"]);
  });

  it("keeps big actions as their own step, even mid-typing", () => {
    let h = emptyHistory<string>();
    h = record(h, "", 1000);
    h = record(h, "typed", 1100, true);
    h = record(h, "after action", 1200);
    expect(h.past).toEqual(["", "typed", "after action"]);
  });

  it("redoes what was undone, and a new change clears redo", () => {
    let h = emptyHistory<string>();
    h = record(h, "a", 1000);
    const undone = undo(h, "b")!;
    const redone = redo(undone.history, undone.value)!;
    expect(redone.value).toBe("b");
    expect(redo(redone.history, redone.value)).toBeNull();

    const changed = record(undone.history, "a", 9000);
    expect(changed.future).toEqual([]);
  });

  it("remembers a limited number of steps", () => {
    let h = emptyHistory<number>();
    for (let i = 0; i < MAX_STEPS + 20; i++) h = record(h, i, i * 10_000, true);
    expect(h.past).toHaveLength(MAX_STEPS);
    expect(h.past[0]).toBe(20);
  });
});
