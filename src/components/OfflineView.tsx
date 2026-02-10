interface Props {
  account: { riotId?: { gameName?: string } } | undefined;
  reason: string;
}

const REASON_MESSAGES: Record<string, string> = {
  NOT_IN_GAME: "Este jugador no está en una partida actualmente.",
  KEY_INVALID:
    "La API key de Riot es inválida o expiró. Contacta al administrador.",
  SPECTATOR_UNAVAILABLE:
    "El servicio de espectador no está disponible temporalmente.",
  SPECTATOR_DISABLED: "La función de espectador está deshabilitada.",
  RATE_LIMITED:
    "Demasiadas solicitudes a la API de Riot. Intentá de nuevo en unos segundos.",
};

export function OfflineView({ account, reason }: Props) {
  const message =
    REASON_MESSAGES[reason] ??
    `No se puede obtener la partida: ${reason}`;

  const isError = reason === "KEY_INVALID" || reason === "RATE_LIMITED";

  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="text-7xl mb-6">{isError ? "⚠️" : "😴"}</div>

      <h2 className="text-2xl font-bold text-white mb-2">
        {account?.riotId?.gameName ?? "Jugador"} no está en partida
      </h2>

      <p className="text-gray-400 mb-8 leading-relaxed">{message}</p>

      <a
        href="/"
        className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        ← Volver al dashboard
      </a>
    </div>
  );
}
