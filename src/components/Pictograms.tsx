import type { SVGProps } from 'react';
import type { PlaceCategory } from '../types/wayfinding';

type IconProps = SVGProps<SVGSVGElement>;

const baseProps: IconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
};

export function StairsIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 19h5v-4h5v-4h5V7h3" />
    </svg>
  );
}

export function LiftIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="4" y="3" width="16" height="18" />
      <path d="M12 3v18M8 9l2-2 2 2M14 15l2 2 2-2" />
    </svg>
  );
}

export function GateIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 20V6h18v14M8 20v-8h8v8M3 10h18" />
    </svg>
  );
}

export function LabIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="4" width="18" height="12" />
      <path d="M2 20h20M9 16v4M15 16v4" />
    </svg>
  );
}

export function LibraryIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 5h6v14H4zM10 5h6v14h-6zM16 7l4-1v13l-4 1" />
    </svg>
  );
}

export function CanteenIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 3v8M9 3v8M6 7h3M7.5 11v10M16 3v18M16 3c3 0 4 3 4 6h-4" />
    </svg>
  );
}

export function RestroomIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="8" cy="5" r="2" />
      <path d="M6 9h4v6H8v6M16 5a2 2 0 1 0 0 .01M14 9h4l1 6h-2v6h-2v-6h-2z" />
    </svg>
  );
}

export function AuditoriumIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 19h18M5 19v-5a7 7 0 0 1 14 0v5M8 19v-3h8v3" />
    </svg>
  );
}

export function GroundFloorIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M3 19h18M7 19V7h10v12M10 12h4" />
    </svg>
  );
}

export function YouAreHereIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  );
}

export function AccessibleIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="10" cy="5" r="2" />
      <path d="M10 9v5h6l2 5M7 13a4.5 4.5 0 1 0 5.5 5.5" />
    </svg>
  );
}

export function VoiceIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 9v6h4l5 4V5L8 9H4zM17 8a5 5 0 0 1 0 8M19.5 5.5a8.5 8.5 0 0 1 0 13" />
    </svg>
  );
}

export function BlockIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2z" />
    </svg>
  );
}

export function CategoryPictogram({
  category,
  className = 'w-5 h-5',
}: {
  category: PlaceCategory;
  className?: string;
}) {
  switch (category) {
    case 'lab':
      return <LabIcon className={className} />;
    case 'food':
      return <CanteenIcon className={className} />;
    case 'gate':
      return <GateIcon className={className} />;
    case 'library':
      return <LibraryIcon className={className} />;
    case 'auditorium':
      return <AuditoriumIcon className={className} />;
    case 'restroom':
      return <RestroomIcon className={className} />;
    case 'sports':
      return <GroundFloorIcon className={className} />;
    case 'admin':
    case 'block':
    default:
      return <BlockIcon className={className} />;
  }
}
