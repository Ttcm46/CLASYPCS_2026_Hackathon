"use client";

import { useActionState, useState } from "react";
import { createPlayer } from "@/app/actions/player";
import { DuoButton } from "@/components/duo-button";
import { BAND_ALIASES } from "@/lib/bands";
import type { AgeBand } from "@/lib/scoring/engine";
import { cn } from "@/lib/utils";

const bands = (Object.keys(BAND_ALIASES) as AgeBand[]).map((id) => ({
  id,
  title: BAND_ALIASES[id].alias,
  detail: BAND_ALIASES[id].ages,
}));

export function OnboardingForm() {
  const [ageBand, setAgeBand] = useState<AgeBand>("8-11");
  const [state, action, pending] = useActionState(createPlayer, null);

  return (
    <form className="space-y-6" action={action}>
      <input type="hidden" name="ageBand" value={ageBand} />

      <label className="block">
        <span className="mb-2 block text-xs font-extrabold tracking-wide text-[#5B6B86] uppercase">
          Tu nombre de detective
        </span>
        <input
          id="displayName"
          name="displayName"
          required
          minLength={2}
          maxLength={24}
          placeholder="Ej. Luna Lupa"
          className="h-12 w-full rounded-2xl border-2 border-[#D6DEEE] bg-white px-4 text-base font-bold outline-none focus:border-[#1E4B8E]"
        />
      </label>

      <fieldset>
        <legend className="mb-2 text-xs font-extrabold tracking-wide text-[#5B6B86] uppercase">
          Elige tu categoría
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {bands.map((band) => {
            const selected = ageBand === band.id;
            return (
              <button
                key={band.id}
                type="button"
                onClick={() => setAgeBand(band.id)}
                className={cn(
                  "rounded-2xl border-2 border-b-4 px-4 py-4 text-left",
                  selected
                    ? "border-[#C41E3A] bg-[#FDE8EA]"
                    : "border-[#D6DEEE] bg-white",
                )}
              >
                <p className="text-lg font-extrabold text-[#1E4B8E]">{band.title}</p>
                <p className="mt-1 text-sm font-semibold text-[#5B6B86]">
                  {band.detail}
                </p>
              </button>
            );
          })}
        </div>
      </fieldset>

      {state?.error ? (
        <p className="text-sm font-bold text-[#C41E3A]">{state.error}</p>
      ) : null}

      <DuoButton type="submit" className="w-full" disabled={pending}>
        ¡Empieza ahora!
      </DuoButton>
    </form>
  );
}
