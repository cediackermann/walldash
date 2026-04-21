/** SL line badge. `size` is the pixel height of the badge. */
export const LineBadge = ({
  designation,
  size = 36,
}: {
  designation: string;
  mode?: string;
  groupOfLines?: string;
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
    {designation}
  </span>
);
