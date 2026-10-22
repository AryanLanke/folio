import { describe, expect, it } from "vitest";
import { linkDisplay, linkHref, linkKey, linkLabel, repoName, resumeLinks, splitLinks, withoutTracking } from "@/lib/links";

describe("repoName", () => {
  it("finds links to one repository", () => {
    expect(repoName("https://github.com/Priyamanjare54/budget-buddy")).toBe("budget-buddy");
    expect(repoName("github.com/priya/chat-app.git")).toBe("chat-app");
    expect(repoName("gitlab.com/priya/tool/-/tree/main")).toBe("tool");
    expect(repoName("priya.github.io/portfolio-site")).toBe("portfolio-site");
  });

  it("treats profiles and other sites as not a repository", () => {
    expect(repoName("https://github.com/Priyamanjare54")).toBeNull();
    expect(repoName("github.com/priya?tab=repositories")).toBeNull();
    expect(repoName("priya.github.io")).toBeNull();
    expect(repoName("linkedin.com/in/priya")).toBeNull();
    expect(repoName("leetcode.com/u/priya")).toBeNull();
  });
});

describe("linkKey", () => {
  it("is the same however the link is written", () => {
    expect(linkKey("https://www.GitHub.com/priya/")).toBe(linkKey("github.com/priya"));
    expect(linkKey("github.com/priya")).not.toBe(linkKey("github.com/priya/app"));
  });
});

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

describe("withoutTracking", () => {
  it("removes share tracking and keeps real parameters", () => {
    expect(withoutTracking("https://www.linkedin.com/in/priya?utm_source=share_via&utm_medium=member_android")).toBe(
      "https://www.linkedin.com/in/priya",
    );
    expect(withoutTracking("linkedin.com/in/priya?trk=public_profile")).toBe("linkedin.com/in/priya");
    expect(withoutTracking("https://site.dev/work?id=3&utm_campaign=x")).toBe("https://site.dev/work?id=3");
    expect(withoutTracking("github.com/priya")).toBe("github.com/priya");
  });
});
