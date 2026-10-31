import type { Resume } from "@/lib/resume";

// What every section of the editor gets: the resume, a way to change it, and the job's keywords
export type SectionProps = {
  resume: Resume;
  // checkpoint marks big changes (like removing a job) that Undo should be able to reverse
  set: (patch: Partial<Resume>, checkpoint?: boolean) => void;
  // Job keywords from Job match, so AI wording leans toward the target job
  focus?: string[];
};

// Shared list helpers
export function updateItem<T extends { id: string }>(list: T[], id: string, patch: Partial<T>) {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export function moveItem<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
