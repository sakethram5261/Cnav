interface OdometerNumeralProps {
  value: string; // e.g. "34" or "08"
  className?: string;
}

function DigitColumn({ digit }: { digit: string }) {
  const num = Number.isNaN(Number(digit)) ? 0 : Number(digit);
  return (
    <span className="inline-block h-[1em] overflow-hidden align-top leading-none">
      <span
        className="flex flex-col transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
        style={{ transform: `translateY(-${num * 10}%)` }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span key={d} className="block h-[1em] leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export function OdometerNumeral({ value, className = '' }: OdometerNumeralProps) {
  const padded = value.padStart(2, '0').slice(-2);
  return (
    <span
      className={`font-block-numeral inline-flex select-none leading-none ${className}`}
      aria-label={`Block ${value}`}
    >
      <DigitColumn digit={padded[0]} />
      <DigitColumn digit={padded[1]} />
    </span>
  );
}
