import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold select-none touch-manipulation text-sm ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bubble-btn relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bubble-btn-primary",
        destructive:
          "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_4px_16px_rgba(244,63,94,0.35),inset_0_1.5px_1px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_24px_rgba(244,63,94,0.5)] border border-white/20",
        outline: "bubble-btn-outline",
        secondary: "bubble-btn-secondary",
        ghost: "rounded-full hover:bg-primary/15 text-foreground hover:text-primary active:scale-[0.97]",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
        magical: "bubble-btn-secondary",
        emerald: "bubble-btn-emerald",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3.5 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
