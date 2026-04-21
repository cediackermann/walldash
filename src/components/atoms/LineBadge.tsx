export const LineBadge = ({ designation }: {
  designation: string;
  mode?: string;
  groupOfLines?: string;
}) => (
  <span className="border border-white text-white px-2 py-0.5 font-bold min-w-[56px] text-center text-xl inline-block shrink-0">
    {designation}
  </span>
);
