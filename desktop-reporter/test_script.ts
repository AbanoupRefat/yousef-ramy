(globalThis as any).import = { meta: { env: { 
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
} } };
import { 
  PostgresQueueTicketRepo, 
  PostgresStaffServiceDurationRepo, 
  PostgresShopSettingsRepo,
  PostgresStaffRepo,
  PostgresServiceRepo
} from './src/infrastructure/PostgresRepos';
import { QueueManagementUseCases } from './src/application/QueueManagementUseCases';
import { CompleteAndAdvance } from './src/application/CompleteAndAdvance';
import { supabase } from './src/infrastructure/SupabaseClient';

async function runTests() {
  const ticketRepo = new PostgresQueueTicketRepo();
  const settingsRepo = new PostgresShopSettingsRepo();
  const durationRepo = new PostgresStaffServiceDurationRepo();
  const staffRepo = new PostgresStaffRepo();
  const serviceRepo = new PostgresServiceRepo();
  const queueUseCases = new QueueManagementUseCases(ticketRepo, settingsRepo, durationRepo);
  const completeAndAdvance = new CompleteAndAdvance(ticketRepo, durationRepo);

  console.log("Fetching staff and services...");
  const staffList = await staffRepo.getAll();
  const yousef = staffList.find(s => s.name === 'Yousef');
  
  const servicesList = await serviceRepo.getAll();
  const haircut = servicesList[0]; // Just pick the first service

  if (!yousef || !haircut) throw new Error("Missing Yousef or Service");

  // Ensure accepting remote is true before we start
  await queueUseCases.toggleQueueAcceptance(true);

  console.log(`\n--- TEST 1: Join Queue ---`);
  const ticket1 = await queueUseCases.joinQueue(null, haircut.id, yousef.id, '201012345678');
  console.log("Joined queue. Ticket1:", ticket1.id, "Position:", ticket1.position);
  
  const status1 = await queueUseCases.getQueueStatus(ticket1.id);
  console.log("Status1:", status1);
  if (status1.position !== 0 || status1.status !== 'waiting') {
    console.error("TEST 1 FAILED!");
  } else {
    console.log("TEST 1 PASSED!");
  }

  console.log(`\n--- TEST 2 & 3: Auto-Advance & EMA ---`);
  // Add another ticket to test auto-advance
  const ticket2 = await queueUseCases.joinQueue(null, haircut.id, yousef.id, '201012345679');
  console.log("Joined queue. Ticket2:", ticket2.id, "Position:", ticket2.position);
  
  // Set ticket1 to with_hero to simulate it being the active one
  ticket1.status = 'with_hero';
  await ticketRepo.update(ticket1);

  // Simulate duration by overriding joinedAt
  ticket1.joinedAt = new Date(Date.now() - 30 * 1000); // 30 seconds ago
  await supabase.from('queue_tickets').update({ joined_at: ticket1.joinedAt.toISOString() }).eq('id', ticket1.id);

  console.log("Completing ticket 1...");
  await completeAndAdvance.execute(ticket1.id);

  const t1Done = await ticketRepo.getById(ticket1.id);
  const t2Advanced = await ticketRepo.getById(ticket2.id);

  console.log("Ticket 1 new status:", t1Done?.status);
  console.log("Ticket 2 new status:", t2Advanced?.status, "Position:", t2Advanced?.position);

  if (t1Done?.status === 'done' && t2Advanced?.status === 'with_hero') {
    console.log("TEST 2 PASSED!");
  } else {
    console.error("TEST 2 FAILED!");
  }

  const duration = await durationRepo.getDuration(yousef.id, haircut.id);
  console.log("New Duration EMA:", duration);
  if (duration && duration.rollingAvgSeconds > 0 && duration.sampleCount > 0) {
    console.log("TEST 3 PASSED!");
  } else {
    console.error("TEST 3 FAILED!");
  }

  console.log(`\n--- TEST 6: Admin Block Remote Reservations ---`);
  await queueUseCases.toggleQueueAcceptance(false);
  try {
    await queueUseCases.joinQueue(null, haircut.id, yousef.id, 'blocked');
    console.error("TEST 6 FAILED! Was able to join while closed.");
  } catch (e: any) {
    if (e.message === 'Reservations temporarily closed') {
      console.log("TEST 6 PASSED! Properly blocked.");
    } else {
      console.error("TEST 6 FAILED with unexpected error:", e);
    }
  }
  // Re-enable for further tests
  await queueUseCases.toggleQueueAcceptance(true);

  console.log(`\n--- TEST 4: Manual Reservation ---`);
  const ticket3 = await queueUseCases.joinQueue(null, haircut.id, yousef.id, 't3'); // pos 0 since t2 is with_hero, wait, t2 is with_hero so t3 is pos 0
  const ticket4 = await queueUseCases.joinQueue(null, haircut.id, yousef.id, 't4'); // pos 1
  
  console.log("Current queue:");
  let queue = await queueUseCases.getQueueForStaff(yousef.id);
  queue.forEach(q => console.log(`  Pos ${q.position}: ${q.id}`));

  console.log("Admin injecting manual reservation at position 1...");
  const manual = await queueUseCases.createManualReservation(yousef.id, haircut.id, 1, 'manual', null);

  queue = await queueUseCases.getQueueForStaff(yousef.id);
  console.log("New queue:");
  queue.forEach(q => console.log(`  Pos ${q.position}: ${q.id} (Phone: ${q.phoneNumber})`));
  
  if (queue[1].id === manual.id && queue[2].id === ticket4.id) {
    console.log("TEST 4 PASSED!");
  } else {
    console.error("TEST 4 FAILED!");
  }

  console.log(`\n--- TEST 5: Reordering ---`);
  console.log("Moving ticket at pos 2 to pos 0...");
  await queueUseCases.reorderQueue(yousef.id, ticket4.id, 0);
  
  queue = await queueUseCases.getQueueForStaff(yousef.id);
  console.log("Reordered queue:");
  queue.forEach(q => console.log(`  Pos ${q.position}: ${q.id} (Phone: ${q.phoneNumber})`));

  if (queue[0].id === ticket4.id && queue[1].id === ticket3.id && queue[2].id === manual.id) {
    console.log("TEST 5 PASSED!");
  } else {
    console.error("TEST 5 FAILED!");
  }

  process.exit(0);
}

runTests().catch(e => {
  console.error("Fatal Error:", e);
  process.exit(1);
});
