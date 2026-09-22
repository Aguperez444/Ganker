import ChatSidebarComponent from "../chat/ChatSidebarComponent.jsx";

const ChatDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Cerrar conversaciones"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      <aside className="absolute top-0 right-0 flex h-full w-96 max-w-[90vw] flex-col border-l border-white/10 bg-ganker-surface shadow-2xl">
        <ChatSidebarComponent onCerrar={onClose} />
      </aside>
    </div>
  );
};

export default ChatDrawer;
