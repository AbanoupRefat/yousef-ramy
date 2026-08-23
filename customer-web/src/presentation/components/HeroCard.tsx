
import { Card } from './Card';

interface HeroCardProps {
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  queueDepth?: number;
  etaSeconds?: number;
  selected?: boolean;
  isNextAvailable?: boolean;
  onClick?: () => void;
}

export function HeroCard({ 
  name, 
  subtitle, 
  avatarUrl, 
  queueDepth, 
  etaSeconds, 
  selected = false, 
  isNextAvailable = false,
  onClick 
}: HeroCardProps) {
  
  const formatEta = (seconds: number) => {
    if (seconds <= 0) return 'Any moment';
    const mins = Math.ceil(seconds / 60);
    return `~${mins} min`;
  };

  return (
    <Card onClick={onClick} selected={selected} className={isNextAvailable ? 'bg-secondary border-primary/20' : ''}>
      <div className="flex items-center gap-4">
        {/* Avatar Placeholder */}
        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-inner ${isNextAvailable ? 'bg-accent/20' : 'bg-gray-100'}`}>
          {isNextAvailable ? '⚡' : avatarUrl ? <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" /> : '👤'}
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
            {name}
            {isNextAvailable && <span className="text-[10px] bg-accent text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Fastest</span>}
          </h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          
          {(queueDepth !== undefined || etaSeconds !== undefined) && (
            <div className="flex items-center gap-3 mt-1.5 text-sm">
              {queueDepth !== undefined && (
                <span className="text-gray-600 font-medium">
                  <span className="text-gray-400">Waitlist:</span> {queueDepth} {queueDepth === 1 ? 'person' : 'people'}
                </span>
              )}
              {etaSeconds !== undefined && (
                <span className="text-accent font-bold">
                  ETA: {formatEta(etaSeconds)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
