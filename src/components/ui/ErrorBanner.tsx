interface Props {
  message: string;
  type?: "error" | "warning" | "info";
}

const colors: Record<string, string> = {
  error: "bg-red-900/50 border-red-500/50 text-red-300",
  warning: "bg-yellow-900/50 border-yellow-500/50 text-yellow-300",
  info: "bg-blue-900/50 border-blue-500/50 text-blue-300",
};

export function ErrorBanner({ message, type = "error" }: Props) {
  return (
    <div className={`border rounded-lg p-4 ${colors[type]}`}>
      <p className="font-medium text-sm">{message}</p>
    </div>
  );
}
