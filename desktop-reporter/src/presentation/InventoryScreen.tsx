import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../../shared/domain/entities';
import type { IProductRepo } from '../application/interfaces';
import { Alert, Button, ConfirmDialog, EmptyState, Icon, Panel, SectionHeader, SelectMenu, StatusBadge } from './components/OperatorUI';

interface Props { productRepo: IProductRepo; }
type Filter = 'all' | 'low' | 'healthy';

type Draft = { name: string; stockQty: string; lowStockThreshold: string; unitCost: string; salePrice: string };
const blankDraft: Draft = { name: '', stockQty: '0', lowStockThreshold: '3', unitCost: '', salePrice: '' };

function makeId() { return crypto.randomUUID ? crypto.randomUUID() : `product-${Date.now()}`; }

export function InventoryScreen({ productRepo }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'danger' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const notify = (text: string, tone: 'success' | 'danger' = 'success') => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), 4500);
  };

  const loadProducts = async () => {
    setLoading(true);
    try { setProducts(await productRepo.getAll()); }
    catch (error: any) { notify(error.message || 'تعذر تحميل المستلزمات.', 'danger'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadProducts(); }, []);

  const filteredProducts = useMemo(() => products.filter((product) => filter === 'all' || (filter === 'low' ? product.stockQty <= product.lowStockThreshold : product.stockQty > product.lowStockThreshold)), [filter, products]);
  const lowStockCount = products.filter((product) => product.stockQty <= product.lowStockThreshold).length;
  const totalValue = products.reduce((sum, product) => sum + product.stockQty * product.unitCost, 0);
  const deletingProduct = products.find((product) => product.id === deleteId);

  const startCreate = () => { setEditingId(null); setDraft(blankDraft); };
  const startEdit = (product: Product) => { setEditingId(product.id); setDraft({ name: product.name, stockQty: String(product.stockQty), lowStockThreshold: String(product.lowStockThreshold), unitCost: String(product.unitCost), salePrice: product.salePrice == null ? '' : String(product.salePrice) }); };
  const updateDraft = (key: keyof Draft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = draft.name.trim();
    const stockQty = Number(draft.stockQty);
    const lowStockThreshold = Number(draft.lowStockThreshold);
    const unitCost = Number(draft.unitCost);
    const salePrice = draft.salePrice.trim() === '' ? null : Number(draft.salePrice);
    if (!name || !Number.isFinite(stockQty) || stockQty < 0 || !Number.isFinite(lowStockThreshold) || lowStockThreshold < 0 || !Number.isFinite(unitCost) || unitCost < 0 || (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0))) { notify('تحقق من الاسم والقيم الرقمية قبل الحفظ.', 'danger'); return; }
    setSaving(true);
    try {
      const product: Product = { id: editingId || makeId(), name, stockQty, lowStockThreshold, unitCost, salePrice: salePrice ?? undefined };
      if (editingId) await productRepo.update(product); else await productRepo.create(product);
      notify(editingId ? 'تم تحديث بيانات المستلزم.' : 'تمت إضافة المستلزم إلى المخزون.');
      startCreate();
      await loadProducts();
    } catch (error: any) { notify(error.message || 'تعذر حفظ المستلزم.', 'danger'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try { await productRepo.delete(deleteId); notify('تم حذف المستلزم من المخزون.'); setDeleteId(null); if (editingId === deleteId) startCreate(); await loadProducts(); }
    catch (error: any) { notify(error.message || 'تعذر حذف المستلزم.', 'danger'); }
    finally { setSaving(false); }
  };

  return <div className="operator-page inventory-page"><div className="operator-page-intro"><div><div className="operator-eyebrow">المخزون</div><h1 className="operator-page-title">مركز المستلزمات</h1><p className="operator-page-description">أضف المنتجات، عدّل الكميات، واحذف ما لم تعد تستخدمه من مكان واحد.</p></div><Button variant="secondary" onClick={startCreate}><Icon name="plus" size={17} /> مستلزم جديد</Button></div>{notice && <Alert tone={notice.tone}>{notice.text}</Alert>}<div className="inventory-metrics"><Panel><span>عدد المستلزمات</span><strong>{products.length}</strong></Panel><Panel><span>تحتاج متابعة</span><strong className={lowStockCount ? 'metric-danger' : ''}>{lowStockCount}</strong></Panel><Panel><span>قيمة المخزون</span><strong>{totalValue.toFixed(2)} <small>ج.م</small></strong></Panel></div><div className="inventory-layout"><Panel className="inventory-editor"><SectionHeader icon={editingId ? 'edit' : 'plus'} title={editingId ? 'تعديل مستلزم' : 'إضافة مستلزم'} description={editingId ? 'حدّث البيانات ثم احفظ التغيير.' : 'أضف منتجاً سيظهر في سجل الحركة والمخزون.'} action={editingId ? <Button variant="quiet" onClick={startCreate}>إلغاء التعديل</Button> : undefined} /><form className="form-stack" onSubmit={saveProduct}><div className="field-group"><label className="field-label" htmlFor="product-name">اسم المستلزم</label><input id="product-name" className="field-input" value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} placeholder="مثال: كريم تصفيف" required /></div><div className="field-grid"><div className="field-group"><label className="field-label" htmlFor="product-stock">الرصيد الحالي</label><input id="product-stock" className="field-input" type="number" min="0" step="1" value={draft.stockQty} onChange={(event) => updateDraft('stockQty', event.target.value)} required /></div><div className="field-group"><label className="field-label" htmlFor="product-threshold">حد التنبيه</label><input id="product-threshold" className="field-input" type="number" min="0" step="1" value={draft.lowStockThreshold} onChange={(event) => updateDraft('lowStockThreshold', event.target.value)} required /></div></div><div className="field-grid"><div className="field-group"><label className="field-label" htmlFor="product-cost">تكلفة القطعة</label><input id="product-cost" className="field-input" type="number" min="0" step="0.01" value={draft.unitCost} onChange={(event) => updateDraft('unitCost', event.target.value)} placeholder="0.00" required /></div><div className="field-group"><label className="field-label" htmlFor="product-sale">سعر البيع <span className="field-hint">اختياري</span></label><input id="product-sale" className="field-input" type="number" min="0" step="0.01" value={draft.salePrice} onChange={(event) => updateDraft('salePrice', event.target.value)} placeholder="بدون بيع مباشر" /></div></div><Button type="submit" className="op-button-wide" disabled={saving}>{saving ? 'جارٍ الحفظ…' : editingId ? 'حفظ التعديلات' : 'إضافة إلى المخزون'}</Button></form></Panel><Panel className="inventory-list"><SectionHeader icon="box" title="كل المستلزمات" description="استخدم الفلتر للتركيز على ما يحتاج قراراً الآن." /><SelectMenu value={filter} onChange={(value) => setFilter(value as Filter)} label="عرض" options={[{ value: 'all', label: 'كل المستلزمات', meta: `${products.length} عناصر` }, { value: 'low', label: 'تحتاج متابعة', meta: `${lowStockCount} عناصر` }, { value: 'healthy', label: 'الرصيد آمن', meta: `${products.length - lowStockCount} عناصر` }]} /><div className="inventory-list-items">{loading ? <div className="inventory-skeleton" aria-label="جارٍ تحميل المخزون" /> : filteredProducts.length === 0 ? <EmptyState title={products.length === 0 ? 'لا توجد مستلزمات بعد' : 'لا توجد نتائج بهذا الفلتر'} description={products.length === 0 ? 'ابدأ بإضافة أول مستلزم ليظهر هنا.' : 'جرّب عرض كل المستلزمات أو عدّل حدود التنبيه.'} action={products.length === 0 ? <Button variant="secondary" onClick={startCreate}>إضافة أول مستلزم</Button> : undefined} /> : filteredProducts.map((product) => <div className="inventory-item" key={product.id}><div className="inventory-item-main"><div className="inventory-item-title"><strong>{product.name}</strong><StatusBadge tone={product.stockQty <= product.lowStockThreshold ? 'danger' : 'success'}>{product.stockQty <= product.lowStockThreshold ? 'منخفض' : 'متاح'}</StatusBadge></div><div className="inventory-item-meta">الرصيد {product.stockQty} · حد التنبيه {product.lowStockThreshold} · تكلفة القطعة {product.unitCost.toFixed(2)} ج.م</div></div><div className="inventory-item-actions"><Button variant="quiet" onClick={() => startEdit(product)} aria-label={`تعديل ${product.name}`}><Icon name="edit" size={17} /></Button><Button variant="quiet" onClick={() => setDeleteId(product.id)} aria-label={`حذف ${product.name}`}><Icon name="trash" size={17} /></Button></div></div>)}</div></Panel></div><ConfirmDialog open={Boolean(deleteId)} title="حذف المستلزم؟" description={`سيُحذف «${deletingProduct?.name || 'هذا المستلزم'}» من قائمة المخزون. لا يمكن التراجع عن هذا الإجراء.`} confirmLabel="حذف المستلزم" onCancel={() => setDeleteId(null)} onConfirm={() => void confirmDelete()} busy={saving} /></div>;
}
