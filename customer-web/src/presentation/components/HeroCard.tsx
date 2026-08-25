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
    if (seconds <= 0) return 'في أي لحظة';
    const mins = Math.ceil(seconds / 60);
    return `~${mins} دقيقة`;
  };

  return (
    <Card onClick={onClick} selected={selected} className={isNextAvailable ? 'bg-amber-50/60 border-amber-200' : ''}>
      <div className="flex items-center gap-4 dir-rtl text-right" dir="rtl">
        {/* Vector Icon Avatar */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xs ${isNextAvailable ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
          {isNextAvailable ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          ) : avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            {name}
            {isNextAvailable && <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">الخيار الأسرع</span>}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          
          {(queueDepth !== undefined || etaSeconds !== undefined) && (
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              {queueDepth !== undefined && (
                <span className="text-gray-600 font-medium">
                  الانتظار: <strong className="text-gray-900 font-bold">{queueDepth}</strong> زبائن
                </span>
              )}
              {etaSeconds !== undefined && (
                <span className="text-amber-700 font-bold">
                  الوقت المتوقع: {formatEta(etaSeconds)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
