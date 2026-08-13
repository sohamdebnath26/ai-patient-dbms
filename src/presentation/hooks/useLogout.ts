import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useChat } from "@presentation/contexts/ChatContext";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const { clearChat, setOpen: setChatOpen } = useChat();

  return useCallback(async () => {
    setChatOpen(false);
    clearChat();
    queryClient.clear();
    await logout();
    void navigate("/auth/login", { replace: true });
  }, [navigate, queryClient, logout, clearChat, setChatOpen]);
}
