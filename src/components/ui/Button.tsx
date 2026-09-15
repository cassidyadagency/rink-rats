import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary: "bg-sky-500 text-white active:bg-sky-600",
  secondary: "bg-slate-800 text-slate-100 active:bg-slate-700",
  danger: "bg-rose-600 text-white active:bg-rose-700",
  ghost: "bg-transparent text-slate-300 active:bg-slate-800",
};
const sizes: Record<Size, string> = {
  md: "h-12 px-4 text-base",
  lg: "h-14 px-5 text-lg",
  xl: "h-16 w-full px-6 text-xl",
};

export function Button({ variant = "secondary", size = "md", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`rounded-2xl font-semibold disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
