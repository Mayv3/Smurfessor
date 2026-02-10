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

function SleepIcon() {
  return (
    <svg className="w-20 h-20 text-indigo-400/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12a10 10 0 0 0 18 6 8 8 0 1 1-9-9A10 10 0 0 0 2 12z" />
      <path d="M17 4h4M17 4v4M21 8l-4-4" className="animate-float" style={{animationDuration: '3s'}} />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-20 h-20 text-yellow-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function OfflineView({ account, reason }: Readonly<Props>) {
  const message =
    REASON_MESSAGES[reason] ??
    `No se puede obtener la partida: ${reason}`;

  const isError = reason === "KEY_INVALID" || reason === "RATE_LIMITED";

  return (
    <div className="max-w-lg mx-auto text-center py-16 animate-fadeIn">
      {/* Background pattern */}
      <div className="relative">
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none rounded-3xl" />
        
        <div className="relative space-y-6 px-8 py-12 rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`p-6 rounded-2xl ${isError ? 'bg-yellow-500/5 border border-yellow-500/10' : 'bg-indigo-500/5 border border-indigo-500/10'}`}>
              {isError ? <AlertIcon /> : <SleepIcon />}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">
              {account?.riotId?.gameName ?? "Jugador"} no está en partida
            </h2>
            <p className="text-gray-400 leading-relaxed text-sm max-w-sm mx-auto">{message}</p>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver al dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
