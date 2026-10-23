import useVincularDiscord from "../hooks/useVincularDiscord";

// Discord vuelve aca despues de que el jugador autoriza (o cancela) en
// discord.com: /app/discord/callback?code=...&state=... (o ?error=...).
// Se canjea el codigo en el backend y se vuelve a Mi cuenta con el resultado.
const DiscordCallbackPage = () => {
  useVincularDiscord();

  return (
    <section className="flex min-h-full items-center justify-center bg-ganker-bg p-6">
      <p className="text-sm text-ganker-muted">Conectando con Discord...</p>
    </section>
  );
};

export default DiscordCallbackPage;
