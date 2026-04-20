import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from '../components/molecules/Clock';
import { DepartureList } from '../components/organisms/DepartureList';
import { Config, Departure } from '../types';

export const Dashboard = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setConfig(data);
      } catch (e) {
        console.error('Failed to load config', e);
      }
    };
    loadConfig();
  }, []);

  const fetchDepartures = async () => {
    if (!config?.stationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sl/departures/${config.stationId}`);
      const data = await res.json();
      setDepartures(data.departures || []);
    } catch (e) {
      console.error('Failed to fetch departures', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (config) {
      fetchDepartures();
      const interval = setInterval(fetchDepartures, config.refreshRate);
      return () => clearInterval(interval);
    }
  }, [config]);

  return (
    <div className="flex flex-col h-screen w-screen p-12 overflow-hidden gap-12">
      <div className="flex justify-between items-start border-b border-zinc-800 pb-10">
        <Clock />
        <Link 
          to="/settings" 
          className="p-4 bg-surface rounded-2xl text-3xl hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95"
        >
          ⚙️
        </Link>
      </div>

      <div className="flex-1 overflow-hidden">
        <h2 className="text-4xl font-bold mb-8 text-sl-blue uppercase tracking-widest">
          {departures[0]?.stop_area?.name || config?.stationName || 'Departures'}
        </h2>
        <DepartureList departures={departures} loading={loading} />
      </div>
    </div>
  );
};
