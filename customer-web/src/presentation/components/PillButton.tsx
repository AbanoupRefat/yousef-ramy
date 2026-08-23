

interface PillButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function PillButton({ label, selected, onClick }: PillButtonProps) {
  const baseClasses = 'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200';
  
  const stateClasses = selected
    ? 'bg-primary text-white shadow-md'
    : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  return (
    <button 
      type="button"
      className={`${baseClasses} ${stateClasses}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
