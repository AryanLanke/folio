import { build, type ResumeExample } from "./build";

export const student: ResumeExample = {
  slug: "student",
  role: "Student and internship",
  blurb: "A first resume with little work history: education first, projects and part-time work doing the heavy lifting.",
  tips: [
    "Put Education first while you're still studying, and add relevant courses.",
    "Class projects, clubs and part-time jobs all count as experience. Describe what you did in them.",
    "Part-time work shows reliability. Say what you were trusted with.",
    "One page is plenty. Recruiters expect it for students.",
  ],
  keywords: ["teamwork", "communication", "problem solving", "Excel", "research", "leadership", "time management", "presentations"],
  resume: () => {
    const resume = build({
      template: "minimal",
      basics: {
        name: "Aisha Rahman",
        title: "Business Student",
        email: "aisha.rahman@example.com",
        phone: "(617) 555-0164",
        location: "Boston, MA",
        link: "linkedin.com/in/aisha-rahman-example",
      },
      summary:
        "Third-year business student looking for a summer internship in operations or marketing. Organized, quick to learn, and comfortable with numbers and people.",
      experience: [
        {
          role: "Team Member (part-time)",
          company: "Harbor Coffee Co.",
          location: "Boston, MA",
          start: "Sep 2023",
          end: "Present",
          bullets:
            "Trained 4 new team members on the register and opening checklist\nTook over weekly stock ordering, cutting wasted milk and pastries by about a fifth",
        },
      ],
      education: [
        {
          school: "Northeastern University",
          degree: "B.S. Business Administration (expected May 2027)",
          location: "Boston, MA",
          start: "2023",
          end: "2027",
          details: "GPA 3.6 · Courses: Marketing, Financial Accounting, Business Statistics",
        },
      ],
      projects: [
        {
          name: "Campus Food Delivery Study",
          link: "",
          tech: "Excel, survey design",
          date: "2024",
          bullets:
            "Surveyed 250 students and presented a delivery pricing plan to the dining services team\nLed a group of 4 and kept the project on schedule over 10 weeks",
        },
      ],
      skills: "Excel, Google Sheets, PowerPoint, Canva, Survey design, Public speaking",
      extras: [
        {
          kind: "volunteering",
          title: "Volunteering",
          items: [{ title: "Tutor", subtitle: "Boston Reads", date: "2023 – Present" }],
        },
      ],
    });
    // Education leads while studying
    resume.order = ["summary", "education", "experience", "projects", "skills", ...resume.extras.map((e) => e.id)];
    return resume;
  },
};
