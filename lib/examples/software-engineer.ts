import { build, type ResumeExample } from "./build";

export const softwareEngineer: ResumeExample = {
  slug: "software-engineer",
  role: "Software engineer",
  blurb: "A backend-leaning engineer with four years of experience, numbers on every bullet, and a skills list recruiters can search.",
  tips: [
    "Lead each bullet with what you built and end it with what changed: faster, cheaper, more users.",
    "Name the languages and tools in your bullets, not only in Skills. Recruiters search for them.",
    "One or two side projects are worth listing if they show something your job doesn't.",
    "Keep it to one page until you have about ten years of experience.",
  ],
  keywords: ["Python", "Go", "PostgreSQL", "AWS", "Docker", "Kubernetes", "REST APIs", "CI/CD", "system design", "code review"],
  resume: () =>
    build({
      template: "classic",
      basics: {
        name: "Daniel Okafor",
        title: "Software Engineer",
        email: "daniel.okafor@example.com",
        phone: "(206) 555-0188",
        location: "Seattle, WA",
        link: "linkedin.com/in/daniel-okafor-example, github.com/daniel-okafor-example",
      },
      summary:
        "Software engineer with 4 years of experience building reliable backend services in Python and Go. Enjoys making slow systems fast and making on-call quiet.",
      experience: [
        {
          role: "Software Engineer II",
          company: "Cascade Logistics",
          location: "Seattle, WA",
          start: "Mar 2023",
          end: "Present",
          bullets:
            "Rebuilt the shipment tracking API in Go, cutting median response time from 420ms to 90ms\nMoved 12 services from virtual machines to Kubernetes, lowering hosting costs by 28%\nAdded alerts and runbooks that reduced after-hours pages from 15 a month to 3\nReviewed code for a team of 6 and ran the weekly design review",
        },
        {
          role: "Software Engineer",
          company: "Pinecrest Health",
          location: "Remote",
          start: "Jul 2021",
          end: "Feb 2023",
          bullets:
            "Built appointment booking services in Python and PostgreSQL used by 40 clinics\nWrote a test suite that raised coverage from 35% to 80% and caught 2 billing bugs before release\nSet up CI/CD with GitHub Actions, taking deploys from weekly to daily",
        },
      ],
      education: [
        {
          school: "University of Washington",
          degree: "B.S. Computer Science",
          location: "Seattle, WA",
          start: "2017",
          end: "2021",
          details: "",
        },
      ],
      projects: [
        {
          name: "Queue Watch",
          link: "github.com/daniel-okafor-example/queue-watch",
          tech: "Go, Prometheus",
          date: "2024",
          bullets: "Open-source dashboard for message queue backlogs, starred by 400+ developers",
        },
      ],
      skills: "Python, Go, SQL, PostgreSQL, Redis, AWS, Docker, Kubernetes, Terraform, GitHub Actions, REST APIs, gRPC",
    }),
};
