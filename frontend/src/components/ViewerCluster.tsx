import { formatCount } from "@/lib/utils";

const GRADIENTS = [
  "from-amber-400 to-amber-700",
  "from-amber-500 to-orange-700",
  "from-orange-400 to-red-600",
  "from-yellow-500 to-amber-700",
  "from-rose-400 to-amber-600",
];

function pick(seed: string, i: number) {
  let h = 0;
  const s = `${seed}-${i}`;
  for (let j = 0; j < s.length; j++) h = (h * 31 + s.charCodeAt(j)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function ViewerCluster({
  count,
  seed,
  initials = [],
}: {
  count: number;
  seed: string;
  initials?: string[];
}) {
  if (count <= 0) return null;

  const tiles = Array.from({ length: 3 }, (_, i) => ({
    gradient: pick(seed, i),
    initial: initials[i]?.[0]?.toUpperCase() ?? "",
  }));

  const verb = count === 1 ? "Read by 1 person" : `Read by ${formatCount(count)} people`;

  return (
    <div className="inline-flex items-center gap-3 text-sm text-muted">
      <div className="flex -space-x-2">
        {tiles.map((t, i) => (
          <span
            key={i}
            aria-hidden
            className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${t.gradient} text-[10px] font-bold text-white ring-2 ring-[color:var(--bg)]`}
          >
            {t.initial}
          </span>
        ))}
      </div>
      <span>{verb}</span>
    </div>
  );
}
