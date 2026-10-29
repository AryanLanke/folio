import { type Field, text } from "@/components/resume/page/fields";
import { resumeLinks } from "@/lib/links";
import type { Resume } from "@/lib/resume";

// The contact line under the name: email | phone | location | links
export default function Contact({ resume, set }: { resume: Resume; set?: (change: Partial<Resume["basics"]>) => void }) {
  const { basics } = resume;
  const field = (key: "email" | "phone" | "location", label: string): Field => ({
    value: basics[key],
    label,
    onCommit: set && ((next) => set({ [key]: next })),
  });
  const items = [
    // An email address you can edit isn't also a link, so clicking it edits instead of opening mail
    basics.email &&
      (set ? (
        <span key="email">{text(field("email", "Email"))}</span>
      ) : (
        <a key="email" href={`mailto:${basics.email}`}>
          {basics.email}
        </a>
      )),
    basics.phone && <span key="phone">{text(field("phone", "Phone"))}</span>,
    basics.location && <span key="location">{text(field("location", "Location"))}</span>,
    ...resumeLinks(basics.link, resume.style.links).map((link) => (
      <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
        {link.text}
      </a>
    )),
  ].filter(Boolean);
  if (items.length === 0) return null;
  return (
    <p className="mt-1.5 text-neutral-600">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="px-2 text-neutral-400">|</span>}
          {item}
        </span>
      ))}
    </p>
  );
}
