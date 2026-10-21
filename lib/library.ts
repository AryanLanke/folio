// The list of resumes a person keeps in Folio (one per job type, for example).
// Each resume's content is stored separately; this is just the index.

import { newId } from "@/lib/resume";

export type LibraryEntry = { id: string; name: string; updatedAt: number };

export type Library = { activeId: string; items: LibraryEntry[] };

export function createLibrary(name = "My resume", now = Date.now()): Library {
  const id = newId();
  return { activeId: id, items: [{ id, name, updatedAt: now }] };
}

export function normalizeLibrary(data: unknown): Library | null {
  if (!data || typeof data !== "object") return null;
  const src = data as Record<string, unknown>;
  if (!Array.isArray(src.items)) return null;
  const items = src.items
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .filter((item) => typeof item.id === "string" && item.id !== "")
    .map((item) => ({
      id: item.id as string,
      name: typeof item.name === "string" && item.name.trim() ? item.name : "Untitled resume",
      updatedAt: typeof item.updatedAt === "number" ? item.updatedAt : 0,
    }));
  if (items.length === 0) return null;
  const activeId = items.some((item) => item.id === src.activeId) ? (src.activeId as string) : items[0].id;
  return { activeId, items };
}

export function addEntry(library: Library, name: string, now = Date.now()): { library: Library; id: string } {
  const id = newId();
  return {
    id,
    library: { activeId: id, items: [...library.items, { id, name, updatedAt: now }] },
  };
}

export function renameEntry(library: Library, id: string, name: string): Library {
  const clean = name.trim() || "Untitled resume";
  return { ...library, items: library.items.map((item) => (item.id === id ? { ...item, name: clean } : item)) };
}

export function touchEntry(library: Library, id: string, now = Date.now()): Library {
  return { ...library, items: library.items.map((item) => (item.id === id ? { ...item, updatedAt: now } : item)) };
}

export function selectEntry(library: Library, id: string): Library {
  return library.items.some((item) => item.id === id) ? { ...library, activeId: id } : library;
}

// Removes a resume; the last one can't be removed, so there's always something to edit
export function removeEntry(library: Library, id: string): Library {
  if (library.items.length <= 1) return library;
  const items = library.items.filter((item) => item.id !== id);
  const activeId = library.activeId === id ? items[0].id : library.activeId;
  return { activeId, items };
}

// A name that isn't taken yet: "Frontend resume (copy)", "Frontend resume (copy 2)", ...
export function uniqueName(library: Library, base: string) {
  const taken = new Set(library.items.map((item) => item.name));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base} ${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}
