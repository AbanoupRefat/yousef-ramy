import React, { useState, useEffect } from 'react';
import { Staff, BonusType, BonusKind } from '../../shared/domain/entities';
import { UpdateBonusType } from '../application/UpdateBonusType';
import { ComputeBonus } from '../application/ComputeBonus';
import { IStaffRepo, IBonusTypeRepo } from '../application/interfaces';

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
  const [currentBonusType, setCurrentBonusType] = useState<BonusType | null>(null);
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
        setCurrentBonusType(bType || null);
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
      // Use today's date for demo moment
      const bonus = await computeBonusUseCase.execute(sId, new Date(), new Date());
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
      await loadData(); // reload everything
      alert('Bonus configuration updated!');
    } catch (e: any) {
      alert(`Error updating bonus: ${e.message}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Bonus Configuration</h2>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 border-r pr-4">
          <h3 className="font-medium text-gray-700 mb-4">Staff Members</h3>
          <ul className="space-y-2">
            {staffList.map(s => (
              <li 
                key={s.id} 
                className={`p-3 rounded cursor-pointer border ${selectedStaffId === s.id ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                onClick={() => setSelectedStaffId(s.id)}
              >
                <div className="font-bold">{s.name}</div>
                <div className="text-sm text-gray-500">Role: {s.role}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-2 pl-2">
          {!selectedStaffId ? (
            <p className="text-gray-500 italic mt-4">Select a staff member to configure their bonus.</p>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-blue-800 uppercase tracking-wide">Live Demo Output</h4>
                  <p className="text-xs text-blue-600 mt-1">Based on today's transactions</p>
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  ${computedBonus !== null ? computedBonus.toFixed(2) : '---'}
                </div>
              </div>

              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-4">
                <h3 className="text-lg font-medium border-b pb-2">Edit Strategy</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Kind</label>
                  <select 
                    value={editKind} 
                    onChange={e => {
                      setEditKind(e.target.value as BonusKind);
                      setEditParams({}); // reset params on type change
                    }}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    <option value="percentage_commission">Percentage Commission</option>
                    <option value="flat_per_customer">Flat per Customer</option>
                    <option value="tiered_threshold">Tiered Threshold</option>
                    <option value="manual">Manual / Fixed</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Parameters</h4>
                  
                  {editKind === 'percentage_commission' && (
                    <div>
                      <label className="block text-xs text-gray-500">Percent (%)</label>
                      <input 
                        type="number" 
                        value={editParams.percent || ''} 
                        onChange={e => setEditParams({ ...editParams, percent: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                      />
                    </div>
                  )}

                  {editKind === 'flat_per_customer' && (
                    <div>
                      <label className="block text-xs text-gray-500">Amount per customer ($)</label>
                      <input 
                        type="number" 
                        value={editParams.amount || ''} 
                        onChange={e => setEditParams({ ...editParams, amount: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                      />
                    </div>
                  )}

                  {editKind === 'tiered_threshold' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500">Revenue Threshold ($)</label>
                        <input 
                          type="number" 
                          value={editParams.threshold || ''} 
                          onChange={e => setEditParams({ ...editParams, threshold: parseFloat(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500">Bonus Above Threshold ($)</label>
                        <input 
                          type="number" 
                          value={editParams.bonus_above || ''} 
                          onChange={e => setEditParams({ ...editParams, bonus_above: parseFloat(e.target.value) })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                        />
                      </div>
                    </div>
                  )}

                  {editKind === 'manual' && (
                    <div>
                      <label className="block text-xs text-gray-500">Default Fixed Bonus ($)</label>
                      <input 
                        type="number" 
                        value={editParams.default_bonus || ''} 
                        onChange={e => setEditParams({ ...editParams, default_bonus: parseFloat(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t mt-4">
                  <button 
                    onClick={handleSave}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Save & Recalculate
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
