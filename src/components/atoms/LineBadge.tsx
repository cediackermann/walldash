export const LineBadge = ({ designation, mode }: { designation: string; mode: string }) => {
  const getColor = (mode: string) => {
    switch (mode) {
      case 'METRO': return 'bg-sl-blue';
      case 'BUS': return 'bg-sl-red';
      case 'TRAM': return 'bg-sl-green';
      case 'TRAIN': return 'bg-sl-orange';
      default: return 'bg-gray-600';
    }
  };

  return (
    <span className={`${getColor(mode)} text-white px-3 py-1 rounded font-bold min-w-[60px] text-center text-xl inline-block`}>
      {designation}
    </span>
  );
};
