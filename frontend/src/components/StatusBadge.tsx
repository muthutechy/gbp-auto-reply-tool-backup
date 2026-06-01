const styles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  awaiting_approval: "bg-orange-500/15 text-orange-300",
  approved: "bg-blue-500/15 text-blue-300",
  replied: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-red-500/15 text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
        styles[status] || "bg-zinc-700 text-zinc-300"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
