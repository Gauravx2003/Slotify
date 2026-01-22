import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
}

export function Avatar({
  src,
  name = "User",
  size = "md",
  className,
  alt,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const getInitials = (n: string) => {
    return n
      .trim()
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  return (
    <div
      className={twMerge(
        clsx(
          "rounded-full bg-rust-100 border-2 border-rust-200 flex items-center justify-center overflow-hidden shrink-0 relative",
          sizes[size],
          className
        )
      )}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt || name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-black text-rust-700 select-none">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
