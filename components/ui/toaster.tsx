"use client";

import { CheckCircle2, Info, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { hiyyaColors } from "@/lib/theme/tokens";

const VARIANT_ICON = {
  success: { Icon: CheckCircle2, color: hiyyaColors.gain },
  info: { Icon: Info, color: hiyyaColors.gold },
  warning: { Icon: AlertTriangle, color: hiyyaColors.warning },
} as const;

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const iconEntry =
          variant && variant in VARIANT_ICON
            ? VARIANT_ICON[variant as keyof typeof VARIANT_ICON]
            : null;
        return (
          <Toast key={id} variant={variant} {...props}>
            {iconEntry && (
              <iconEntry.Icon
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: iconEntry.color }}
                aria-hidden="true"
              />
            )}
            <div className="grid flex-1 gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
