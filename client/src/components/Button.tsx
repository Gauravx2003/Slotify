import type { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'outline' | 'ghost';
}

export function Button({
    children,
    className,
    isLoading,
    variant = 'primary',
    disabled,
    ...props
}: ButtonProps) {
    const variants = {
        primary: "bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 border border-transparent",
        outline: "border-2 border-primary-100 text-primary-600 hover:border-primary-200 hover:bg-primary-50/50",
        ghost: "text-primary-600 hover:bg-primary-50/50",
    };

    return (
        <button
            disabled={isLoading || disabled}
            className={twMerge(
                clsx(
                    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-primary-500/10 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
                    variants[variant],
                    className
                )
            )}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
