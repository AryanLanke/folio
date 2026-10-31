import { build, type ResumeExample } from "./build";

export const sales: ResumeExample = {
  slug: "sales",
  role: "Sales",
  blurb: "An account executive with quota numbers up front, which is the first thing sales hiring managers look for.",
  tips: [
    "Lead with quota: the percentage you hit, the revenue you closed and your ranking on the team.",
    "Mention deal size and sales cycle, so the reader can compare it with their own.",
    "Name your CRM. Salesforce and HubSpot show up in most postings.",
  ],
  keywords: ["quota", "pipeline", "Salesforce", "prospecting", "negotiation", "closing", "account management", "B2B", "CRM", "forecasting"],
  resume: () =>
    build({
      template: "executive",
      basics: {
        name: "Marcus Bennett",
        title: "Account Executive",
        email: "marcus.bennett@example.com",
        phone: "(404) 555-0172",
        location: "Atlanta, GA",
        link: "linkedin.com/in/marcus-bennett-example",
      },
      summary:
        "Account executive with 6 years of B2B software sales. Consistently above quota, with a habit of turning small first deals into long-term accounts.",
      experience: [
        {
          role: "Senior Account Executive",
          company: "Summit Payroll",
          location: "Atlanta, GA",
          start: "Feb 2022",
          end: "Present",
          bullets:
            "Closed $1.8M in new annual revenue in 2024, 124% of quota and #2 of 14 reps\nShortened the average sales cycle from 70 to 48 days with a new demo and trial process\nGrew 10 existing accounts by a combined $400k through upsells",
        },
        {
          role: "Sales Development Representative",
          company: "Peachtree Software",
          location: "Atlanta, GA",
          start: "May 2018",
          end: "Jan 2022",
          bullets:
            "Booked 25+ qualified meetings a month through calls, email and LinkedIn\nPromoted to account executive after 2 years; hit 110% of quota in the first year",
        },
      ],
      education: [
        {
          school: "Georgia State University",
          degree: "B.B.A. Marketing",
          location: "Atlanta, GA",
          start: "2014",
          end: "2018",
          details: "",
        },
      ],
      skills: "Salesforce, HubSpot, Outreach, Prospecting, Discovery calls, Negotiation, Forecasting, Account management",
    }),
};
