import { describe, expect, it } from "vitest";
import { linkDisplay, linkHref, linkLabel, resumeLinks, splitLinks } from "@/lib/links";

describe("linkHref", () => {
  it("adds https:// when it's missing and keeps it when it's there", () => {
    expect(linkHref("linkedin.com/in/jordan")).toBe("https://linkedin.com/in/jordan");
    expect(linkHref("https://github.com/jordan")).toBe("https://github.com/jordan");
    expect(linkHref("http://old-site.com")).toBe("http://old-site.com");
  });
});

describe("linkLabel", () => {
  it("names well-known sites", () => {
    expect(linkLabel("linkedin.com/in/jordan")).toBe("LinkedIn");
    expect(linkLabel("https://www.linkedin.com/in/jordan-patel-4a7b2c19/")).toBe("LinkedIn");
    expect(linkLabel("in.linkedin.com/in/ravi")).toBe("LinkedIn");
    expect(linkLabel("github.com/jordan/budget-buddy")).toBe("GitHub");
    expect(linkLabel("https://twitter.com/jordan")).toBe("X");
    expect(linkLabel("kaggle.com/jordan")).toBe("Kaggle");
  });

  it("uses the domain name for anything else", () => {
    expect(linkLabel("jordanpatel.dev")).toBe("jordanpatel.dev");
    expect(linkLabel("https://www.budgetbuddy.app/demo")).toBe("budgetbuddy.app");
  });

  it("doesn't mistake look-alike domains for known sites", () => {
    expect(linkLabel("notgithub.com/x")).toBe("notgithub.com");
  });
});

describe("splitLinks and linkDisplay", () => {
  it("splits several links in one field", () => {
    expect(splitLinks("linkedin.com/in/jordan, github.com/jordan  jordan.dev")).toEqual([
      "linkedin.com/in/jordan",
      "github.com/jordan",
      "jordan.dev",
    ]);
    expect(splitLinks("")).toEqual([]);
  });

  it("shows a full address without https://, www. or a trailing slash", () => {
    expect(linkDisplay("https://www.linkedin.com/in/jordan/")).toBe("linkedin.com/in/jordan");
  });
});

describe("resumeLinks", () => {
  const field = "linkedin.com/in/jordan, https://github.com/jordan";

  it("gives short labels that open the full address", () => {
    expect(resumeLinks(field, "label")).toEqual([
      { text: "LinkedIn", href: "https://linkedin.com/in/jordan" },
      { text: "GitHub", href: "https://github.com/jordan" },
    ]);
  });

  it("can show the full addresses instead", () => {
    expect(resumeLinks(field, "url").map((l) => l.text)).toEqual(["linkedin.com/in/jordan", "github.com/jordan"]);
  });
});
