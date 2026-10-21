import { describe, expect, it } from "vitest";
import {
  type ChatTurn,
  MAX_TURNS,
  OPENING,
  buildDraftCheckMessages,
  buildDraftMessages,
  buildInterviewMessages,
  parseInterviewReply,
  validateChat,
} from "@/lib/interview";

const chat: ChatTurn[] = [
  { role: "assistant", content: OPENING },
  { role: "user", content: "I'm Ravi, I work at TCS as a tester since 2020" },
];

describe("validateChat", () => {
  it("accepts a normal conversation", () => {
    expect(validateChat({ messages: chat })).toEqual(chat);
  });

  it("drops malformed turns and rejects chats with nothing from the person", () => {
    expect(validateChat({ messages: [...chat, { role: "system", content: "x" }, null] })).toEqual(chat);
    expect(validateChat({ messages: [{ role: "assistant", content: OPENING }] })).toBeNull();
    expect(validateChat({ messages: [] })).toBeNull();
    expect(validateChat(null)).toBeNull();
  });

  it("rejects very long chats", () => {
    const long = Array.from({ length: MAX_TURNS + 1 }, (): ChatTurn => ({ role: "user", content: "hi" }));
    expect(validateChat({ messages: long })).toBeNull();
    expect(validateChat({ messages: [{ role: "user", content: "x".repeat(4000) }, ...Array(6).fill({ role: "user", content: "x".repeat(4000) })] })).toBeNull();
  });
});

describe("interview prompts", () => {
  it("passes the whole conversation and asks for the next message", () => {
    const [system, user] = buildInterviewMessages(chat);
    expect(system.content).toContain("Never invent");
    expect(user.content).toContain("Person: I'm Ravi");
  });

  it("drafts only from stated facts and fact-checks the draft", () => {
    expect(buildDraftMessages(chat)[0].content).toContain("Use only facts the person stated");
    const [, user] = buildDraftCheckMessages(chat, '{"basics":{}}');
    expect(user.content).toContain("Person: I'm Ravi");
    expect(user.content).toContain('{"basics":{}}');
  });
});

describe("parseInterviewReply", () => {
  it("reads the reply and ready flag", () => {
    expect(parseInterviewReply('{"reply":"Nice! What do you test?","ready":false}')).toEqual({
      reply: "Nice! What do you test?",
      ready: false,
    });
    expect(parseInterviewReply('{"reply":"Great","ready":true}')?.ready).toBe(true);
  });

  it("rejects empty or broken replies", () => {
    expect(parseInterviewReply('{"reply":""}')).toBeNull();
    expect(parseInterviewReply("nope")).toBeNull();
  });
});
