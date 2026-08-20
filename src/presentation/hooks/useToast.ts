import { useToastStore } from "@presentation/stores/toastStore";

export function useToast() {
  const push = useToastStore((s) => s.push);
  return {
    success: (message: string) => {
      push("success", message);
    },
    error: (message: string) => {
      push("error", message);
    },
  };
}
