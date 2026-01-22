import type { InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    startIcon?: ReactNode;
    endIcon?: ReactNode;
    fullWidth?: boolean;
}

export function Input({
    label,
    error,
    className,
    startIcon,
    endIcon,
    fullWidth = true,
    id,
    ...props
}: InputProps) {
    const inputId = id || props.name || label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className={clsx("flex flex-col gap-1.5", fullWidth && "w-full")}>
            <label
                htmlFor={inputId}
                className="text-sm font-medium text-surface-600 ml-1 transition-colors group-focus-within:text-primary-600"
            >
                {label}
            </label>
            <div className="relative group">
                {startIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 transition-colors group-focus-within:text-primary-500 pointer-events-none">
                        {startIcon}
                    </div>
                )}

                <input
                    id={inputId}
                    className={twMerge(
                        clsx(
                            "flex h-12 w-full rounded-xl border-2 bg-white/50 backdrop-blur-sm px-4 text-sm font-medium text-surface-900 transition-all duration-300",
                            "placeholder:text-surface-400",
                            "border-surface-200 hover:border-surface-300",
                            "focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:bg-white",
                            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-100",
                            startIcon && "pl-11",
                            endIcon && "pr-11",
                            error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                            className
                        )
                    )}
                    {...props}
                />

                {endIcon && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                        {endIcon}
                    </div>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-1.5 ml-1 animate-fade-in">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-xs font-medium text-red-500">{error}</span>
                </div>
            )}
        </div>
    );
}
