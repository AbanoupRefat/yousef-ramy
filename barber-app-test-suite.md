# Barber Queue System — Automated Test Suite

Run these in order. Each test validates a specific piece of the system. If any fail, note the failure and the step at which it broke.

---

## Test 1: Queue Ticket Creation & ETA Calculation

**Objective**: Verify that joining the queue creates a ticket and calculates ETA correctly.

```bash
# Setup: Ensure a hero "Yousef" exists with service "Haircut"
# that has a rolling_avg_seconds of ~1200 (20 min)

POST /api/queue/join
Body:
{
  "phoneNumber": "201012345678",
  "serviceId": "haircut-id",
  "staffId": "yousef-id"
}

Expected Response:
{
  "ticketId": "ticket-uuid",
  "position": 0,
  "etaSeconds": 1200,
  "status": "waiting"
}

# Verify in Supabase:
SELECT * FROM queue_tickets WHERE phone_number = '201012345678';
-- Should have status='waiting', position=0
```

---

## Test 2: Auto-Advance on Receipt Entry

**Objective**: Verify that completing a receipt auto-advances the next waiting ticket.

```bash
# Setup: Create 3 tickets in Yousef's queue (positions 0, 1, 2)
# Then complete position 0's receipt

POST /api/queue/complete-and-advance
Body:
{
  "ticketId": "position-0-ticket-id",
  "staffId": "yousef-id",
  "amount": 200,
  "tip": 20,
  "serviceId": "haircut-id"
}

Expected Behavior:
- position 0 ticket → status='done'
- position 1 ticket → status='with_hero', position=0
- position 2 ticket → status='waiting', position=1

# Verify in Supabase:
SELECT id, status, position FROM queue_tickets 
WHERE staff_id = 'yousef-id' 
ORDER BY position;

-- Should show:
-- ticket-1: done, (position NULL)
-- ticket-2: with_hero, 0
-- ticket-3: waiting, 1
```

---

## Test 3: EMA Calculation on Duration

**Objective**: Verify rolling average updates based on actual service duration.

```bash
# Setup: 
# - Create ticket, note created_at = T0
# - Wait 30 seconds (simulating actual service)
# - Complete receipt at T0+30

POST /api/queue/complete-and-advance
Body:
{
  "ticketId": "ticket-uuid",
  "staffId": "yousef-id",
  "serviceId": "haircut-id",
  "amount": 200
}

# Query staff_service_durations before and after:
SELECT rolling_avg_seconds, sample_count 
FROM staff_service_durations 
WHERE staff_id = 'yousef-id' AND service_id = 'haircut-id';

Expected: 
- rolling_avg_seconds changes from old_avg to 
  (0.3 * 30 + 0.7 * old_avg)
- sample_count increments by 1
```

---

## Test 4: Manual Reservation at Specific Position

**Objective**: Verify admin can inject a ticket at any position.

```bash
# Setup: Queue has 3 waiting tickets at positions 0, 1, 2

POST /api/admin/create-manual-reservation
Body:
{
  "staffId": "yousef-id",
  "serviceId": "haircut-id",
  "position": 1,
  "phoneNumber": "201087654321"
}

Expected Behavior:
- New ticket created at position 1
- Old position 1 ticket → position 2
- Old position 2 ticket → position 3

# Verify in Supabase:
SELECT id, phone_number, position FROM queue_tickets 
WHERE staff_id = 'yousef-id' 
ORDER BY position;
```

---

## Test 5: Queue Reordering (Swap Two Tickets)

**Objective**: Verify admin can drag/reorder tickets.

```bash
# Setup: Queue has tickets at positions 0, 1, 2

POST /api/admin/reorder-queue
Body:
{
  "staffId": "yousef-id",
  "ticketId": "position-2-ticket-id",
  "newPosition": 0
}

Expected Behavior:
- Target ticket moves to position 0
- Old position 0 ticket → position 1
- Old position 1 ticket → position 2

# Verify in Supabase:
SELECT id, position FROM queue_tickets 
WHERE staff_id = 'yousef-id' 
ORDER BY position;
```

---

## Test 6: Block Remote Reservations Toggle

**Objective**: Verify admin can disable customer web access to the queue.

