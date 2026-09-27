import { redirect } from "next/navigation";
import { BookMascot } from "@/components/book-mascot";
import { OnboardingForm } from "@/components/onboarding-form";
import { getCurrentPlayer } from "@/lib/player";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const player = await getCurrentPlayer();
  if (player) redirect("/inicio");

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto w-fit">
          <BookMascot size={112} mood="happy" />
        </div>
        <p className="mt-3 text-xs font-extrabold tracking-[0.2em] text-[#C41E3A] uppercase">
          Club de detective literario
        </p>
        <h1 className="mt-2 text-4xl leading-tight font-extrabold text-[#1E4B8E]">
          Lee a toda velocidad. Resuelve el caso.
        </h1>
        <p className="mt-3 font-semibold text-[#5B6B86]">
          Folio te muestra una palabra a la vez. Mide tu ritmo en ppm y cierra
          el caso con tres pistas.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
