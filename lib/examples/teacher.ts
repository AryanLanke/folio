import { build, type ResumeExample } from "./build";

export const teacher: ResumeExample = {
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
};
