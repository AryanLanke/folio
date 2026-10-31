// The resume: its shape, and everything that creates, loads, reads or reshapes it.
//
// types.ts      the shape of a resume, its sections and its look, and the page sizes
// create.ts     new entries, a new empty resume and the sample resume
// normalize.ts  turning saved or imported data into a valid resume
// sections.ts   which entries and sections show on the page, in what order and name
// text.ts       splitting multiline fields, lists and skills

export * from "@/lib/resume/types";
export * from "@/lib/resume/create";
export * from "@/lib/resume/normalize";
export * from "@/lib/resume/sections";
export * from "@/lib/resume/text";
