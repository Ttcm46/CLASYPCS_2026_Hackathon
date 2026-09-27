"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { CheckCircle2, CircleHelp, X, XCircle } from "lucide-react";
import {
  completeReading,
  finishSession,
  startSession,
  submitAnswer,
} from "@/app/actions/game";
import { DuoButton } from "@/components/duo-button";
import { ScoreSummary, type ScoreBreakdown } from "@/components/score-summary";
import { SpeedReader } from "@/components/speed-reader";
import { DEFAULT_WPM } from "@/lib/speed-reading";
import { formatMultiplier, type AgeBand } from "@/lib/scoring/engine";
import { cn } from "@/lib/utils";

type PublicQuestion = {
  id: string;
  order: number;
  promptText: string;
  options: { id: string; label: string }[];
};

type Feedback = {
  isCorrect: boolean;
  explanation: string | null;
  canRetry: boolean;
  finished: boolean;
  basePoints: number;
  points: number;
  speedMultiplier: number;
  speedBonus: number;
};

function correctFeedback(feedback: Feedback) {
  if (!feedback.isCorrect) {
    return feedback.canRetry
      ? "Casi. Te queda un intento."
      : "Sin puntos en esta pista.";
  }

  if (feedback.speedMultiplier === 1) {
    return `¡Bien! +${feedback.points}`;
  }

  return `¡Bien! +${feedback.points} · ${formatMultiplier(feedback.speedMultiplier)}`;
}

type CasePlayProps = {
  caseId: string;
  title: string;
  fragmentText: string;
  authorName: string;
  authorCategory: string;
  ageBand: AgeBand;
};

