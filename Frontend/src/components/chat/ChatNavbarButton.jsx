import { useChat } from "../../context/ChatContext";

const ChatNavbarButton = ({ onOpenChat, chatVisible = false }) => {
  const { totalNoLeidos } = useChat();

  return (
    <button
      type="button"
      onClick={onOpenChat}
      aria-pressed={chatVisible}
      aria-label={
        chatVisible
          ? "Ocultar chat"
          : totalNoLeidos > 0
            ? `Enviar mensaje (${totalNoLeidos} mensajes sin leer)`
            : "Enviar mensaje"
      }
      title={chatVisible ? "Ocultar chat" : "Enviar mensaje"}
      className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition hover:bg-ganker-surface-light hover:text-ganker-text ${
        chatVisible
          ? "bg-ganker-purple/20 text-ganker-text"
          : "text-ganker-muted"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      </svg>

      {totalNoLeidos > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ganker-error px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ganker-surface"
          aria-hidden="true"
        >
          {totalNoLeidos > 99 ? "99+" : totalNoLeidos}
        </span>
      )}
    </button>
  );
};

export default ChatNavbarButton;
