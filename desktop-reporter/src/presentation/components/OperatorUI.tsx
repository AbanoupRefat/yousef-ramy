import type { ReactNode, SVGProps } from 'react';

type IconName = 'scissors' | 'queue' | 'receipt' | 'wallet' | 'chart' | 'star' | 'settings' | 'plus' | 'arrow-up' | 'arrow-down' | 'trash' | 'check' | 'alert' | 'info' | 'close' | 'refresh' | 'box';

export function Icon({ name, size = 19, ...props }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  const paths: Record<IconName, ReactNode> = {
    scissors: <><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="m8.5 8.5 11 11M8.5 15.5l11-11" /></>,
    queue: <><path d="M5 5h14M5 12h14M5 19h14" /><circle cx="3" cy="5" r=".7" fill="currentColor" /><circle cx="3" cy="12" r=".7" fill="currentColor" /><circle cx="3" cy="19" r=".7" fill="currentColor" /></>,
    receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
    wallet: <><path d="M4 6a2 2 0 0 1 2-2h12v16H6a2 2 0 0 1-2-2V6Z" /><path d="M4 7h14M15 12h4" /><circle cx="15" cy="12" r=".7" fill="currentColor" /></>,
    chart: <><path d="M4 19V5M4 19h17" /><path d="m7 15 3-4 3 2 5-7" /></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.6 1.6-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2H11v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.6-1.6.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H5v-2.4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.6-1.6.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.6 1.6-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v2.4h-.2a1.7 1.7 0 0 0-1.5 1Z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    'arrow-up': <path d="m6 10 6-6 6 6M12 4v16" />,
    'arrow-down': <path d="m6 14 6 6 6-6M12 20V4" />,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="M10.3 3.5 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    refresh: <><path d="M20 11a8.1 8.1 0 0 0-14.5-3L3 11" /><path d="M3 5v6h6M4 13a8.1 8.1 0 0 0 14.5 3L21 13" /><path d="M21 19v-6h-6" /></>,
    box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger' }) {
  return <button className={`op-button op-button-${variant} ${className}`} {...props}>{children}</button>;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`op-panel ${className}`}>{children}</section>; }
export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) { return <span className={`op-status op-status-${tone}`}>{children}</span>; }
export function Alert({ children, tone = 'danger' }: { children: ReactNode; tone?: 'danger' | 'info' | 'success' }) { return <div className={`op-alert op-alert-${tone}`} role="alert"><Icon name={tone === 'danger' ? 'alert' : tone === 'success' ? 'check' : 'info'} size={18} /><div>{children}</div></div>; }
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="op-empty"><Icon name="info" size={24} /><strong>{title}</strong><p>{description}</p>{action}</div>; }
export function SectionHeader({ icon, title, description, action }: { icon: IconName; title: string; description?: string; action?: ReactNode }) { return <div className="op-section-header"><div className="op-section-heading"><span className="op-section-icon"><Icon name={icon} /></span><div><h2>{title}</h2>{description && <p>{description}</p>}</div></div>{action}</div>; }
export function ConfirmDialog({ open, title, description, confirmLabel, onCancel, onConfirm, busy = false }: { open: boolean; title: string; description: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; busy?: boolean }) { if (!open) return null; return <div className="op-dialog-backdrop"><div className="op-dialog" role="alertdialog" aria-modal="true" aria-labelledby="op-dialog-title"><button className="op-dialog-close" aria-label="إغلاق" onClick={onCancel}><Icon name="close" /></button><div className="op-dialog-mark"><Icon name="alert" /></div><h2 id="op-dialog-title">{title}</h2><p>{description}</p><div className="op-dialog-actions"><Button variant="quiet" onClick={onCancel} disabled={busy}>تراجع</Button><Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? 'جارٍ التنفيذ…' : confirmLabel}</Button></div></div></div>; }
