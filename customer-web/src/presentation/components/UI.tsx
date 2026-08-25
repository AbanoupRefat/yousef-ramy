import type { ReactNode, SVGProps } from 'react';

type IconName = 'scissors' | 'clock' | 'check' | 'arrow-left' | 'refresh' | 'phone' | 'pin' | 'info' | 'alert' | 'user' | 'logout' | 'close' | 'queue' | 'settings' | 'arrow-up' | 'arrow-down' | 'trash';

export function Icon({ name, size = 20, ...props }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  const paths: Record<IconName, ReactNode> = {
    scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="m8.5 8.5 11 11M8.5 15.5l11-11" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    'arrow-left': <path d="m15 18-6-6 6-6M9 12h10" />,
    refresh: <><path d="M20 11a8.1 8.1 0 0 0-14.5-3L3 11" /><path d="M3 5v6h6" /><path d="M4 13a8.1 8.1 0 0 0 14.5 3L21 13" /><path d="M21 19v-6h-6" /></>,
    phone: <><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 18h4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    alert: <><path d="M10.3 3.5 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    queue: <><path d="M5 5h14M5 12h14M5 19h14" /><circle cx="3" cy="5" r=".7" fill="currentColor" /><circle cx="3" cy="12" r=".7" fill="currentColor" /><circle cx="3" cy="19" r=".7" fill="currentColor" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.6 1.6-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2H11v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.6-1.6.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-2.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.6-1.6.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.6 1.6-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2.4h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
    'arrow-up': <path d="m6 10 6-6 6 6M12 4v16" />,
    'arrow-down': <path d="m6 14 6 6 6-6M12 20V4" />,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' }) {
  return <button className={`ui-button ui-button-${variant} ${className}`} {...props}>{children}</button>;
}

export function SectionHeader({ icon, title, description }: { icon: IconName; title: string; description?: string }) { return <div className="ui-panel-header"><div className="ui-panel-heading"><span className="ui-panel-icon"><Icon name={icon} size={18} /></span><div><h2 className="ui-panel-title">{title}</h2>{description && <p className="ui-panel-note">{description}</p>}</div></div></div>; }

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`ui-panel ${className}`}>{children}</section>;
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  return <span className={`status-badge status-${tone}`}>{children}</span>;
}

export function Alert({ children, tone = 'danger' }: { children: ReactNode; tone?: 'danger' | 'info' | 'success' }) {
  return <div className={`ui-alert ui-alert-${tone}`} role="alert"><Icon name={tone === 'danger' ? 'alert' : tone === 'success' ? 'check' : 'info'} size={18} /><div>{children}</div></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-state-mark"><Icon name="info" size={22} /></div><strong>{title}</strong><p>{description}</p>{action}</div>;
}

export function ConfirmDialog({ open, title, description, confirmLabel, onCancel, onConfirm, busy = false }: { open: boolean; title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; busy?: boolean }) {
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation"><div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title"><button className="dialog-close" onClick={onCancel} aria-label="إغلاق"><Icon name="close" /></button><div className="dialog-mark"><Icon name="alert" size={22} /></div><h2 id="dialog-title">{title}</h2><p>{description}</p><div className="dialog-actions"><Button variant="quiet" onClick={onCancel} disabled={busy}>الاحتفاظ بالحجز</Button><Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'جارٍ التنفيذ…' : confirmLabel}</Button></div></div></div>;
}
