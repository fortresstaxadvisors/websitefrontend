import { Reveal } from "@/components/reveal";

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  as?: "h1" | "h2";
  align?: "left" | "center";
};

export function SectionIntro({
  eyebrow,
  title,
  description,
  as = "h2",
  align = "left",
}: SectionIntroProps) {
  const Heading = as;
  const centered = align === "center";

  return (
    <Reveal
      className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}
    >
      <p className={`eyebrow ${centered ? "justify-center" : ""}`}>{eyebrow}</p>
      <Heading className="display mt-5 text-4xl text-[var(--ink)] md:text-[3.25rem]">
        {title}
      </Heading>
      {description ? (
        <p
          className={`lede mt-5 text-lg leading-8 text-[var(--muted)] ${
            centered ? "mx-auto" : ""
          } max-w-2xl`}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
