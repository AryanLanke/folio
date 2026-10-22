import { describe, expect, it } from "vitest";
import {
  addEntry,
  createLibrary,
  normalizeLibrary,
  removeEntry,
  renameEntry,
  selectEntry,
  uniqueName,
} from "@/lib/library";

describe("library", () => {
  it("starts with one active resume", () => {
    const library = createLibrary("My resume", 1);
    expect(library.items).toHaveLength(1);
    expect(library.activeId).toBe(library.items[0].id);
  });

  it("adds a resume and makes it active", () => {
    const { library, id } = addEntry(createLibrary(), "Second", 5);
    expect(library.items.map((i) => i.name)).toEqual(["My resume", "Second"]);
    expect(library.activeId).toBe(id);
  });

  it("renames, touches and selects", () => {
    const start = createLibrary("A", 1);
    const { library: two, id } = addEntry(start, "B", 2);
    const firstId = start.activeId;
    expect(renameEntry(two, id, "  ").items[1].name).toBe("Untitled resume");
    expect(renameEntry(two, id, "Data roles").items[1].name).toBe("Data roles");
    expect(selectEntry(two, firstId).activeId).toBe(firstId);
    expect(selectEntry(two, "missing").activeId).toBe(id);
  });

  it("removes a resume but never the last one", () => {
    const start = createLibrary();
    const { library: two, id } = addEntry(start, "B");
    const after = removeEntry(two, id);
    expect(after.items).toHaveLength(1);
    expect(after.activeId).toBe(start.activeId);
    expect(removeEntry(after, start.activeId)).toEqual(after);
  });

  it("finds unused names", () => {
    const { library } = addEntry(createLibrary("Resume"), "Resume (copy)");
    expect(uniqueName(library, "Fresh")).toBe("Fresh");
    expect(uniqueName(library, "Resume (copy)")).toBe("Resume (copy) 2");
  });

  it("repairs or rejects stored data", () => {
    expect(normalizeLibrary(null)).toBeNull();
    expect(normalizeLibrary({ items: [] })).toBeNull();
    const repaired = normalizeLibrary({ activeId: "gone", items: [{ id: "a", name: "" }, { bad: true }, null] })!;
    expect(repaired.items).toEqual([{ id: "a", name: "Untitled resume", updatedAt: 0 }]);
    expect(repaired.activeId).toBe("a");
  });
});
