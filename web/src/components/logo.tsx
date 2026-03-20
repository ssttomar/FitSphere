import Link from "next/link";

interface LogoProps {
  size?: number;
  showText?: boolean;
  href?: string;
  className?: string;
  textClassName?: string;
}

export function Logo({
  size = 36,
  showText = true,
  href = "/",
  className = "",
  textClassName = "text-white",
}: LogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 group select-none ${className}`}>
      <span
        className={`font-black text-xl tracking-wide leading-none group-hover:text-orange-400 transition-colors duration-300 ${textClassName}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        Fit<span className="text-orange-500">Sphere</span>
      </span>
    </Link>
  );
}
