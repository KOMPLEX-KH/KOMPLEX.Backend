import { describe, it, expect } from "vitest";
import { cleanKomplexResponse } from "../../src/utils/cleanKomplexResponse.js";

describe("cleanKomplexResponse", () => {
  it("returns input unchanged when responseType is not 'komplex'", () => {
    expect(cleanKomplexResponse("```json\n{\"a\":1}\n```", "other")).toBe("```json\n{\"a\":1}\n```");
  });

  it("returns input unchanged when not starting with ```json", () => {
    expect(cleanKomplexResponse("plain text", "komplex")).toBe("plain text");
  });

  it("strips ```json fence and returns inner JSON when responseType is 'komplex'", () => {
    const wrapped = "```json\n{\"key\": \"value\"}\n```";
    expect(cleanKomplexResponse(wrapped, "komplex")).toBe("{\"key\": \"value\"}");
  });

  it("handles single-line json fence", () => {
    expect(cleanKomplexResponse("```json {\"x\":1} ```", "komplex")).toBe("{\"x\":1}");
  });
});
