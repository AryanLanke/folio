import type { Page } from "@playwright/test";

// Starts the editor with these resumes already saved, the way a returning visitor would have them
export async function seedResumes(page: Page, resumes: Record<string, { name: string; resume: object }>) {
  await page.goto("/privacy");
  await page.evaluate((entries) => {
    localStorage.clear();
    const items = Object.entries(entries).map(([id, entry]) => ({ id, name: entry.name, updatedAt: 0 }));
    localStorage.setItem("folio:library", JSON.stringify({ activeId: items[0].id, items }));
    for (const [id, entry] of Object.entries(entries)) localStorage.setItem(`folio:resume:${id}`, JSON.stringify(entry.resume));
  }, resumes);
}

export async function savedLibrary(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("folio:library") ?? "null"));
}

// On a phone the editor and the page take turns on screen: shows the page, like tapping Preview.
// On wider screens both are always there, so it does nothing.
export async function showPage(page: Page) {
  const preview = page.getByRole("button", { name: "preview" });
  if (await preview.isVisible()) await preview.click();
}

// The big score number on the Score or ATS check tab
export async function shownScore(page: Page) {
  const text = await page.locator(".text-6xl").first().textContent();
  return Number(text?.split("/")[0]);
}

// A resume like many people import: typed bullets, a sentence split over two lines by the PDF,
// no education and a one-line summary
export const weakResume = {
  basics: { name: "Priya Manjare", title: "", email: "priya@example.com", phone: "8308034464", location: "", link: "" },
  summary: "Software developer with backend experience.",
  experience: [
    {
      id: "a",
      role: "Software Development Intern",
      company: "Ambugrid",
      location: "",
      start: "Jun 2026",
      end: "Present",
      bullets: [
        "• • Developed backend services for a multi-client compliance",
        "platform using FastAPI, MongoDB, Beanie and APScheduler.",
        "• Built scheduled jobs that send reminders to 12 clients",
      ].join("\n"),
    },
  ],
  education: [],
  projects: [],
  skills: "Python, FastAPI, MongoDB",
};

// A fictional resume as full as a real one: eight skill groups, three projects, two schools. With
// Compact, Tight and A4 it fills a page to within a few points, where the PDF and the preview
// have to agree on whether it fits.
export const denseResume = {
  basics: { name: "Emily Carter", title: "", email: "emily.carter@example.com", phone: "(512) 555-0142", location: "", link: "github.com/emily-carter-example, linkedin.com/in/emily-carter-example" },
  summary: "",
  experience: [
    {
      id: "e1",
      role: "Backend Developer Intern",
      company: "Northfield Systems LLC",
      location: "",
      start: "06/2026",
      end: "Present",
      bullets: [
        "Develop backend services for a multi-tenant billing platform with Django, PostgreSQL, Celery and Redis, implementing pricing rules and automated invoice reminders",
        "Build data import pipelines across 9 partner systems, cleaning and deduplicating 8,000+ customer records for a centralized reporting library",
        "Engineer a search assistant using open-source embeddings, Qdrant and a hosted language model, indexing 12,000+ help-center articles for semantic retrieval",
      ].join("\n"),
    },
  ],
  education: [
    { id: "d1", school: "Northfield Institute Of Technology", degree: "Bachelor in Computer Science Engineering", location: "", start: "2023", end: "2027", details: "CGPA-8.5" },
    { id: "d2", school: "Lakeview High School", degree: "Higher Secondary", location: "", start: "2021", end: "2023", details: "" },
  ],
  projects: [
    {
      id: "p1",
      name: "Campus Events Portal",
      link: "github.com/emily-carter-example/events",
      tech: "React, TypeScript, Node.js, Express, PostgreSQL, JWT, Vite",
      date: "2026",
      bullets: [
        "Built a role-based events platform with Node.js, Express and PostgreSQL, supporting Admin, Organizer and Student workflows",
        "Designed REST APIs for ticketing, check-ins, scheduling and volunteer management, including reminders and attendance exports for event organizers",
        "Implemented JWT authentication and RBAC for secure, role-specific access to application resources",
      ].join("\n"),
    },
    {
      id: "p2",
      name: "Team Chat Application",
      link: "github.com/emily-carter-example/chat",
      tech: "Node.js, Socket.IO, Docker, Caddy, Terraform, Linux, systemd",
      date: "2025",
      bullets: [
        "Built a real-time messaging backend with Node.js, implementing event-driven communication and connection and session management",
        "Containerized the application using Docker and configured Caddy as a reverse proxy for HTTP and WebSocket traffic",
        "Automated deployment and service configuration using Terraform, systemd and Linux infrastructure",
      ].join("\n"),
    },
    {
      id: "p3",
      name: "Photo Sharing Backend API",
      link: "github.com/emily-carter-example/photos",
      tech: "Node.js,Express,PostgreSQL,Prisma,Authentication",
      date: "2025",
      bullets: [
        "Built a RESTful backend API for a photo sharing platform using Node.js and Express, implementing user authentication, albums, comments, likes and messaging",
        "Implemented token-based authentication and protected routes, with bcrypt password hashing to secure user credentials",
        "Structured the application using controllers, models, routes and middleware, enabling modular API development and role-specific request handling",
      ].join("\n"),
    },
  ],
  skills: [
    "Languages: Python, Go, JavaScript, TypeScript, SQL",
    "Frontend: HTML5, CSS3",
    "Backend: Django, Flask, FastAPI, REST APIs, WebSockets",
    "Databases: PostgreSQL, MySQL, Redis, SQLAlchemy, Alembic",
    "AI & Data: Embeddings, Vector Search, Qdrant, Pandas, Data Processing",
    "Security: OAuth2, Authentication, RBAC, hashing",
    "Cloud & DevOps: AWS EC2, AWS S3, Docker, Linux, Caddy, GitHub Actions, CI/CD",
    "Tools: Git, GitHub, Insomnia",
  ].join("\n"),
  extras: [
    {
      id: "x1",
      kind: "custom",
      title: "Open Source & Achievements",
      items: [
        { id: "i1", title: "Open Source Docs", subtitle: "Contributed to a popular open-source project by authoring and submitting a documentation improvement that was reviewed and merged into the project.", date: "", bullets: "" },
        { id: "i2", title: "Coding Practice", subtitle: "Solved 300+ practice problems covering data structures and algorithms.", date: "", bullets: "" },
      ],
    },
  ],
  order: ["summary", "experience", "skills", "projects", "x1", "education"],
  titles: {},
  style: { template: "compact", fontSize: "medium", spacing: "compact", links: "label", accent: "#1d6b45" },
  target: { description: "", title: "", company: "", keywords: [] },
  coverLetter: "",
};
