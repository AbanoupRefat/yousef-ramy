import { useState, useEffect } from 'react';
import type { Staff, BonusType, BonusKind } from '../../../shared/domain/entities';
import { UpdateBonusType } from '../application/UpdateBonusType';
import { ComputeBonus } from '../application/ComputeBonus';
import type { IStaffRepo, IBonusTypeRepo } from '../application/interfaces';

interface Props {
  updateBonusTypeUseCase: UpdateBonusType;
  computeBonusUseCase: ComputeBonus;
  staffRepo: IStaffRepo;
  bonusTypeRepo: IBonusTypeRepo;
}

export function BonusConfigScreen({ updateBonusTypeUseCase, computeBonusUseCase, staffRepo, bonusTypeRepo }: Props) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [bonusTypes, setBonusTypes] = useState<BonusType[]>([]);
  
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [computedBonus, setComputedBonus] = useState<number | null>(null);

  const [editKind, setEditKind] = useState<BonusKind>('percentage_commission');
  const [editParams, setEditParams] = useState<any>({});

  const loadData = async () => {
    const sList = await staffRepo.getAll();
    const bList = await bonusTypeRepo.getAll();
    setStaffList(sList);
    setBonusTypes(bList);
  };

  useEffect(() => {
    loadData();
  }, [staffRepo, bonusTypeRepo]);

  useEffect(() => {
    if (selectedStaffId) {
      const staff = staffList.find(s => s.id === selectedStaffId);
      if (staff) {
        const bType = bonusTypes.find(b => b.id === staff.bonusTypeId);
        if (bType) {
          setEditKind(bType.kind);
          setEditParams({ ...bType.params });
        }
        recalculate(selectedStaffId);
      }
    }
  }, [selectedStaffId, staffList, bonusTypes]);

  const recalculate = async (sId: string) => {
    try {
      const bonus = await computeBonusUseCase.execute(sId, new Date());
      setComputedBonus(bonus);
    } catch (e) {
      console.error(e);
      setComputedBonus(null);
    }
  };

  const handleSave = async () => {
    if (!selectedStaffId) return;
    try {
      await updateBonusTypeUseCase.execute(selectedStaffId, editKind, editParams);
      await loadData();
      alert('تم حفظ وتحديث نظام الحوافز بنجاح!');
    } catch (e: any) {
      alert(`خطأ أثناء الحفظ: ${e.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 space-y-6 dir-rtl text-right font-sans" dir="rtl">
      <div className="flex items-center gap-3 border-b pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">إعدادات ونسب الحوافز والعمولات</h2>
          <p className="text-sm text-gray-500">تحديد طريقة احتساب البونص والعمولة لكل حلاق في الصالون</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border-l pl-4 border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3 text-base">طاقم العمل والأنشطة</h3>
          <ul className="space-y-2">
            {staffList.map(s => (
              <li 
                key={s.id} 
                className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                  selectedStaffId === s.id 
                    ? 'bg-amber-50 border-amber-300 shadow-xs' 
                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedStaffId(s.id)}
              >
                <div className="font-bold text-gray-900">{s.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">الدور: {s.role === 'hero' ? 'حلاق رئيسي (Hero)' : s.role}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2 pr-2">
          {!selectedStaffId ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed text-gray-400">
              اختر حلاقاً من القائمة الجانبية لتعديل نظام الحوافز الخاص به.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/60 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">مستحق البونص الحالي</h4>
                  <p className="text-xs text-amber-700 mt-1">محسوب بناءً على مبيعات اليوم حتى الآن</p>
                </div>
                <div className="text-3xl font-black text-amber-900">
                  ${computedBonus !== null ? computedBonus.toFixed(2) : '---'}
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-base font-bold border-b pb-2 text-gray-900">تعديل استراتيجية الحافز</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع العمولة / الحافز</label>
                  <select 
                    value={editKind} 
                    onChange={e => {
                      setEditKind(e.target.value as BonusKind);
                      setEditParams({});
                    }}
                    className="block w-full rounded-xl border-gray-200 bg-white shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-3 border font-medium"
                  >
                    <option value="percentage_commission">نسبة مئوية من الإيراد (%)</option>
                    <option value="flat_per_customer">مبلغ ثابت لكل زبون ($)</option>
                    <option value="tiered_threshold">حافز إضافي بعد المستهدف ($)</option>
                    <option value="manual">مبلغ يدوي / ثابت ($)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">المعاملات والتفاصيل</h4>
                  
                  {editKind === 'percentage_commission' && (
                    <div>
                      <label className="block text-xs text-gray-600 font-medium">النسبة المئوية (%)</label>
                      <input 
                        type="number" 
                        value={editParams.percent || ''} 
                        onChange={e => setEditParams({ ...editParams, percent: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-xl border-gray-200 bg-white shadow-sm text-sm p-3 border"
                        placeholder="مثال: 30"
                      />
                    </div>
                  )}

                  {editKind === 'flat_per_customer' && (
                    <div>
                      <label className="block text-xs text-gray-600 font-medium">المبلغ الثابت لكل زبون ($)</label>
                      <input 
                        type="number" 
                        value={editParams.amount || ''} 
                        onChange={e => setEditParams({ ...editParams, amount: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-xl border-gray-200 bg-white shadow-sm text-sm p-3 border"
                        placeholder="مثال: 5"
                      />
                    </div>
                  )}

                  {editKind === 'tiered_threshold' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 font-medium">المستهدف / الحد الأدنى ($)</label>
                        <input 
                          type="number" 
                          value={editParams.threshold || ''} 
                          onChange={e => setEditParams({ ...editParams, threshold: parseFloat(e.target.value) })}
                          className="mt-1 block w-full rounded-xl border-gray-200 bg-white shadow-sm text-sm p-3 border"
                          placeholder="مثال: 500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 font-medium">المكافأة فوق المستهدف ($)</label>
                        <input 
                          type="number" 
                          value={editParams.bonus_above || ''} 
                          onChange={e => setEditParams({ ...editParams, bonus_above: parseFloat(e.target.value) })}
                          className="mt-1 block w-full rounded-xl border-gray-200 bg-white shadow-sm text-sm p-3 border"
                          placeholder="مثال: 50"
                        />
                      </div>
                    </div>
                  )}

                  {editKind === 'manual' && (
                    <div>
                      <label className="block text-xs text-gray-600 font-medium">الحافز الثابت المفترض ($)</label>
                      <input 
                        type="number" 
                        value={editParams.default_bonus || ''} 
                        onChange={e => setEditParams({ ...editParams, default_bonus: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-xl border-gray-200 bg-white shadow-sm text-sm p-3 border"
                        placeholder="مثال: 100"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t mt-4">
                  <button 
                    onClick={handleSave}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                  >
                    حفظ التغييرات وإعادة الحساب
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
