import Link from "next/link";
import { BookMascot } from "@/components/book-mascot";
import { duoButtonClass } from "@/components/duo-button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <BookMascot mood="wow" size={88} />
      <h1 className="mt-5 text-3xl font-extrabold text-[#1E4B8E]">Pista perdida</h1>
      <p className="mt-2 font-semibold text-[#5B6B86]">
        Folio no encuentra esa lección en el tren.
      </p>
      <Link href="/inicio" className={duoButtonClass("blue", "mt-6")}>
        Volver al tren
      </Link>
    </div>
  );
}
