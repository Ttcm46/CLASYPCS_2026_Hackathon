"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookMascot } from "@/components/book-mascot";
import { DuoButton } from "@/components/duo-button";
import {
  isSingleLetterWord,
  msPerWord,
  orpParts,
  splitWords,
} from "@/lib/speed-reading";
import { cn } from "@/lib/utils";

const PPM_MIN = 80;
const PPM_MAX = 1000;
const PPM_STEP = 50;
const PPM_PRESETS = [80, 140, 300, 600, 1000] as const;

export function SpeedReader({
  text,
  defaultWpm,
  ready = true,
  onFinished,
}: {
  text: string;
  defaultWpm: number;
  ready?: boolean;
  onFinished: (result: { wpm: number; wordsPresented: number }) => void;
}) {
  const words = useMemo(() => splitWords(text), [text]);
  const [wpm, setWpm] = useState(() =>
    Math.min(PPM_MAX, Math.max(PPM_MIN, defaultWpm)),
  );
  const [index, setIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const finished = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    if (!running) return;
    if (index >= words.length) {
      if (!finished.current) {
        finished.current = true;
        onFinishedRef.current({ wpm, wordsPresented: words.length });
      }
      return;
    }
    const delay = index < 0 ? 700 : msPerWord(wpm);
    const id = window.setTimeout(() => {
      setIndex((current) => current + 1);
    }, delay);
    return () => window.clearTimeout(id);
  }, [running, index, words.length, wpm]);

  const word = index >= 0 && index < words.length ? words[index] : "";
  const progress =
    words.length === 0
      ? 0
      : Math.min(100, Math.round((Math.max(index, 0) / words.length) * 100));

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold tracking-wide text-[#1E4B8E] uppercase">
          Speed reading
        </p>
        <p className="rounded-full bg-[#C41E3A] px-3 py-1 text-sm font-extrabold text-white tabular-nums">
          {wpm} / {PPM_MAX} ppm
        </p>
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-3xl bg-white px-4 py-10 shadow-[0_3px_0_#D6DEEE]">
        <BookMascot mood={running ? "read" : "happy"} size={72} />
        <div className="mt-6 flex min-h-[4.5rem] w-full items-center justify-center">
          {!running ? (
            <p className="text-center font-serif text-4xl leading-tight font-semibold text-[#1E4B8E]">
              ¿Listo?
            </p>
          ) : index < 0 ? (
            <p className="text-center font-serif text-4xl leading-tight font-semibold text-[#1E4B8E]">
              …
            </p>
          ) : index >= words.length ? (
            <p className="text-center font-serif text-4xl leading-tight font-semibold text-[#1E4B8E]">
              !
            </p>
          ) : (
            <OrpWord word={word} />
          )}
        </div>
        <p className="mt-3 text-sm font-bold text-[#5B6B86]">
          {running
            ? `${Math.max(index, 0)} / ${words.length} palabras`
            : `${words.length} palabras · una por vez`}
        </p>
        <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-[#E8EEF8]">
          <div
            className="h-full rounded-full bg-[#C41E3A] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-extrabold tracking-wide text-[#5B6B86] uppercase">
          <span>{PPM_MIN} ppm</span>
          <span>Máximo {PPM_MAX}</span>
        </div>
        <input
          type="range"
          min={PPM_MIN}
          max={PPM_MAX}
          step={20}
          value={wpm}
          aria-label="Palabras por minuto"
          className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E8EEF8] accent-[#C41E3A]"
          onChange={(event) =>
            setWpm(Math.min(PPM_MAX, Math.max(PPM_MIN, Number(event.target.value))))
          }
        />
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {PPM_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setWpm(preset)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-extrabold tabular-nums",
                wpm === preset
                  ? "bg-[#C41E3A] text-white"
                  : "bg-[#E8EEF8] text-[#1E4B8E]",
              )}
            >
              {preset}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-3">
          <DuoButton
            type="button"
            tone="white"
            disabled={wpm <= PPM_MIN}
            onClick={() =>
              setWpm((value) => Math.min(PPM_MAX, Math.max(PPM_MIN, value - PPM_STEP)))
            }
          >
            −
          </DuoButton>
          <p className="min-w-24 text-center text-sm font-extrabold text-[#1E4B8E]">
            Ritmo
          </p>
          <DuoButton
            type="button"
            tone="white"
            disabled={wpm >= PPM_MAX}
            onClick={() =>
              setWpm((value) => Math.min(PPM_MAX, Math.max(PPM_MIN, value + PPM_STEP)))
            }
          >
            +
          </DuoButton>
        </div>
      </div>

      {!running ? (
        <DuoButton
          className="mt-4 w-full"
          disabled={!ready}
          onClick={() => {
            finished.current = false;
            setIndex(-1);
            setRunning(true);
          }}
        >
          {ready ? "Empezar lectura" : "Preparando…"}
        </DuoButton>
      ) : (
        <p className="mt-4 text-center text-sm font-bold text-[#5B6B86]">
          Al terminar la última palabra, pasas a las pistas.
        </p>
      )}
    </div>
  );
}

function OrpWord({ word }: { word: string }) {
  if (isSingleLetterWord(word)) {
    const { before, pivot, after } = orpParts(word);
    return (
      <p className="flex w-full items-baseline justify-center font-serif text-5xl leading-tight font-semibold">
        <span className="text-[#1E4B8E]">{before}</span>
        <span className="text-[#F07A88]">{pivot}</span>
        <span className="text-[#1E4B8E]">{after}</span>
      </p>
    );
  }

  const { before, pivot, after } = orpParts(word);

  return (
    <div className="relative w-full max-w-md font-serif text-4xl leading-tight font-semibold text-[#1E4B8E]">
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-[#F7B6BE]"
      />
      <p className="grid grid-cols-[1fr_auto_1fr] items-baseline">
        <span className="text-right">{before}</span>
        <span className="min-w-[0.7em] text-center text-[#F07A88]">
          {pivot || "\u00a0"}
        </span>
        <span className="text-left">{after}</span>
      </p>
    </div>
  );
}
