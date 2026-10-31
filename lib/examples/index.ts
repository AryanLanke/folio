// Example resumes by job, for the /examples pages and "Use this example" in the editor, one file
// per job. Every person, company and number in them is made up; emails use example.com and
// phones use 555.

import { accountant } from "./accountant";
import { customerService } from "./customer-service";
import { dataAnalyst } from "./data-analyst";
import { marketing } from "./marketing";
import { nurse } from "./nurse";
import { projectManager } from "./project-manager";
import { sales } from "./sales";
import { softwareEngineer } from "./software-engineer";
import { student } from "./student";
import { teacher } from "./teacher";
import type { ResumeExample } from "./build";

export type { ResumeExample } from "./build";

// In the order the examples list shows them
export const EXAMPLES: ResumeExample[] = [
  softwareEngineer,
  dataAnalyst,
  student,
  marketing,
  sales,
  customerService,
  nurse,
  teacher,
  accountant,
  projectManager,
];

export function findExample(slug: string) {
  return EXAMPLES.find((example) => example.slug === slug);
}
