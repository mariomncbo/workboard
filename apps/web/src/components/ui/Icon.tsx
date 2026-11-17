import type { SVGProps } from "react";

/**
 * Line icons drawn on a 16 × 16 grid, matching the icons of the design screens (the web
 * counterpart of the SF Symbols used on macOS). Decorative by default: the control that
 * holds the icon provides the accessible name.
 */
const PATHS = {
  plus: <path d="M8 3v10M3 8h10" />,
  xmark: <path d="M4 4l8 8M12 4l-8 8" />,
  checkmark: <path d="M3 8.5l3.2 3L13 4.5" />,
  chevronRight: <path d="M6 3.5L10.5 8 6 12.5" />,
  chevronLeft: <path d="M10 3.5L5.5 8 10 12.5" />,
  star: <path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 6.5l4-.6z" strokeLinejoin="round" />,
  starFill: <path d="M8 2.2l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4L2.2 6.5l4-.6z" fill="currentColor" stroke="none" />,
  ellipsis: (
    <g fill="currentColor" stroke="none">
      <circle cx="3.5" cy="8" r="1.3" />
      <circle cx="8" cy="8" r="1.3" />
      <circle cx="12.5" cy="8" r="1.3" />
    </g>
  ),
  trash: <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" strokeLinejoin="round" />,
  search: (
    <>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </>
  ),
  notes: <path d="M3 4h10M3 8h10M3 12h6" />,
  calendar: (
    <>
      <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
      <path d="M2.5 7h11M5.5 2v3M10.5 2v3" />
    </>
  ),
  globe: (
    <>
      <circle cx="8" cy="8" r="6.3" />
      <path d="M1.7 8h12.6M8 1.7c1.8 1.8 2.6 4 2.6 6.3S9.8 12.5 8 14.3M8 1.7C6.2 3.5 5.4 5.7 5.4 8s.8 4.5 2.6 6.3" />
    </>
  ),
  code: <path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5" />,
  alert: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3.5M8 11h.01" />
    </>
  ),
  pencil: <path d="M10.5 2.5l3 3L6 13H3v-3z" strokeLinejoin="round" />,
  textLines: <path d="M3 4h10M3 7h10M3 10h7" />,
  person: (
    <>
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M3 13.5c.8-2.6 2.8-4 5-4s4.2 1.4 5 4" />
    </>
  ),
  gear: (
    <>
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.8v2M8 12.2v2M1.8 8h2M12.2 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M3.6 12.4 5 11M11 5l1.4-1.4" />
    </>
  ),
  signOut: <path d="M6.5 3H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2.5M10 5.5 12.5 8 10 10.5M12.5 8H6.5" strokeLinejoin="round" />,
  arrowUpRight: <path d="M6 3h7v7M13 3 4 12" strokeLinejoin="round" />,
  sliders: <path d="M3 5h6M12 5h1M3 11h1M7 11h6M9 3.5v3M4 9.5v3" />,
  boards: (
    <>
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
      <path d="M6.2 3v10M9.8 3v10" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: IconName;
  /** Size in pixels. */
  size?: number;
};

export function Icon({ name, size = 14, strokeWidth = 1.6, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
