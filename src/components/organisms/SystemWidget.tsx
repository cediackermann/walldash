import { useQuery } from '@tanstack/react-query';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';

interface SystemData {
  cpu: { percent: number; load: string[] };
  memory: { percent: number; usedGb: string; totalGb: string };
  disk: { percent: number; usedGb: string; totalGb: string };
  uptime: string;
  hostname: string;
}

const Bar = ({ percent }: { percent: number }) => (
  <div className="flex-1 h-1.5 bg-zinc-800 relative">
    <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${percent}%` }} />
  </div>
);

const Row = ({ label, percent, detail }: { label: string; percent: number; detail: string }) => (
  <div className="flex items-center gap-3 text-sm font-mono">
    <span className="w-10 text-gray-400 shrink-0">{label}</span>
    <Bar percent={percent} />
    <span className="w-8 text-right shrink-0">{percent}%</span>
    <span className="text-gray-500 shrink-0">{detail}</span>
  </div>
);

export const SystemWidget = () => {
  const alwaysOn = useAlwaysOn();
  const { data } = useQuery<SystemData>({
    queryKey: ['system'],
    queryFn: () => fetch('/api/system').then(r => r.json()),
    refetchInterval: alwaysOn ? 60_000 : 2_000,
  });

  if (!data) return null;

  return (
    <div className="h-full flex flex-col justify-center gap-3">
      <div className="flex justify-between items-baseline">
        <span className="font-bold text-lg">{data.hostname}</span>
        <span className="text-gray-500 text-sm font-mono">up {data.uptime}</span>
      </div>
      <Row label="CPU" percent={data.cpu.percent} detail={`load ${data.cpu.load[0]} ${data.cpu.load[1]} ${data.cpu.load[2]}`} />
      <Row label="MEM" percent={data.memory.percent} detail={`${data.memory.usedGb} / ${data.memory.totalGb} GB`} />
      <Row label="DISK" percent={data.disk.percent} detail={`${data.disk.usedGb} / ${data.disk.totalGb} GB`} />
    </div>
  );
};
