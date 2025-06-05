import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description: string;
  variant?: "default" | "destructive";
};

export function toast({ title, description, variant = "default" }: ToastProps) {
  sonnerToast[variant === "destructive" ? "error" : "success"](
    title || description,
    {
      description: title ? description : undefined,
    }
  );
}
