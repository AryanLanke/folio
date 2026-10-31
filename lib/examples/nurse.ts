import { build, type ResumeExample } from "./build";

export const nurse: ResumeExample = {
  slug: "nurse",
  role: "Nurse",
  blurb: "A registered nurse with licenses up front, the unit and patient load clear, and certifications where screeners look for them.",
  tips: [
    "Put your license and certifications where they're easy to find. Screeners check them first.",
    "Say which unit you worked on and how many patients you cared for.",
    "Mention the charting system you use, like Epic or Cerner.",
  ],
  keywords: ["RN", "BLS", "ACLS", "patient care", "Epic", "medication administration", "patient education", "telemetry", "care plans", "infection control"],
  resume: () =>
    build({
      template: "serif",
      basics: {
        name: "Hannah Brooks",
        title: "Registered Nurse",
        email: "hannah.brooks@example.com",
        phone: "(615) 555-0191",
        location: "Nashville, TN",
        link: "",
      },
      summary:
        "Registered nurse with 5 years on medical-surgical and telemetry units. Known for clear patient education and steady work during busy shifts.",
      experience: [
        {
          role: "Registered Nurse, Telemetry",
          company: "Riverside Medical Center",
          location: "Nashville, TN",
          start: "May 2022",
          end: "Present",
          bullets:
            "Care for 4–5 telemetry patients per shift, including cardiac monitoring and drips\nPrecept new graduate nurses; 6 have completed orientation with me\nLed a unit project on discharge teaching that lowered 30-day readmissions by 12%",
        },
        {
          role: "Registered Nurse, Medical-Surgical",
          company: "St. Clare Hospital",
          location: "Franklin, TN",
          start: "Jun 2020",
          end: "Apr 2022",
          bullets:
            "Cared for 5–6 adult patients per shift on a 32-bed unit\nCharted in Epic and joined the unit's fall prevention committee",
        },
      ],
      education: [
        {
          school: "Belmont University",
          degree: "B.S. Nursing",
          location: "Nashville, TN",
          start: "2016",
          end: "2020",
          details: "",
        },
      ],
      skills: "Patient assessment, Telemetry monitoring, IV therapy, Medication administration, Epic, Patient education, Care planning",
      extras: [
        {
          kind: "certifications",
          title: "Licenses and certifications",
          items: [
            { title: "Registered Nurse (RN), Tennessee", subtitle: "Tennessee Board of Nursing", date: "2020" },
            { title: "Basic Life Support (BLS)", subtitle: "American Heart Association", date: "2024" },
            { title: "Advanced Cardiovascular Life Support (ACLS)", subtitle: "American Heart Association", date: "2024" },
          ],
        },
      ],
    }),
};
