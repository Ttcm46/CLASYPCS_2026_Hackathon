import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { BookMascot } from "@/components/book-mascot";
import { cn } from "@/lib/utils";
import {
  READING_PATH,
  nodeStatus,
  type PathNodeStatus,
} from "@/lib/reading-path";
import type { AgeBand } from "@/lib/scoring/engine";

type PathCase = {
  id: string;
  title: string;
  authorName: string;
};

export function ReadingPath({
  ageBand,
  cases,
  completedIds,
}: {
  ageBand: AgeBand;
  cases: PathCase[];
  completedIds: Set<string>;
}) {
  const byId = new Map(cases.map((item) => [item.id, item]));
  const units = READING_PATH[ageBand];

  return (
    <div className="space-y-8">
      {units.map((unit) => {
        const done = unit.caseIds.filter((id) => completedIds.has(id)).length;
        return (
          <section key={unit.id}>
            <header className="mb-6 text-center">
              <p className="text-xs font-extrabold tracking-[0.16em] text-[#C41E3A] uppercase">
                Express literario
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[#1E4B8E]">
                {unit.description}
              </h2>
              <p className="mt-1 text-sm font-bold text-[#C41E3A] tabular-nums">
                {done}/{unit.caseIds.length} vagones
              </p>
            </header>

            <div className="relative mx-auto w-[220px]">
              <Track />
              <div className="relative z-10 flex flex-col items-center py-1">
                <Locomotive />
                {unit.caseIds.map((caseId, index) => {
                  const item = byId.get(caseId);
                  if (!item) return null;
                  const status = nodeStatus(caseId, ageBand, completedIds);
                  return (
                    <div key={caseId} className="flex flex-col items-center">
                      <Coupler />
                      <Wagon
                        item={item}
                        status={status}
                        number={index + 1}
                      />
                    </div>
                  );
                })}
                <Coupler />
                <Caboose unlocked={done === unit.caseIds.length} />
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Track() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-2 inset-x-0">
      <div className="absolute top-0 bottom-0 left-[22px] w-[3px] rounded-full bg-[#1E4B8E]/20" />
      <div className="absolute top-0 bottom-0 right-[22px] w-[3px] rounded-full bg-[#1E4B8E]/20" />
      <div className="flex h-full flex-col justify-between py-6">
        {Array.from({ length: 14 }).map((_, index) => (
          <span
            key={index}
            className="mx-[14px] h-1 rounded-full bg-[#C41E3A]/25"
          />
        ))}
      </div>
    </div>
  );
}

function Locomotive() {
  return (
    <div className="flex w-[168px] flex-col items-center">
      <div className="relative flex flex-col items-center">
        <span className="train-puff absolute -top-4 left-[42%] size-2 rounded-full bg-[#D6DEEE]" />
        <span className="train-puff absolute -top-7 left-[52%] size-1.5 rounded-full bg-[#E8EEF8] [animation-delay:0.45s]" />
        <span className="h-5 w-4 rounded-t-md bg-[#1E4B8E]" />
        <span className="h-[3px] w-7 rounded-full bg-[#C41E3A]" />
      </div>
      <div className="flex w-[78%] items-center justify-center rounded-t-2xl bg-[#C41E3A] px-2 py-1">
        <span className="size-2.5 rounded-full bg-[#F2C14E] ring-2 ring-white/70" />
      </div>
      <div className="w-full rounded-md bg-[#1E4B8E] px-2.5 pt-2 pb-2 shadow-[0_3px_0_#143262]">
        <div className="flex items-center justify-center rounded-sm bg-white/15 py-1.5">
          <BookMascot size={34} mood="wow" />
        </div>
        <div className="mt-1.5 flex items-center justify-between px-1">
          <span className="h-1 w-6 rounded-full bg-white/25" />
          <p className="text-[9px] font-extrabold tracking-[0.16em] text-white uppercase">
            Folio
          </p>
          <span className="h-1 w-6 rounded-full bg-white/25" />
        </div>
      </div>
      <WheelTruck />
    </div>
  );
}

function Wagon({
  item,
  status,
  number,
}: {
  item: PathCase;
  status: PathNodeStatus;
  number: number;
}) {
  const clickable = status !== "locked";
  const palette = {
    completed: "bg-[#1E4B8E] text-white",
    current: "bg-white text-[#1E4B8E] ring-2 ring-[#C41E3A]",
    locked: "bg-[#EEF2F8] text-[#5B6B86]",
  }[status];

  const body = (
    <div className="flex w-[200px] flex-col items-center">
      {status === "current" ? (
        <p className="-mb-1 rounded-full bg-[#C41E3A] px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide text-white uppercase">
          Sube aquí
        </p>
      ) : null}
      <div
        className={cn(
          "w-[86%] rounded-t-sm",
          status === "completed"
            ? "h-1.5 bg-[#143262]"
            : status === "current"
              ? "h-1.5 bg-[#C41E3A]"
              : "h-1.5 bg-[#D6DEEE]",
        )}
      />
      <div className={cn("w-full rounded-b-md px-3 pt-2.5 pb-2.5 shadow-[0_3px_0_#D6DEEE]", palette, status === "completed" && "shadow-[0_3px_0_#143262]", status === "current" && "shadow-[0_3px_0_#C41E3A]")}>
        <div className="mb-2 flex justify-center gap-1.5">
          <Window lit={status !== "locked"} />
          <Window lit={status === "completed" || status === "current"} />
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-extrabold tracking-wide uppercase opacity-70">
              Vagón {number}
            </p>
            <p className="text-sm leading-snug font-extrabold">{item.title}</p>
            <p className="text-[11px] font-semibold opacity-75">{item.authorName}</p>
          </div>
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-black/10">
            {status === "locked" ? (
              <Lock className="size-3.5" />
            ) : status === "completed" ? (
              <Check className="size-3.5 stroke-[3]" />
            ) : (
              <span className="text-[10px] font-extrabold">▼</span>
            )}
          </span>
        </div>
      </div>
      <WheelTruck spinning={status === "current"} />
    </div>
  );

  if (!clickable) return body;
  return <Link href={`/caso/${item.id}`}>{body}</Link>;
}

function Caboose({ unlocked }: { unlocked: boolean }) {
  return (
    <div className="flex w-[168px] flex-col items-center">
      <div
        className={cn(
          "h-1.5 w-[86%] rounded-t-sm",
          unlocked ? "bg-[#8E1528]" : "bg-[#D6DEEE]",
        )}
      />
      <div
        className={cn(
          "w-full rounded-b-md px-3 py-3",
          unlocked
            ? "bg-[#C41E3A] text-white shadow-[0_3px_0_#8E1528]"
            : "bg-[#EEF2F8] text-[#5B6B86] shadow-[0_3px_0_#D6DEEE]",
        )}
      >
        <div className="mb-2 flex justify-center">
          <Window lit={unlocked} />
        </div>
        <p className="text-[10px] font-extrabold tracking-wide uppercase opacity-80">
          Furgón
        </p>
        <p className="text-sm leading-snug font-extrabold">
          {unlocked ? "¡Llegaste!" : "Estación"}
        </p>
      </div>
      <WheelTruck />
    </div>
  );
}

function Coupler() {
  return (
    <div className="flex h-5 flex-col items-center justify-center">
      <span className="h-full w-1 rounded-full bg-[#1E4B8E]" />
    </div>
  );
}

function Window({ lit }: { lit: boolean }) {
  return (
    <span
      className={cn(
        "h-3.5 w-7 rounded-[3px] ring-1 ring-black/10",
        lit ? "bg-[#FFF3B0]" : "bg-[#B8BDC8]",
      )}
    />
  );
}

function WheelTruck({ spinning = false }: { spinning?: boolean }) {
  return (
    <div className="mt-1 flex w-[72%] items-center justify-between">
      <Wheel spinning={spinning} />
      <span className="h-0.5 flex-1 bg-[#1A1A1A]/40" />
      <Wheel spinning={spinning} />
    </div>
  );
}

function Wheel({ spinning = false }: { spinning?: boolean }) {
  return (
    <span
      className={cn(
        "relative size-3.5 rounded-full border-[3px] border-[#1A1A1A] bg-[#C41E3A]",
        spinning && "train-wheel",
      )}
    >
      <span className="absolute inset-[3px] rounded-full bg-[#1A1A1A]" />
    </span>
  );
}
