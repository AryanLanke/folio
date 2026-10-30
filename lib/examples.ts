import {
  CORE_SECTIONS,
  DEFAULT_STYLE,
  type Education,
  type Experience,
  type ExtraKind,
  type ExtraSection,
  type Project,
  type Resume,
  type TemplateName,
  emptyTarget,
} from "@/lib/resume";

// Example resumes by job, for the /examples pages and "Use this example" in the editor. Every
// person, company and number here is made up; emails use example.com and phones use 555.

export type ResumeExample = {
  slug: string;
  // As it reads in a sentence: "Nurse resume example"
  role: string;
  // One line for the examples list and search results
  blurb: string;
  tips: string[];
  keywords: string[];
  resume: () => Resume;
};

type Draft = {
  template: TemplateName;
  basics: Resume["basics"];
  summary: string;
  experience: Omit<Experience, "id">[];
  education: Omit<Education, "id">[];
  projects?: Omit<Project, "id">[];
  skills: string;
  extras?: { kind: ExtraKind; title: string; items: { title: string; subtitle: string; date: string }[] }[];
};

// Fills in ids, section order and the look, so each example below only lists its content
function build(draft: Draft): Resume {
  const extras: ExtraSection[] = (draft.extras ?? []).map((extra, i) => ({
    id: `extra${i}`,
    kind: extra.kind,
    title: extra.title,
    items: extra.items.map((item, j) => ({ id: `extra${i}-${j}`, bullets: "", ...item })),
  }));
  return {
    basics: draft.basics,
    summary: draft.summary,
    experience: draft.experience.map((job, i) => ({ id: `job${i}`, ...job })),
    education: draft.education.map((school, i) => ({ id: `school${i}`, ...school })),
    projects: (draft.projects ?? []).map((project, i) => ({ id: `project${i}`, ...project })),
    skills: draft.skills,
    extras,
    order: [...CORE_SECTIONS, ...extras.map((extra) => extra.id)],
    titles: {},
    style: { ...DEFAULT_STYLE, template: draft.template },
    target: emptyTarget(),
    coverLetter: "",
  };
}

export const EXAMPLES: ResumeExample[] = [
  {
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
  },
  {
    slug: "data-analyst",
    role: "Data analyst",
    blurb: "An analyst who turns questions into dashboards and decisions, with the SQL and tools listed the way job postings ask for them.",
    tips: [
      "Show the decision your analysis led to, not only the analysis.",
      "List the exact tools: SQL, Python, Tableau or Power BI. Postings filter on them.",
      "A number in every bullet makes the work easy to picture: rows, hours saved, revenue.",
    ],
    keywords: ["SQL", "Python", "Excel", "Tableau", "Power BI", "dashboards", "A/B testing", "data cleaning", "stakeholders", "reporting"],
    resume: () =>
      build({
        template: "modern",
        basics: {
          name: "Sofia Martinez",
          title: "Data Analyst",
          email: "sofia.martinez@example.com",
          phone: "(312) 555-0127",
          location: "Chicago, IL",
          link: "linkedin.com/in/sofia-martinez-example",
        },
        summary:
          "Data analyst with 3 years of experience in retail and e-commerce. Builds the dashboards teams actually open, and explains the numbers in plain words.",
        experience: [
          {
            role: "Data Analyst",
            company: "Lakeshore Retail Group",
            location: "Chicago, IL",
            start: "Aug 2022",
            end: "Present",
            bullets:
              "Built Tableau dashboards for 30 store managers, replacing 10 hours a week of manual Excel reports\nAnalyzed 2 years of sales data in SQL to find slow-moving stock, freeing $1.2M in inventory\nDesigned and read out 8 A/B tests on the online checkout, lifting conversion by 6%",
          },
          {
            role: "Junior Analyst",
            company: "Brightline Marketing",
            location: "Chicago, IL",
            start: "Jun 2021",
            end: "Jul 2022",
            bullets:
              "Cleaned and merged campaign data from 5 ad platforms with Python and pandas\nWrote the monthly performance report read by the leadership team",
          },
        ],
        education: [
          {
            school: "University of Illinois Chicago",
            degree: "B.S. Statistics",
            location: "Chicago, IL",
            start: "2017",
            end: "2021",
            details: "",
          },
        ],
        skills: "SQL, Python (pandas), Excel, Tableau, Power BI, Google Analytics, A/B testing, Statistics",
        extras: [
          {
            kind: "certifications",
            title: "Certifications",
            items: [{ title: "Google Data Analytics Certificate", subtitle: "Google", date: "2022" }],
          },
        ],
      }),
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    slug: "teacher",
    role: "Teacher",
    blurb: "A middle school teacher with grade level, subject and measurable student progress, plus certification where it's expected.",
    tips: [
      "Say which grades and subjects you teach, and roughly how many students.",
      "Show progress with numbers: test scores, reading levels, attendance.",
      "List your teaching license and any endorsements.",
    ],
    keywords: ["lesson planning", "classroom management", "differentiated instruction", "curriculum", "assessment", "IEP", "parent communication", "Google Classroom", "student engagement"],
    resume: () =>
      build({
        template: "elegant",
        basics: {
          name: "Michael Chen",
          title: "Middle School Science Teacher",
          email: "michael.chen@example.com",
          phone: "(919) 555-0146",
          location: "Raleigh, NC",
          link: "",
        },
        summary:
          "Science teacher with 6 years of experience in grades 6–8. Builds hands-on lessons that get every student doing science, not just reading about it.",
        experience: [
          {
            role: "Science Teacher, Grades 7–8",
            company: "Oak Ridge Middle School",
            location: "Raleigh, NC",
            start: "Aug 2021",
            end: "Present",
            bullets:
              "Teach 5 classes of about 28 students, including students with IEPs and English learners\nRaised the share of students passing the state science test from 64% to 78% in two years\nStarted an after-school robotics club that grew from 8 to 35 students",
          },
          {
            role: "Science Teacher, Grade 6",
            company: "Cedar Creek Middle School",
            location: "Durham, NC",
            start: "Aug 2018",
            end: "Jun 2021",
            bullets:
              "Wrote a 6th grade earth science unit adopted by all 4 science teachers at the school\nMoved lessons online in 2020 with Google Classroom and kept weekly attendance above 90%",
          },
        ],
        education: [
          {
            school: "North Carolina State University",
            degree: "M.Ed. Science Education",
            location: "Raleigh, NC",
            start: "2016",
            end: "2018",
            details: "",
          },
          {
            school: "University of North Carolina at Chapel Hill",
            degree: "B.S. Biology",
            location: "Chapel Hill, NC",
            start: "2012",
            end: "2016",
            details: "",
          },
        ],
        skills: "Lesson planning, Classroom management, Differentiated instruction, Google Classroom, Lab safety, Parent communication",
        extras: [
          {
            kind: "certifications",
            title: "Licenses",
            items: [{ title: "North Carolina Teaching License, Science 6–9", subtitle: "NC Department of Public Instruction", date: "2018" }],
          },
        ],
      }),
  },
  {
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
  },
  {
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
  },
];

export function findExample(slug: string) {
  return EXAMPLES.find((example) => example.slug === slug);
}
