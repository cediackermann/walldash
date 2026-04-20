import { Link, useNavigate } from 'react-router-dom';
import { SearchBox } from '../components/organisms/SearchBox';
import { StopLocation } from '../types';

export const Settings = () => {
  const navigate = useNavigate();

  const handleSelect = async (stop: StopLocation) => {
    if (!confirm(`Vill du byta station till "${stop.name}"?`)) return;

    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: stop.id, stationName: stop.name, refreshRate: 30000 })
      });

      if (response.ok) {
        navigate('/');
      }
    } catch (e) {
      alert('Kunde inte spara inställningarna.');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen p-12 overflow-y-auto bg-black">
      <div className="flex items-center gap-8 mb-12">
        <Link to="/" className="text-4xl text-gray-500 hover:text-white transition-colors">
          ←
        </Link>
        <h1 className="text-5xl font-bold">Inställningar</h1>
      </div>

      <div className="max-w-4xl w-full mx-auto">
        <h2 className="text-2xl text-gray-400 mb-8 px-4 font-medium uppercase tracking-widest">
          Sök efter din station
        </h2>
        <SearchBox onSelect={handleSelect} />
      </div>
    </div>
  );
};
