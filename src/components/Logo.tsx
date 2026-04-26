import Link from "next/link";

interface LogoProps {
  /** Whether to wrap the logo in a Link to the home page. Defaults to true. */
  asLink?: boolean;
}

/**
 * Nilon Folio primary lockup: bordered italic F seal + Cormorant italic wordmark.
 * Brand bible v2 §II — the F is a stamp of authority, never a logo.
 */
export function Logo({ asLink = true }: LogoProps) {
  const body = (
    <>
      <div
        className="w-[22px] h-[22px] border border-[#C5933A] flex items-center justify-center flex-shrink-0"
        aria-hidden="true"
      >
        <span className="font-display italic text-[#C5933A] text-[14px] font-medium leading-none -mt-px">
          F
        </span>
      </div>
      <span className="font-display italic text-[#F9F7F3] text-[17px] font-normal tracking-[0.02em] whitespace-nowrap">
        Nilon Folio
      </span>
    </>
  );

  if (!asLink) {
    return (
      <div className="flex items-center gap-2.5" aria-label="Nilon Folio home">
        {body}
      </div>
    );
  }

  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Nilon Folio home">
      {body}
    </Link>
  );
}