```bash
# Step 1: Check current setting
GET /api/admin/shop-settings

# Step 2: Toggle off
POST /api/admin/toggle-queue-acceptance
Body:
{
  "accepting": false
}

Expected Response:
{
  "queueAcceptingRemote": false
}

# Verify in Supabase:
SELECT queue_accepting_remote FROM shop_settings;
-- Should be false

# Step 3: Attempt to join queue (should fail or return error)
POST /api/queue/join
Body:
{
  "phoneNumber": "201012345678",
  "serviceId": "haircut-id",
  "staffId": "yousef-id"
}

Expected Response:
{
  "error": "Reservations are currently closed"
}

# Step 4: Toggle back on
POST /api/admin/toggle-queue-acceptance
Body:
{
  "accepting": true
}
```

---

## Test 7: Realtime Subscription Updates

**Objective**: Verify Supabase Realtime pushes position/ETA changes to subscribed clients.

```bash
# Setup:
# 1. Open customer-web in browser A, join queue (position 0)
# 2. Open customer-web in browser B, join queue (position 1)
# 3. Open desktop-reporter in browser C

# Step 1: Note position/ETA in both web browsers

# Step 2: In desktop-reporter, complete position 0's receipt
POST /api/queue/complete-and-advance
Body:
{
  "ticketId": "browser-A-ticket-id",
  "staffId": "yousef-id",
  "amount": 200
}

# Step 3: Observe both browsers
Expected:
- Browser A shows "It's Your Turn!" (position became 0, status became with_hero)
- Browser B shows position=0 and updated ETA (position went from 1 to 0)

# If updates don't appear instantly, check:
# - Supabase Realtime is enabled on queue_tickets table
# - customer-web is subscribed to the right channel
```

---

## Test 8: Multiple Heroes, Load Balancing

**Objective**: Verify that customers are assigned to the hero with the shortest queue.

```bash
# Setup: 
# Hero 1 (Yousef): queue depth = 3
# Hero 2 (Ramy): queue depth = 1
# Both have service "Haircut"

POST /api/queue/join
Body:
{
  "phoneNumber": "201012345678",
  "serviceId": "haircut-id",
  "staffId": null  # Request "next available"
}

Expected:
- New ticket assigned to Ramy (Hero 2, shorter queue)
- position = 1 (since Ramy already has 1 ticket)

# Verify in Supabase:
SELECT id, staff_id, position FROM queue_tickets 
WHERE phone_number = '201012345678';
-- Should show staff_id = 'ramy-id', position = 1
```

---

## Test 9: Edge Case — Negative Stock (Product Usage)

**Objective**: Verify that product stock doesn't go negative.

```bash
# Setup: Product "Pomade" has stock_qty = 2

# Create 3 receipts, each using 1 Pomade
POST /api/receipts/record-transaction
Body:
{
  "staffId": "yousef-id",
  "serviceId": "haircut-id",
  "amount": 200,
  "products": [
    { "productId": "pomade-id", "quantityUsed": 1 }
  ]
}

# Repeat 2 more times

# After 3rd receipt:
SELECT stock_qty FROM products WHERE id = 'pomade-id';

Expected:
- stock_qty = 0 (not negative)

# If system allowed 4th usage to go negative:
# - BUG: needs validation in RecordProductUsage
```

---

## Test 10: Bonus Calculation Live-Switch

**Objective**: Verify bonuses recalculate instantly when admin changes bonus type.

```bash
# Setup:
# - Yousef has 3 receipts totaling 600 EGP revenue
# - Current bonus type: flat_per_customer (20 per head = 60 total)

GET /api/admin/daily-report

Expected Bonus:
{
  "yousef": { "bonusAmount": 60, "type": "flat_per_customer" }
}

# Step 2: Switch Yousef to percentage_commission (10%)
POST /api/admin/update-bonus-type
Body:
{
  "staffId": "yousef-id",
  "bonusTypeId": "new-commission-type-id"
}

# Step 3: Check report again
GET /api/admin/daily-report

Expected Bonus:
{
  "yousef": { "bonusAmount": 60, "type": "percentage_commission" }
  # Same result since 10% * 600 = 60, but formula changed
}

# Step 4: Switch to tiered (threshold 1000, bonus 100 above)
# Since revenue is only 600, bonus should drop to 0

POST /api/admin/update-bonus-type
Body:
{
  "staffId": "yousef-id",
  "bonusTypeId": "tiered-type-id"
}

GET /api/admin/daily-report

Expected Bonus:
{
  "yousef": { "bonusAmount": 0, "type": "tiered_threshold" }
}
```

---

## Test 11: Concurrent Ticket Joins (Stress)

