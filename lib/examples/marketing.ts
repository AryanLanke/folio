import { build, type ResumeExample } from "./build";

export const marketing: ResumeExample = {
  slug: "marketing",
  role: "Marketing",
  blurb: "A marketing manager whose bullets lead with results: pipeline, sign-ups and spend, not just campaigns run.",
  tips: [
    "Tie campaigns to results: sign-ups, pipeline, revenue or cost per lead.",
    "Name the channels and tools you ran: SEO, paid social, HubSpot.",
    "Show that you can plan and measure, not only create.",
  ],
  keywords: ["SEO", "content strategy", "paid social", "Google Ads", "HubSpot", "email marketing", "campaigns", "analytics", "brand", "lead generation"],
  resume: () =>
    build({
      template: "bold",
      basics: {
        name: "Rachel Kim",
        title: "Marketing Manager",
        email: "rachel.kim@example.com",
        phone: "(503) 555-0139",
        location: "Portland, OR",
        link: "linkedin.com/in/rachel-kim-example",
      },
      summary:
        "Marketing manager with 5 years in B2B software. Plans campaigns from first idea to pipeline report, and knows which ones paid off.",
      experience: [
        {
          role: "Marketing Manager",
          company: "Evergreen Cloud",
          location: "Portland, OR",
          start: "Jan 2022",
          end: "Present",
          bullets:
            "Grew organic search traffic 3x in 18 months with an SEO content plan of 60 articles\nRan paid social and Google Ads with a $40k monthly budget, lowering cost per lead by 35%\nBuilt HubSpot email nurture flows that turned 1,200 trial sign-ups into sales conversations",
        },
        {
          role: "Marketing Specialist",
          company: "Riverbend Analytics",
          location: "Portland, OR",
          start: "Jun 2019",
          end: "Dec 2021",
          bullets:
            "Launched the company newsletter and grew it to 15,000 subscribers\nPlanned 6 webinars a year that each brought in 300+ registrations",
        },
      ],
      education: [
        {
          school: "University of Oregon",
          degree: "B.A. Communication",
          location: "Eugene, OR",
          start: "2015",
          end: "2019",
          details: "",
        },
      ],
      skills: "SEO, Content strategy, Google Ads, Meta Ads, LinkedIn Ads, HubSpot, Email marketing, Google Analytics, Copywriting",
    }),
};
