import { build, type ResumeExample } from "./build";

export const projectManager: ResumeExample = {
  slug: "project-manager",
  role: "Project manager",
  blurb: "A project manager who shows budgets, timelines and team size, which is how hiring managers judge scope.",
  tips: [
    "Give the scope of each project: budget, team size and timeline.",
    "Say how it ended: on time, under budget, what it delivered.",
    "List the methods and tools you use: Agile, Scrum, Jira, and PMP if you have it.",
  ],
  keywords: ["project planning", "stakeholder management", "Agile", "Scrum", "Jira", "budget", "risk management", "PMP", "cross-functional teams", "timelines"],
  resume: () =>
    build({
      template: "classic",
      basics: {
        name: "Olivia Grant",
        title: "Project Manager",
        email: "olivia.grant@example.com",
        phone: "(720) 555-0123",
        location: "Denver, CO",
        link: "linkedin.com/in/olivia-grant-example",
      },
      summary:
        "Project manager with 7 years of experience leading software and operations projects. Keeps teams aligned, risks visible and launches on schedule.",
      experience: [
        {
          role: "Senior Project Manager",
          company: "Front Range Energy",
          location: "Denver, CO",
          start: "Mar 2021",
          end: "Present",
          bullets:
            "Led a $2.4M billing system replacement with a team of 18, delivered on time and 6% under budget\nIntroduced Scrum to 3 teams, raising on-time sprint delivery from 60% to 85%\nRun the monthly steering meeting with 8 department heads",
        },
        {
          role: "Project Coordinator",
          company: "Mile High Health",
          location: "Denver, CO",
          start: "Jun 2018",
          end: "Feb 2021",
          bullets:
            "Coordinated the rollout of a new scheduling system to 12 clinics\nTracked budgets, risks and timelines for 5 projects at once in Jira and Smartsheet",
        },
      ],
      education: [
        {
          school: "University of Colorado Boulder",
          degree: "B.S. Business Administration",
          location: "Boulder, CO",
          start: "2014",
          end: "2018",
          details: "",
        },
      ],
      skills: "Project planning, Agile, Scrum, Jira, Smartsheet, Budgeting, Risk management, Stakeholder communication",
      extras: [
        {
          kind: "certifications",
          title: "Certifications",
          items: [
            { title: "Project Management Professional (PMP)", subtitle: "PMI", date: "2022" },
            { title: "Certified ScrumMaster (CSM)", subtitle: "Scrum Alliance", date: "2021" },
          ],
        },
      ],
    }),
};
