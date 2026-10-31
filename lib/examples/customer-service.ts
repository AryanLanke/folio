import { build, type ResumeExample } from "./build";

export const customerService: ResumeExample = {
  slug: "customer-service",
  role: "Customer service",
  blurb: "A support specialist who shows speed, satisfaction scores and the problems they solved for good.",
  tips: [
    "Use the numbers support teams track: satisfaction score, response time, tickets a day.",
    "Show a time you fixed the cause of a problem, not only the ticket.",
    "Name the help desk tools you know, like Zendesk or Freshdesk.",
  ],
  keywords: ["customer satisfaction", "CSAT", "Zendesk", "troubleshooting", "de-escalation", "live chat", "phone support", "ticketing", "communication", "empathy"],
  resume: () =>
    build({
      template: "compact",
      basics: {
        name: "Jasmine Torres",
        title: "Customer Support Specialist",
        email: "jasmine.torres@example.com",
        phone: "(602) 555-0115",
        location: "Phoenix, AZ",
        link: "",
      },
      summary:
        "Customer support specialist with 4 years of phone, chat and email support. Calm with upset customers and quick to spot when one problem is really many.",
      experience: [
        {
          role: "Customer Support Specialist",
          company: "Desert Sun Internet",
          location: "Phoenix, AZ",
          start: "Apr 2022",
          end: "Present",
          bullets:
            "Resolve 45+ tickets a day across phone, chat and email with a 96% satisfaction score\nWrote 20 help center articles that cut repeat questions about billing by 30%\nTrain new hires on Zendesk and the escalation process",
        },
        {
          role: "Customer Service Associate",
          company: "Valley Home Goods",
          location: "Tempe, AZ",
          start: "Jun 2020",
          end: "Mar 2022",
          bullets:
            "Handled returns, exchanges and complaints for a store with 2,000 visitors a week\nNamed associate of the month 3 times for customer feedback",
        },
      ],
      education: [
        {
          school: "Phoenix College",
          degree: "A.A. Business",
          location: "Phoenix, AZ",
          start: "2018",
          end: "2020",
          details: "",
        },
      ],
      skills: "Zendesk, Freshdesk, Live chat, Phone support, Troubleshooting, De-escalation, Microsoft Office, Bilingual (English and Spanish)",
      extras: [
        {
          kind: "languages",
          title: "Languages",
          items: [
            { title: "English", subtitle: "Native", date: "" },
            { title: "Spanish", subtitle: "Fluent", date: "" },
          ],
        },
      ],
    }),
};
