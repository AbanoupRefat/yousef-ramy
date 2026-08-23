import { supabase } from './SupabaseClient';

export async function runSeedDataIfLocal() {
  if (import.meta.env.VITE_SUPABASE_ENV !== 'local') {
    return;
  }

  // TODO: Replace with real staff/services list when provided by client.
  console.log('Running local seed data script...');

  // Check if we need to seed bonus types
  const { data: bonusTypes } = await supabase.from('bonus_types').select('id');
  if (!bonusTypes || bonusTypes.length === 0) {
    console.log('Seeding bonus_types...');
    await supabase.from('bonus_types').insert([
      { name: 'Standard Commission', kind: 'percentage_commission', params: { percent: 10 } },
      { name: 'Flat Rate', kind: 'flat_per_customer', params: { amount: 5 } }
    ]);
  }

  // Seed Staff
  const { data: staff } = await supabase.from('staff').select('id');
  if (!staff || staff.length === 0) {
    console.log('Seeding staff...');
    const { data: bTypes } = await supabase.from('bonus_types').select('id');
    const b1 = bTypes?.[0]?.id;
    const b2 = bTypes?.[1]?.id || b1;

    if (b1) {
      await supabase.from('staff').insert([
        { name: 'John Hero', role: 'hero', bonus_type_id: b1 },
        { name: 'Mike Hero', role: 'hero', bonus_type_id: b2 }
      ]);
    }
  }

  // Seed Services
  const { data: services } = await supabase.from('services').select('id');
  if (!services || services.length === 0) {
    console.log('Seeding services...');
    await supabase.from('services').insert([
      { name: 'Buzz Cut' },
      { name: 'Fade' },
      { name: 'Full Grooming' }
    ]);
  }

  // Seed Products
  const { data: products } = await supabase.from('products').select('id');
  if (!products || products.length === 0) {
    console.log('Seeding products...');
    await supabase.from('products').insert([
      { name: 'Pomade', stock_qty: 10, low_stock_threshold: 5, unit_cost: 8, sale_price: 15 },
      { name: 'Shave Gel', stock_qty: 4, low_stock_threshold: 5, unit_cost: 5, sale_price: 10 },
      { name: 'Aftershave', stock_qty: 20, low_stock_threshold: 5, unit_cost: 12, sale_price: 20 }
    ]);
  }

  console.log('Local seed data complete.');
}
