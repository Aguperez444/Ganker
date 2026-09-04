const ChatDrawer = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <button
        type="button"
        aria-label="Cerrar conversaciones"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
      />

      <aside className="absolute top-0 right-0 flex h-full w-80 max-w-[90vw] flex-col border-l border-white/10 bg-ganker-surface shadow-2xl">
        <header className="flex h-17 items-center justify-between border-b border-white/10 px-5">
          <h2 className="font-heading text-lg font-semibold text-ganker-text">
            Conversaciones
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar conversaciones"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ganker-muted transition hover:bg-ganker-surface-light hover:text-ganker-text"
          >
            ×
          </button>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-sm text-ganker-muted">
            El chat se integrará en las próximas User Stories.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default ChatDrawer;
