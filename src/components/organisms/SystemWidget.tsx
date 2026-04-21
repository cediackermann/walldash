import { useQuery } from '@tanstack/react-query';
import { useAlwaysOn } from '../../contexts/AlwaysOnContext';
import { useSize } from '../../hooks/useSize';

interface SystemData {
  cpu:    { percent: number; load: string[] };
  memory: { percent: number; usedGb: string; totalGb: string };
  disk:   { percent: number; usedGb: string; totalGb: string };
  uptime: string;
  hostname: string;
}

const MetricRow = ({
  label, percent, detail, rowH, barH, fontSize,
}: {
  label: string; percent: number; detail: string;
  rowH: number; barH: number; fontSize: number;
}) => (
  <div className="flex items-center gap-2 font-mono shrink-0" style={{ height: rowH, fontSize }}>
    <span className="text-gray-400 shrink-0" style={{ width: '3.2em' }}>{label}</span>
    <div className="flex-1 min-w-0 bg-zinc-800 relative" style={{ height: barH }}>
      <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${percent}%` }} />
    </div>
    <span className="text-gray-500 shrink-0">{detail}</span>
  </div>
);

export const SystemWidget = () => {
  const alwaysOn = useAlwaysOn();
  const { w, h, ref } = useSize();
  const { data } = useQuery<SystemData>({
    queryKey: ['system'],
    queryFn: () => fetch('/api/system').then(r => r.json()),
    refetchInterval: alwaysOn ? 60_000 : 2_000,
  });

  if (!data) return <div ref={ref} className="w-full h-full" />;

  const effectiveH = h || 120;
  const effectiveW = w || 300;

  // Progressive disclosure
  const showHostname  = effectiveH > 55;
  const showDisk      = effectiveH > 95;
  const showUptime    = showHostname && (effectiveH > 120 || effectiveW > 450);
  const showLoadDetail = effectiveH > 150 && effectiveW > 380;

  // Row sizing
  const metricCount = 2 + (showDisk ? 1 : 0);
  const hostH       = showHostname ? Math.min(effectiveH * 0.22, 32) : 0;
  const availH      = effectiveH - hostH - (metricCount - 1) * 5;
  const rowH        = Math.max(14, Math.min(availH / metricCount, 52));
  const fontSize    = Math.max(10, rowH * 0.52);
  const barH        = Math.max(2, rowH * 0.22);
  const hostFontSz  = Math.max(12, Math.min(effectiveH * 0.14, 28));

  return (
    <div ref={ref} className="w-full h-full flex flex-col justify-center overflow-hidden" style={{ gap: 5 }}>
      {showHostname && (
        <div className="flex justify-between items-baseline shrink-0" style={{ height: hostH }}>
          <span className="font-bold truncate" style={{ fontSize: hostFontSz }}>{data.hostname}</span>
          {showUptime && (
            <span className="text-gray-500 font-mono shrink-0 ml-2" style={{ fontSize: hostFontSz * 0.65 }}>
              up {data.uptime}
            </span>
          )}
        </div>
      )}
      <MetricRow
        label="CPU"
        percent={data.cpu.percent}
        detail={showLoadDetail ? data.cpu.load.join(' ') : `${data.cpu.percent}%`}
        rowH={rowH} barH={barH} fontSize={fontSize}
      />
      <MetricRow
        label="MEM"
        percent={data.memory.percent}
        detail={`${data.memory.usedGb}/${data.memory.totalGb}G`}
        rowH={rowH} barH={barH} fontSize={fontSize}
      />
      {showDisk && (
        <MetricRow
          label="DISK"
          percent={data.disk.percent}
          detail={`${data.disk.usedGb}/${data.disk.totalGb}G`}
          rowH={rowH} barH={barH} fontSize={fontSize}
        />
      )}
    </div>
  );
};
