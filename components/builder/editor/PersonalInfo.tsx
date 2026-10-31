"use client";

import { Card, Field } from "@/components/builder/fields";
import type { Basics } from "@/lib/resume";
import { checkEmail, checkLink, checkPhone } from "@/lib/validate";

// Name, job title and contact details, at the top of the editor
export default function PersonalInfo({ basics, setBasics }: { basics: Basics; setBasics: (patch: Partial<Basics>) => void }) {
  return (
    <Card title="Personal info">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" value={basics.name} onChange={(v) => setBasics({ name: v })} placeholder="Emily Carter" />
        <Field label="Job title" value={basics.title} onChange={(v) => setBasics({ title: v })} placeholder="Frontend Developer" />
        <Field
          label="Email"
          type="email"
          value={basics.email}
          onChange={(v) => setBasics({ email: v })}
          placeholder="you@example.com"
          warning={checkEmail(basics.email)}
        />
        <Field
          label="Phone"
          type="tel"
          value={basics.phone}
          onChange={(v) => setBasics({ phone: v })}
          placeholder="(512) 555-0142"
          warning={checkPhone(basics.phone)}
        />
        <Field label="Location" value={basics.location} onChange={(v) => setBasics({ location: v })} placeholder="Austin, TX" />
        <Field
          label="Links (LinkedIn, GitHub, portfolio)"
          value={basics.link}
          onChange={(v) => setBasics({ link: v })}
          placeholder="linkedin.com/in/you, github.com/you"
          warning={checkLink(basics.link)}
        />
      </div>
    </Card>
  );
}
