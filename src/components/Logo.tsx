import Link from "next/link";

interface LogoProps {
  /** Whether to wrap the logo in a Link to the home page. Defaults to true. */
  asLink?: boolean;
}

export function Logo({ asLink = true }: LogoProps) {
  const body = (
    <>
      <div
        className="w-7 h-7 border border-[#C5933A] flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="text-[#C5933A] text-xs font-semibold">E</span>
      </div>
      <span className="text-[#F9F7F3] text-sm font-medium tracking-wider">EBRB</span>
    </>
  );

  if (!asLink) {
    return (
      <div className="flex items-center gap-2" aria-label="EBRB home">
        {body}
      </div>
    );
  }

  return (
    <Link href="/" className="flex items-center gap-2" aria-label="EBRB home">
      {body}
    </Link>
  );
}
