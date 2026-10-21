import { describe, expect, it } from "vitest";
import { checkDate, checkDateRange, checkEmail, checkLink, checkPhone, parseDate } from "@/lib/validate";

describe("checkEmail", () => {
  it("accepts real addresses and empty fields", () => {
    expect(checkEmail("jordan.patel@email.com")).toBeNull();
    expect(checkEmail("")).toBeNull();
  });

  it("flags things that aren't emails", () => {
    expect(checkEmail("jordan")).not.toBeNull();
    expect(checkEmail("jordan@email")).not.toBeNull();
    expect(checkEmail("a b@c.com")).not.toBeNull();
  });
});

describe("checkPhone", () => {
  it("accepts common formats", () => {
    expect(checkPhone("(555) 123-4567")).toBeNull();
    expect(checkPhone("+91 98765 43210")).toBeNull();
    expect(checkPhone("555.123.4567")).toBeNull();
  });

  it("flags letters and wrong lengths", () => {
    expect(checkPhone("call me")).not.toBeNull();
    expect(checkPhone("12345")).not.toBeNull();
    expect(checkPhone("1234567890123456")).not.toBeNull();
  });
});

describe("checkLink", () => {
  it("accepts web addresses with or without https", () => {
    expect(checkLink("linkedin.com/in/you")).toBeNull();
    expect(checkLink("https://github.com/you")).toBeNull();
  });

  it("flags text that isn't a link", () => {
    expect(checkLink("my linkedin")).not.toBeNull();
    expect(checkLink("hello")).not.toBeNull();
  });
});

describe("parseDate", () => {
  it("reads common resume date formats", () => {
    expect(parseDate("2023")).toBe(2023 * 12);
    expect(parseDate("Jun 2023")).toBe(2023 * 12 + 5);
    expect(parseDate("June 2023")).toBe(2023 * 12 + 5);
    expect(parseDate("Sept. 2023")).toBe(2023 * 12 + 8);
    expect(parseDate("06/2023")).toBe(2023 * 12 + 5);
    expect(parseDate("2023-06")).toBe(2023 * 12 + 5);
  });

  it("rejects text, impossible months and far-off years", () => {
    expect(parseDate("banana")).toBeNull();
    expect(parseDate("13/2023")).toBeNull();
    expect(parseDate("Ju 2023")).toBeNull();
    expect(parseDate("1820")).toBeNull();
  });
});

describe("checkDate", () => {
  it("allows empty and Present", () => {
    expect(checkDate("")).toBeNull();
    expect(checkDate("Present")).toBeNull();
    expect(checkDate("present")).toBeNull();
  });

  it("flags unreadable dates", () => {
    expect(checkDate("last summer")).not.toBeNull();
  });
});

describe("checkDateRange", () => {
  it("flags an end date before the start date", () => {
    expect(checkDateRange("Jun 2023", "Jan 2022")).not.toBeNull();
  });

  it("allows valid, open-ended and unreadable ranges", () => {
    expect(checkDateRange("Jan 2022", "Jun 2023")).toBeNull();
    expect(checkDateRange("Jun 2023", "Present")).toBeNull();
    expect(checkDateRange("whenever", "2020")).toBeNull();
  });
});
