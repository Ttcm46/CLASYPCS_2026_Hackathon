import { cn } from "@/lib/utils";

type DuoTone = "red" | "blue" | "white" | "green";

type DuoButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: DuoTone;
};

const tones = {
  red: "bg-[#C41E3A] text-white shadow-[0_4px_0_#8E1528] hover:bg-[#d32542] disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF] disabled:shadow-[0_4px_0_#C4C4C4]",
  blue: "bg-[#1E4B8E] text-white shadow-[0_4px_0_#143262] hover:bg-[#2658a3] disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF] disabled:shadow-[0_4px_0_#C4C4C4]",
  white:
    "bg-white text-[#1E4B8E] shadow-[0_4px_0_#D6DEEE] hover:bg-[#F7F9FC] disabled:text-[#AFAFAF]",
  green:
    "bg-[#C41E3A] text-white shadow-[0_4px_0_#8E1528] hover:bg-[#d32542] disabled:bg-[#E5E5E5] disabled:text-[#AFAFAF] disabled:shadow-[0_4px_0_#C4C4C4]",
};

export function duoButtonClass(tone: DuoTone = "blue", className?: string) {
  return cn(
    "inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-extrabold tracking-wide uppercase transition-all active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:active:translate-y-0",
    tones[tone],
    className,
  );
}

export function DuoButton({
  className,
  tone = "blue",
  children,
  ...props
}: DuoButtonProps) {
  return (
    <button className={duoButtonClass(tone, className)} {...props}>
      {children}
    </button>
  );
}
