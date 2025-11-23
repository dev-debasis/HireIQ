import { SKILLS_DICTIONARY } from "../config/skillsDictionary.js";

const normalizeSkill = (skill) => {
  if (!skill) return null;

  const formatted = skill
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+]/g, "");

  return SKILLS_DICTIONARY[formatted] || formatted;
};

export const normalizeSkillsArray = (skillsArray = []) => {
  if (!Array.isArray(skillsArray)) return [];

  return skillsArray
    .filter((item) => typeof item === "string")
    .map((skill) => {
      const skillLower = skill.toLowerCase();
      const skillDict = SKILLS_DICTIONARY[skillLower];

      return skillDict && skillDict.canonical
        ? skillDict.canonical
        : capitalizeWords(skillLower);
    });
};

const capitalizeWords = (str) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
};