**Objective**: Verify system handles multiple simultaneous queue joins correctly.

```bash
# Run this in parallel (e.g., with curl -X POST in a loop or Jest parallel tests):

for i in {1..10}; do
  curl -X POST http://localhost:3000/api/queue/join \
    -H "Content-Type: application/json" \
    -d "{
      \"phoneNumber\": \"201000000${i}\",
      \"serviceId\": \"haircut-id\",
      \"staffId\": \"yousef-id\"
    }"
done

# Verify no position collisions in Supabase:
SELECT position, COUNT(*) as count FROM queue_tickets 
WHERE staff_id = 'yousef-id' AND status = 'waiting'
GROUP BY position
HAVING COUNT(*) > 1;

Expected:
- No rows (each position should be unique)
- 10 new tickets created with positions 0-9
```

---

## Test 12: Expiry / Timeout Handling

**Objective**: Verify old tickets don't stay in queue forever if customer doesn't show.

```bash
# Setup: Define a "timeout" threshold (e.g., 60 min without status change)

# Create a ticket and manually set created_at to 61 minutes ago:
INSERT INTO queue_tickets 
(id, staff_id, status, position, phone_number, created_at)
VALUES 
('old-ticket-id', 'yousef-id', 'waiting', 0, '201099999999', now() - interval '61 minutes');

# Run a cleanup job (if implemented):
POST /api/admin/cleanup-expired-tickets

# Expected:
# - old ticket marked as 'expired' or 'no-show'
# - OR removed from queue

# Verify in Supabase:
SELECT status FROM queue_tickets WHERE id = 'old-ticket-id';
-- Should be 'no-show' or deleted
```

---

## Test 13: Service Duration Variation (Multiple Services)

**Objective**: Verify ETA is correct for different services with different durations.

```bash
# Setup:
# - Service "Buzz": rolling_avg = 600 sec (10 min)
# - Service "Full Grooming": rolling_avg = 1800 sec (30 min)

# Ticket A: Buzz, position 2
GET /api/queue/status/ticket-A-id

Expected ETA:
{
  "position": 2,
  "etaSeconds": 1200,  # 2 * 600
  "service": "Buzz"
}

# Ticket B: Full Grooming, position 2
GET /api/queue/status/ticket-B-id

Expected ETA:
{
  "position": 2,
  "etaSeconds": 3600,  # 2 * 1800
  "service": "Full Grooming"
}
```

---

## Test 14: Inventory Low-Stock Flag

**Objective**: Verify products near low_stock_threshold are flagged.

```bash
# Setup:
# - Product "Cream": stock = 3, low_stock_threshold = 5

GET /api/inventory/status

Expected:
{
  "products": [
    {
      "id": "cream-id",
      "name": "Cream",
      "stock": 3,
      "lowStockThreshold": 5,
      "isLowStock": true  # Should be flagged
    }
  ]
}

# Verify in desktop-reporter Receipt Entry screen:
# - When selecting "Cream" product, it should show a red/warning badge
```

---

## Test 15: Expense Recording & P&L Reconciliation

**Objective**: Verify expenses subtract correctly from daily net.

```bash
# Setup:
# - Income (receipts): 1000 EGP
# - Bonuses: 100 EGP
# - Expected Net before expenses: 900 EGP

# Record an expense:
POST /api/expenses/record
Body:
{
  "description": "Rent",
  "amount": 300,
  "category": "rent"
}

GET /api/admin/daily-report

Expected:
{
  "income": 1000,
  "expenses": 300,
  "bonuses": 100,
  "netTotal": 600  # 1000 - 300 - 100
}
```

---

## Running the Tests

### Option 1: Manual Testing (for now)
Run each test step-by-step, verify the expected outcome in Supabase Table Editor or API response.

### Option 2: Automated (Future)
Convert these to Jest/Supertest or Cypress tests:

```bash
# Backend API tests (Node.js)
npm test -- tests/queue.test.ts

# Customer-web E2E tests (Cypress)
npm run cypress:run --spec "tests/e2e/queue-flow.cy.ts"

# Desktop-reporter tests
npm test -- tests/admin-queue.test.ts
```

---

## What to Do If Tests Fail

1. **Note the test number and step**
2. **Check Supabase logs** for SQL errors
3. **Check browser console** for JS errors
4. **Check realtime** — did the Supabase Realtime subscription break?
5. **Roll back the last commit** if a recent change broke it

Once all 15 pass, you have a system ready to show the barber.
