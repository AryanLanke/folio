import { build, type ResumeExample } from "./build";

export const dataAnalyst: ResumeExample = {
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
};
