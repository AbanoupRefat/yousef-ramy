import { useEffect, useState } from 'react';
import { RecordExpense } from '../application/RecordExpense';
import type { IExpenseRepo } from '../application/interfaces';
import type { Expense } from '../../../shared/domain/entities';
import { Alert, Button, EmptyState, Panel, SectionHeader, StatusBadge } from './components/OperatorUI';

interface Props { recordExpenseUseCase: RecordExpense; expenseRepo: IExpenseRepo; }

export function ExpensesScreen({ recordExpenseUseCase, expenseRepo }: Props) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'danger' } | null>(null);
  const [saving, setSaving] = useState(false);
  const loadExpenses = async () => { try { setExpenses(await expenseRepo.getExpensesForDay(new Date())); } catch (err: any) { setNotice({ text: err.message || 'تعذر تحميل المصروفات.', tone: 'danger' }); } };
  useEffect(() => { loadExpenses(); }, [expenseRepo]);
  const handleSubmit = async (event: React.FormEvent) => { event.preventDefault(); if (!description.trim() || Number(amount) <= 0) { setNotice({ text: 'أدخل وصفاً ومبلغاً أكبر من صفر.', tone: 'danger' }); return; } setSaving(true); try { await recordExpenseUseCase.execute(description.trim(), Number(amount)); setDescription(''); setAmount(''); await loadExpenses(); setNotice({ text: 'تم تسجيل المصروف بنجاح.', tone: 'success' }); } catch (err: any) { setNotice({ text: err.message || 'تعذر تسجيل المصروف.', tone: 'danger' }); } finally { setSaving(false); } };
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  return <div className="operator-page"><div className="operator-page-intro"><div><div className="operator-eyebrow">النقدية اليومية</div><h1 className="operator-page-title">المصروفات</h1><p className="operator-page-description">سجّل المصروف كما حدث، ثم راجع أثره على يومك من نفس الصفحة.</p></div><StatusBadge tone="danger">إجمالي اليوم: ${total.toFixed(2)}</StatusBadge></div>{notice && <Alert tone={notice.tone}>{notice.text}</Alert>}<Panel><SectionHeader icon="wallet" title="إضافة مصروف" description="الوصف يساعدك على فهم التقرير لاحقاً؛ لا تتركه عاماً مثل “مصروف”." /><form className="field-grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(180px, .5fr) auto' }} onSubmit={handleSubmit}><div className="field-group"><label className="field-label" htmlFor="expense-description">وصف المصروف</label><input id="expense-description" className="field-input" type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="مثال: أدوات نظافة أو صيانة" required /></div><div className="field-group"><label className="field-label" htmlFor="expense-amount">المبلغ</label><input id="expense-amount" className="field-input" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></div><Button type="submit" disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ المصروف'}</Button></form></Panel><Panel><SectionHeader icon="receipt" title="سجل مصروفات اليوم" description={`${expenses.length} عملية مسجلة`} />{expenses.length === 0 ? <EmptyState title="لا توجد مصروفات اليوم" description="ستظهر العمليات هنا بعد تسجيل أول مصروف." /> : <div className="data-list">{expenses.map((expense) => <div className="data-row" key={expense.id}><div className="data-row-main"><div className="data-row-title">{expense.description}</div><div className="data-row-meta">{new Date(expense.timestamp).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div></div><div className="data-row-value outcome">-${Number(expense.amount).toFixed(2)}</div></div>)}</div>}</Panel></div>;
}
