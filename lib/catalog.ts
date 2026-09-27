import seedData from "@/data/seed-cases.json";
import { countWords, minReadingSeconds, type AgeBand } from "@/lib/scoring/engine";

export type CatalogAuthor = (typeof seedData.authors)[number];
export type CatalogCase = (typeof seedData.cases)[number];
export type CatalogQuestion = CatalogCase["questions"][number];
export type CatalogOption = CatalogQuestion["options"][number];

export type CaseWithAuthor = {
  id: string;
  authorId: string;
  ageBand: string;
  title: string;
  fragmentText: string;
  wordCount: number;
  minReadingSeconds: number;
  authorName: string;
  authorCategory: string;
  authorCountry: string | null;
};

export type QuestionWithOptions = {
  id: string;
  caseId: string;
  order: number;
  promptText: string;
  explanation: string | null;
  options: { id: string; questionId: string; label: string; isCorrect: boolean }[];
};

const authorsById = new Map(seedData.authors.map((author) => [author.id, author]));

export function listCasesForBand(ageBand: AgeBand): CaseWithAuthor[] {
  return seedData.cases
    .filter((item) => item.ageBand === ageBand)
    .map(toCaseWithAuthor);
}

export function getCaseWithAuthor(caseId: string): CaseWithAuthor | null {
  const item = seedData.cases.find((entry) => entry.id === caseId);
  return item ? toCaseWithAuthor(item) : null;
}

export function getQuestionsForCase(caseId: string): QuestionWithOptions[] {
  const item = seedData.cases.find((entry) => entry.id === caseId);
  if (!item) return [];
  return [...item.questions]
    .sort((a, b) => a.order - b.order)
    .map((question) => ({
      id: question.id,
      caseId: item.id,
      order: question.order,
      promptText: question.promptText,
      explanation: question.explanation ?? null,
      options: question.options.map((option) => ({
        id: option.id,
        questionId: question.id,
        label: option.label,
        isCorrect: option.isCorrect,
      })),
    }));
}

export function getQuestionById(questionId: string) {
  for (const item of seedData.cases) {
    const question = item.questions.find((entry) => entry.id === questionId);
    if (!question) continue;
    return {
      id: question.id,
      caseId: item.id,
      order: question.order,
      promptText: question.promptText,
      explanation: question.explanation ?? null,
    };
  }
  return null;
}

export function getOptionById(optionId: string) {
  for (const item of seedData.cases) {
    for (const question of item.questions) {
      const option = question.options.find((entry) => entry.id === optionId);
      if (!option) continue;
      return {
        id: option.id,
        questionId: question.id,
        label: option.label,
        isCorrect: option.isCorrect,
      };
    }
  }
  return null;
}

export function getAuthor(authorId: string): CatalogAuthor | undefined {
  return authorsById.get(authorId);
}

export function seedBots() {
  return seedData.bots;
}

function toCaseWithAuthor(item: CatalogCase): CaseWithAuthor {
  const author = authorsById.get(item.authorId);
  const wordCount = countWords(item.fragmentText);
  return {
    id: item.id,
    authorId: item.authorId,
    ageBand: item.ageBand,
    title: item.title,
    fragmentText: item.fragmentText,
    wordCount,
    minReadingSeconds: minReadingSeconds(wordCount),
    authorName: author?.name ?? "Autor",
    authorCategory: author?.category ?? "classic",
    authorCountry: author?.country ?? null,
  };
}
