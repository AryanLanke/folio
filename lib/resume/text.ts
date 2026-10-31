// Multiline fields, comma lists and skills, split into their parts.

// Splits a multiline field into bullets, dropping blank lines
export function toLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function toList(text: string) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// Skills can be one list ("Python, SQL, Excel") or grouped, one group per line
// ("Languages: Python, SQL" then "Tools: Git, Docker"). A line without a label is its own group.
export type SkillGroup = { label: string; items: string[] };

const splitSkills = (text: string) =>
  text
    .split(/[,|]/)
    .map((item) => item.trim())
    .filter(Boolean);

export function skillGroups(text: string): SkillGroup[] {
  return toLines(text)
    .map((line) => {
      // "Languages: Python, SQL", and also "Skills- Python | SQL" from some templates. A dash only
      // counts when a space follows it, so "CI-CD, Docker" stays a plain list.
      const labelled = line.match(/^([^,:|]{1,40}?)\s*(?::|-\s)\s*(.*)$/);
      return labelled
        ? { label: labelled[1].trim(), items: splitSkills(labelled[2]) }
        : { label: "", items: splitSkills(line) };
    })
    .filter((group) => group.items.length > 0);
}

// How grouped skills are written back into the skills field, one group per line
export function skillsText(groups: SkillGroup[]) {
  return groups.map((group) => (group.label ? `${group.label}: ` : "") + group.items.join(", ")).join("\n");
}

// Every skill, whether or not they're grouped. "|" separates skills as well as commas.
export function skillList(text: string) {
  return skillGroups(text).flatMap((group) => group.items);
}
