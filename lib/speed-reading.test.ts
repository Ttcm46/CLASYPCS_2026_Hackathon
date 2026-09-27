import { describe, expect, it } from "vitest";
import { bandAlias } from "./bands";
import {
  clampWpm,
  isSingleLetterWord,
  MAX_WPM,
  msPerWord,
  orpParts,
  splitWords,
} from "./speed-reading";

describe("speed reading", () => {
  it("keeps punctuation attached to the word", () => {
    expect(splitWords("  Hola,   mundo  literario. ")).toEqual([
      "Hola,",
      "mundo",
      "literario.",
    ]);
  });

  it("omits hyphens without splitting the word", () => {
    expect(splitWords("pre-guerra bien–estar —dijo")).toEqual([
      "preguerra",
      "bienestar",
      "dijo",
    ]);
    expect(splitWords("¿Qué pasa? ¡Alto!")).toEqual(["¿Qué", "pasa?", "¡Alto!"]);
  });

  it("aligns the pivot on the second letter", () => {
    expect(orpParts("Hola,")).toEqual({
      before: "H",
      pivot: "o",
      after: "la,",
    });
    expect(orpParts("¿Qué")).toEqual({
      before: "¿Q",
      pivot: "u",
      after: "é",
    });
    expect(orpParts("¡Alto!")).toEqual({
      before: "¡A",
      pivot: "l",
      after: "to!",
    });
    expect(orpParts("el")).toEqual({
      before: "e",
      pivot: "l",
      after: "",
    });
    expect(orpParts("a")).toEqual({
      before: "",
      pivot: "a",
      after: "",
    });
    expect(orpParts("y.")).toEqual({
      before: "",
      pivot: "y",
      after: ".",
    });
  });

  it("converts ppm to milliseconds per word", () => {
    expect(msPerWord(120)).toBe(500);
    expect(msPerWord(60)).toBe(750);
    expect(msPerWord(1000)).toBe(60);
  });

  it("clamps ppm", () => {
    expect(MAX_WPM).toBe(1000);
    expect(clampWpm(20)).toBe(80);
    expect(clampWpm(400)).toBe(400);
    expect(clampWpm(1400)).toBe(1000);
  });

  it("treats a lone letter as a single-letter word", () => {
    expect(isSingleLetterWord("a")).toBe(true);
    expect(isSingleLetterWord("y.")).toBe(true);
    expect(isSingleLetterWord("Y")).toBe(true);
    expect(isSingleLetterWord("el")).toBe(false);
    expect(isSingleLetterWord("Hola,")).toBe(false);
  });
});

describe("band aliases", () => {
  it("shows Junior and Cadete in the UI", () => {
    expect(bandAlias("8-11")).toBe("Junior");
    expect(bandAlias("12-15")).toBe("Cadete");
  });
});
