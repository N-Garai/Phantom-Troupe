import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  blurb,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  blurb?: string;
  align?: "center" | "left";
}) {
  return (
    <Reveal className={cn("mb-12", align === "center" ? "text-center" : "text-left")}>
      <p className="mb-3 font-[family-name:var(--font-geist-mono)] text-[11px] uppercase tracking-[0.45em] text-marigold">
        {eyebrow}
      </p>
      <h2 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold text-bone sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {blurb && (
        <p className={cn("mt-4 max-w-2xl text-balance text-ash sm:text-lg", align === "center" && "mx-auto")}>
          {blurb}
        </p>
      )}
    </Reveal>
  );
}