export function CasePlay({
  caseId,
  title,
  fragmentText,
  authorName,
  authorCategory,
  ageBand,
}: CasePlayProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<"reading" | "question" | "summary">(
    "reading",
  );
  const [question, setQuestion] = useState<PublicQuestion | null>(null);
  const [queuedQuestion, setQueuedQuestion] = useState<PublicQuestion | null>(
    null,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [summary, setSummary] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startSession(caseId).then((result) => {
      if (cancelled) return;
      if (typeof result.error === "string") {
        setError(result.error);
        return;
      }
      if (typeof result.sessionId !== "string") return;
      setSessionId(result.sessionId);
    });
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const goToQuestion = useCallback((next: PublicQuestion) => {
    setQuestion(next);
    setQueuedQuestion(null);
    setSelected(null);
    setFeedback(null);
    setPhase("question");
  }, []);

  const handleFinishReading = useCallback(
    (result: { wpm: number; wordsPresented: number }) => {
      if (!sessionId) return;
      startTransition(async () => {
        const response = await completeReading(sessionId, result);
        if (typeof response.error === "string") {
          setError(response.error);
          return;
        }
        if (!response.question) return;
        goToQuestion(response.question);
      });
    },
    [sessionId, goToQuestion],
  );

  function handleSubmit() {
    if (!sessionId || !question || !selected) return;
    startTransition(async () => {
      const result = await submitAnswer(sessionId, question.id, selected);
      if (typeof result.error === "string") {
        setError(result.error);
        return;
      }
      if (typeof result.isCorrect !== "boolean") return;
      setFeedback({
        isCorrect: result.isCorrect,
        explanation: result.explanation ?? null,
        canRetry: Boolean(result.canRetry),
        finished: Boolean(result.finished),
        basePoints: result.basePoints ?? 0,
        points: result.points ?? result.basePoints ?? 0,
        speedMultiplier: result.speedMultiplier ?? 1,
        speedBonus: result.speedBonus ?? 0,
      });
      if (result.nextQuestion) {
        setQueuedQuestion(result.nextQuestion);
      }
    });
  }

  function handleContinue() {
    if (!sessionId || !feedback) return;
    if (feedback.canRetry) {
      setFeedback(null);
      setSelected(null);
      return;
    }
    if (feedback.finished) {
      startTransition(async () => {
        const result = await finishSession(sessionId);
        if (typeof result.error === "string") {
          setError(result.error);
          return;
        }
        if (typeof result.totalPoints !== "number") return;
        setSummary({
          questionPoints: result.questionPoints ?? 0,
          speedBonusPoints: result.speedBonusPoints ?? 0,
          caseBonusPoints: result.caseBonusPoints ?? 0,
          streakBonusPoints: result.streakBonusPoints ?? 0,
          totalPoints: result.totalPoints,
          firstAttemptCorrectCount: result.firstAttemptCorrectCount ?? 0,
          countsForWeeklyRanking: Boolean(result.countsForWeeklyRanking),
          minReadingMet: Boolean(result.minReadingMet),
          readingWpm: result.readingWpm ?? null,
          rank: result.rank ?? null,
          pointsToTop10: result.pointsToTop10 ?? 0,
        });
        setPhase("summary");
      });
      return;
    }
    if (queuedQuestion) {
      goToQuestion(queuedQuestion);
    }
  }

  const lessonProgress =
    phase === "reading"
      ? 15
      : phase === "summary"
        ? 100
        : 25 + ((question?.order ?? 1) / 3) * 75;

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center font-bold text-[#C41E3A]">
        {error}
      </div>
    );
  }

  if (phase === "summary" && summary) {
    return <ScoreSummary summary={summary} />;
  }

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/inicio"
          className="flex size-10 items-center justify-center text-[#5B6B86]"
          aria-label="Salir"
        >
          <X className="size-7" />
        </Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-[#E8EEF8]">
          <div
            className="h-full rounded-full bg-[#C41E3A] transition-all"
            style={{ width: `${lessonProgress}%` }}
          />
        </div>
      </div>

      {phase === "reading" ? (
        <div className="flex flex-1 flex-col">
          <p className="text-xs font-extrabold tracking-wide text-[#1E4B8E] uppercase">
            {authorCategory === "local" ? "Autor local" : "Clásico"} · {authorName}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold">{title}</h1>
          <SpeedReader
            text={fragmentText}
            defaultWpm={DEFAULT_WPM[ageBand]}
            ready={Boolean(sessionId)}
            onFinished={handleFinishReading}
          />
        </div>
      ) : question ? (
        <div className="flex flex-1 flex-col">
          <p className="text-xs font-extrabold tracking-wide text-[#5B6B86] uppercase">
            Pista {question.order} de 3
          </p>
          <h1 className="mt-2 text-2xl font-extrabold leading-snug">
            {question.promptText}
          </h1>
          <div className="mt-5 grid flex-1 content-start gap-3">
            {question.options.map((option, index) => {
              const active = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={Boolean(feedback) || pending}
                  onClick={() => setSelected(option.id)}
                  className={cn(
                    "rounded-2xl border-2 border-b-4 bg-white px-4 py-4 text-left text-sm font-bold leading-6",
                    active
                      ? "border-[#1E4B8E] bg-[#E8EEF8] text-[#1E4B8E]"
                      : "border-[#D6DEEE] text-[#1A1A1A]",
                  )}
                >
                  <span className="mr-2 text-[#5B6B86]">{index + 1}.</span>
                  {option.label}
                </button>
              );
            })}
          </div>

          {feedback ? (
            <div
              className={cn(
                "sticky bottom-4 mt-4 rounded-2xl p-4",
                feedback.isCorrect ? "bg-[#E8EEF8]" : "bg-[#FDE8EA]",
              )}
            >
              <p className="flex items-center gap-2 text-lg font-extrabold">
                {feedback.isCorrect ? (
                  <CheckCircle2 className="size-6 text-[#1E4B8E]" />
                ) : feedback.canRetry ? (
                  <CircleHelp className="size-6 text-[#C41E3A]" />
                ) : (
                  <XCircle className="size-6 text-[#C41E3A]" />
                )}
                {correctFeedback(feedback)}
              </p>
              {feedback.explanation ? (
                <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
                  {feedback.explanation}
                </p>
              ) : null}
              <DuoButton
                className="mt-3 w-full"
                tone={feedback.isCorrect ? "blue" : "red"}
                disabled={pending}
                onClick={handleContinue}
              >
                {feedback.canRetry
                  ? "Intentar otra vez"
                  : feedback.finished
                    ? "Ver resultado"
                    : "Continuar"}
              </DuoButton>
            </div>
          ) : (
            <div className="sticky bottom-4 mt-4 bg-white pt-2">
              <DuoButton
                className="w-full"
                disabled={!selected || pending}
                onClick={handleSubmit}
              >
                Comprobar
              </DuoButton>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
