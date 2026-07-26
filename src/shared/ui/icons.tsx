import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const base = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const Network = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="m10.8 7.2-4.6 8.6M13.2 7.2l4.6 8.6M7.5 18h9"/></svg>
);
export const Search = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
);
export const Plus = (p: IconProps) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>
);
export const Book = (p: IconProps) => (
  <svg {...base} {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></svg>
);
export const Sliders = (p: IconProps) => (
  <svg {...base} {...p}><path d="M4 6h5M15 6h5M12 3v6M4 18h5M15 18h5M12 15v6M4 12h11M19 12h1M17 9v6"/></svg>
);
export const External = (p: IconProps) => (
  <svg {...base} {...p}><path d="M15 4h5v5M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>
);
export const Spark = (p: IconProps) => (
  <svg {...base} {...p}><path d="m12 3 .8 3.2A6.5 6.5 0 0 0 17.6 11l3.4 1-3.4 1a6.5 6.5 0 0 0-4.8 4.8L12 21l-.8-3.2A6.5 6.5 0 0 0 6.4 13L3 12l3.4-1a6.5 6.5 0 0 0 4.8-4.8z"/></svg>
);
export const More = (p: IconProps) => (
  <svg {...base} {...p}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>
);
export const Arrow = (p: IconProps) => (
  <svg {...base} {...p}><path d="m9 18 6-6-6-6"/></svg>
);
export const X = (p: IconProps) => (
  <svg {...base} {...p}><path d="m6 6 12 12M18 6 6 18"/></svg>
);
export const Star = (p: IconProps) => (
  <svg {...base} {...p}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z"/></svg>
);
