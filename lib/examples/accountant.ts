import { build, type ResumeExample } from "./build";

export const accountant: ResumeExample = {
  slug: "accountant",
  role: "Accountant",
  blurb: "A staff accountant with month-end close, reconciliations and the software employers filter for, each backed by a number.",
  tips: [
    "Show speed and accuracy: days to close, accounts reconciled, errors caught.",
    "Name the accounting software: QuickBooks, NetSuite, SAP, Excel.",
    "Put your CPA status near the top, even if it's in progress.",
  ],
  keywords: ["month-end close", "reconciliations", "general ledger", "GAAP", "accounts payable", "accounts receivable", "QuickBooks", "NetSuite", "Excel", "audit"],
  resume: () =>
    build({
      template: "academic",
      basics: {
        name: "Priya Patel",
        title: "Staff Accountant",
        email: "priya.patel@example.com",
        phone: "(214) 555-0158",
        location: "Dallas, TX",
        link: "linkedin.com/in/priya-patel-example",
      },
      summary:
        "Staff accountant with 4 years of experience in month-end close, reconciliations and audit prep. CPA candidate, with 3 of 4 exam sections passed.",
      experience: [
        {
          role: "Staff Accountant",
          company: "Lone Star Manufacturing",
          location: "Dallas, TX",
          start: "Jan 2022",
          end: "Present",
          bullets:
            "Own the month-end close for 3 entities; helped cut close time from 10 days to 6\nReconcile 40+ balance sheet accounts each month in NetSuite\nPrepared support for the yearly audit, which closed with no findings two years running",
        },
        {
          role: "Accounting Associate",
          company: "Trinity Property Group",
          location: "Dallas, TX",
          start: "Jun 2020",
          end: "Dec 2021",
          bullets:
            "Processed 300+ vendor invoices a month in QuickBooks\nBuilt an Excel tracker for late rent that cut overdue balances by 20%",
        },
      ],
      education: [
        {
          school: "University of Texas at Dallas",
          degree: "B.S. Accounting",
          location: "Richardson, TX",
          start: "2016",
          end: "2020",
          details: "",
        },
      ],
      skills: "GAAP, Month-end close, Reconciliations, General ledger, Accounts payable, NetSuite, QuickBooks, Excel (pivot tables, XLOOKUP)",
      extras: [
        {
          kind: "certifications",
          title: "Certifications",
          items: [{ title: "CPA candidate (3 of 4 sections passed)", subtitle: "Texas State Board of Public Accountancy", date: "2025" }],
        },
      ],
    }),
};
