/** SBB line badge. `size` is the pixel height of the badge. */
export const SBBLineBadge = ({
  name,
  size = 36,
}: {
  name: string;
  category?: string;
  size?: number;
}) => (
  <span
    className="border border-white text-white font-bold text-center tabular-nums shrink-0 inline-flex items-center justify-center"
    style={{
      height: size,
      minWidth: size * 1.6,
      fontSize: Math.max(10, size * 0.44),
      padding: `0 ${size * 0.18}px`,
    }}
  >
    {name}
  </span>
);
