import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@presentation/hooks/useAuth";
import { useContext } from "react";
import { ChatContext } from "@presentation/contexts/ChatContext";

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  const chatCtx = useContext(ChatContext);
  const setChatOpen = chatCtx?.setOpen;
  const clearChat = chatCtx?.clearChat;

  return useCallback(async () => {
    try {
      setChatOpen?.(false);
      clearChat?.();
    } catch {
      // chat context cleanup is optional
    }
    queryClient.clear();
    await logout();
    void navigate("/auth/login", { replace: true });
  }, [navigate, queryClient, logout, clearChat, setChatOpen]);
}
