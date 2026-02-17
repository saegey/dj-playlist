import { describe, it, expect } from "@jest/globals";
import {
  normalizeBpmRange,
  normalizeBpmValue,
  normalizeKey,
  getCamelotCode,
  normalizeDanceability,
  calculateEnergy,
  getDominantMood,
  getVibeDescriptors,
  formatMoodProfile,
  normalizeAcousticElectronic,
  normalizeVocalPresence,
  normalizePercussiveness,
  normalizePartyMood,
} from "../audio-vibe-normalization";

describe("audio-vibe-normalization", () => {
  describe("normalizeBpmRange", () => {
    it("should categorize BPM into ranges", () => {
      expect(normalizeBpmRange(80)).toBe("very slow");
      expect(normalizeBpmRange(100)).toBe("slow");
      expect(normalizeBpmRange(120)).toBe("moderate");
      expect(normalizeBpmRange(130)).toBe("upbeat");
      expect(normalizeBpmRange(145)).toBe("fast");
      expect(normalizeBpmRange(160)).toBe("very fast");
      expect(normalizeBpmRange(180)).toBe("extremely fast");
    });

    it("should handle string input", () => {
      expect(normalizeBpmRange("128")).toBe("upbeat");
    });

    it("should handle null/undefined", () => {
      expect(normalizeBpmRange(null)).toBe("unknown");
      expect(normalizeBpmRange(undefined)).toBe("unknown");
    });
  });

  describe("normalizeBpmValue", () => {
    it("should round BPM to nearest integer", () => {
      expect(normalizeBpmValue(127.8)).toBe("128");
      expect(normalizeBpmValue("127.3")).toBe("127");
    });

    it("should handle null/undefined", () => {
      expect(normalizeBpmValue(null)).toBe("unknown");
      expect(normalizeBpmValue(undefined)).toBe("unknown");
    });
  });

  describe("normalizeKey", () => {
    it("should trim key strings", () => {
      expect(normalizeKey("  C Major  ")).toBe("C Major");
      expect(normalizeKey("A Minor")).toBe("A Minor");
    });

    it("should handle null/undefined", () => {
      expect(normalizeKey(null)).toBe("unknown");
      expect(normalizeKey(undefined)).toBe("unknown");
    });
  });

  describe("getCamelotCode", () => {
    it("should map common keys to Camelot codes", () => {
      expect(getCamelotCode("C Major")).toBe("8B");
      expect(getCamelotCode("A Minor")).toBe("8A");
      expect(getCamelotCode("D Major")).toBe("10B");
      expect(getCamelotCode("B Minor")).toBe("10A");
    });

    it("should return empty string for unknown keys", () => {
      expect(getCamelotCode("Unknown Key")).toBe("");
      expect(getCamelotCode(null)).toBe("");
    });
  });

  describe("normalizeDanceability", () => {
    it("should categorize danceability scores", () => {
      expect(normalizeDanceability(0.1)).toBe("very low");
      expect(normalizeDanceability(0.3)).toBe("low");
      expect(normalizeDanceability(0.5)).toBe("moderate");
      expect(normalizeDanceability(0.7)).toBe("high");
      expect(normalizeDanceability(0.9)).toBe("very high");
    });

    it("should handle string input", () => {
      expect(normalizeDanceability("0.75")).toBe("high");
    });

    it("should handle null/undefined", () => {
      expect(normalizeDanceability(null)).toBe("unknown");
      expect(normalizeDanceability(undefined)).toBe("unknown");
    });
  });

  describe("calculateEnergy", () => {
    it("should calculate energy from danceability and aggressiveness", () => {
      expect(calculateEnergy(0.8, 0.2)).toBe("moderate"); // 0.8*0.6 + 0.2*0.4 = 0.56
      expect(calculateEnergy(0.9, 0.9)).toBe("very high"); // 0.9*0.6 + 0.9*0.4 = 0.9
      expect(calculateEnergy(0.1, 0.1)).toBe("very low"); // 0.1*0.6 + 0.1*0.4 = 0.1
    });

    it("should handle null/undefined inputs", () => {
      expect(calculateEnergy(null, null)).toBe("very low"); // Treats as 0
      expect(calculateEnergy(0.5, null)).toBe("low"); // 0.5*0.6 + 0*0.4 = 0.3
    });
  });

  describe("getDominantMood", () => {
    it("should identify dominant mood", () => {
      expect(getDominantMood({ happy: 0.8, sad: 0.2, relaxed: 0.1, aggressive: 0.1 })).toBe("happy");
      expect(getDominantMood({ happy: 0.1, sad: 0.7, relaxed: 0.2, aggressive: 0.1 })).toBe("sad");
      expect(getDominantMood({ happy: 0.1, sad: 0.1, relaxed: 0.8, aggressive: 0.2 })).toBe("relaxed");
      expect(getDominantMood({ happy: 0.1, sad: 0.1, relaxed: 0.2, aggressive: 0.9 })).toBe("aggressive");
    });

    it("should return neutral for low scores", () => {
      expect(getDominantMood({ happy: 0.2, sad: 0.2, relaxed: 0.2, aggressive: 0.2 })).toBe("neutral");
    });

    it("should handle null/undefined", () => {
      expect(getDominantMood({})).toBe("neutral");
    });
  });

  describe("getVibeDescriptors", () => {
    it("should generate descriptors based on BPM, energy, and mood", () => {
      const descriptors = getVibeDescriptors(95, "high", "happy");
      expect(descriptors).toContain("downtempo");
      expect(descriptors).toContain("energetic");
      expect(descriptors).toContain("uplifting");
    });

    it("should return balanced for neutral conditions", () => {
      const descriptors = getVibeDescriptors(120, "moderate", "neutral");
      expect(descriptors).toEqual(["balanced"]);
    });

    it("should handle high BPM", () => {
      const descriptors = getVibeDescriptors(150, "very high", "aggressive");
      expect(descriptors).toContain("high-energy");
      expect(descriptors).toContain("energetic");
      expect(descriptors).toContain("driving");
    });
  });

  describe("formatMoodProfile", () => {
    it("should format mood scores", () => {
      const profile = formatMoodProfile({
        happy: 0.75,
        sad: 0.25,
        relaxed: 0.50,
        aggressive: 0.10,
      });
      expect(profile).toContain("Happy (0.75)");
      expect(profile).toContain("Sad (0.25)");
      expect(profile).toContain("Relaxed (0.50)");
      expect(profile).toContain("Aggressive (0.10)");
    });

    it("should omit null/undefined moods", () => {
      const profile = formatMoodProfile({ happy: 0.8, sad: null, relaxed: undefined, aggressive: 0 });
      expect(profile).toContain("Happy (0.80)");
      expect(profile).not.toContain("Sad");
      expect(profile).not.toContain("Relaxed");
      expect(profile).not.toContain("Aggressive");
    });

    it("should return 'none' for empty moods", () => {
      expect(formatMoodProfile({})).toBe("none");
    });
  });

  describe("normalizeAcousticElectronic", () => {
    it("should categorize acoustic/electronic balance", () => {
      expect(normalizeAcousticElectronic(0.9, 0.1)).toBe("very acoustic");
      expect(normalizeAcousticElectronic(0.6, 0.3)).toBe("acoustic");
      expect(normalizeAcousticElectronic(0.5, 0.5)).toBe("balanced");
      expect(normalizeAcousticElectronic(0.3, 0.6)).toBe("electronic");
      expect(normalizeAcousticElectronic(0.1, 0.9)).toBe("very electronic");
    });

    it("should handle ambiguous cases", () => {
      expect(normalizeAcousticElectronic(0.2, 0.2)).toBe("ambiguous");
    });

    it("should handle null/undefined", () => {
      expect(normalizeAcousticElectronic(undefined, undefined)).toBe("unknown");
    });
  });

  describe("normalizeVocalPresence", () => {
    it("should categorize vocal presence", () => {
      expect(normalizeVocalPresence(0.9, 0.1)).toBe("instrumental");
      expect(normalizeVocalPresence(0.7, 0.25)).toBe("light vocals");
      expect(normalizeVocalPresence(0.5, 0.5)).toBe("moderate vocals");
      expect(normalizeVocalPresence(0.2, 0.8)).toBe("heavy vocals");
    });

    it("should handle null/undefined", () => {
      expect(normalizeVocalPresence(undefined, undefined)).toBe("unknown");
    });
  });

  describe("normalizePercussiveness", () => {
    it("should categorize onset rate", () => {
      expect(normalizePercussiveness(1.5)).toBe("sparse");
      expect(normalizePercussiveness(3)).toBe("moderate");
      expect(normalizePercussiveness(5)).toBe("rhythmic");
      expect(normalizePercussiveness(8)).toBe("very rhythmic");
    });

    it("should handle undefined", () => {
      expect(normalizePercussiveness(undefined)).toBe("unknown");
    });
  });

  describe("normalizePartyMood", () => {
    it("should categorize party mood", () => {
      expect(normalizePartyMood(0.1)).toBe("low");
      expect(normalizePartyMood(0.3)).toBe("moderate");
      expect(normalizePartyMood(0.5)).toBe("high");
      expect(normalizePartyMood(0.8)).toBe("very high");
    });

    it("should handle undefined", () => {
      expect(normalizePartyMood(undefined)).toBe("unknown");
    });
  });
});
