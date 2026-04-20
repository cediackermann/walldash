export const SBBLineBadge = ({ name }: { name: string; category?: string }) => (
  <span className="border border-white text-white px-2 py-0.5 font-bold min-w-[56px] text-center text-xl inline-block">
    {name}
  </span>
);
