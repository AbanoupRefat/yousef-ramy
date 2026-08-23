# Design Polish Phase — Agent Prompt

Read this fully before starting. The core queue system is functionally complete.
This phase applies a professional visual design to all screens using a proven
design system extracted from a barber booking template.

## Design System (Extract from Figma: BARBER-BOOKING-APP)

### Color Palette
- **Primary**: Dark Purple `#3B2C5F` (buttons, headers, active states)
- **Secondary**: Light Purple `#F3E8FF` (backgrounds, card hover states)
- **Accent**: Gold/Orange `#F59E0B` (highlights, badges, "your turn" state)
- **Text**: White `#FFFFFF` (on dark backgrounds), Dark Gray `#1F2937` (on light)
- **Success**: Green `#10B981` (confirmations, checkmarks)
- **Neutral**: Light Gray `#F9FAFB` (card backgrounds)

### Typography
- **Header**: Bold, 24-28px, white on dark purple
- **Body**: Regular, 14-16px, high contrast
- **CTA Button**: Bold, 16px, white text, full-width or prominent
- **Labels**: Regular, 12-14px, uppercase tracking

### Components
- **Buttons**: Full-width or prominent, rounded corners (8px), dark purple background
- **Cards**: White or light purple background, subtle shadow, rounded corners (12px)
- **Inputs**: Light purple background, dark text, rounded corners (8px)
- **Icons**: Consistent 24-32px size, filled or outlined style
- **Spacing**: 16px grid, generous whitespace

---

## Screens to Polish

### 1. customer-web: JoinQueueScreen

**Current State**: Basic form with service/staff dropdowns

**Target Design** (adapt from Figma "Active Booking" flow):

```
┌─────────────────────────────────────┐
│  ◯ Barber Queue                     │  (header: dark purple bg, white text)
├─────────────────────────────────────┤
│                                     │
│  Select Service                     │  (label: 12px uppercase)
│  ┌─────────────────────────────────┐│
│  │ [Buzz]  [Fade]  [Full Groom]   ││  (pill/tag buttons, gray bg, toggle selection)
│  │ [Beard] [Line-up]              ││
│  └─────────────────────────────────┘│
│                                     │
│  Select Your Hero                   │  (label: 12px uppercase)
│  ┌─────────────────────────────────┐│
│  │ 👤 Yousef                       ││  (card: white bg, shadow, rounded)
│  │    Haircut: 2 ahead             ││
│  │    ETA: ~10 min                 ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 👤 Ramy                         ││
│  │    Haircut: 5 ahead             ││
│  │    ETA: ~25 min                 ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ ▶ Next Available                ││  (auto-assign to shortest queue)
│  │    (Fastest option)             ││
│  └─────────────────────────────────┘│
│                                     │
│  Your Phone Number                  │  (label: 12px uppercase)
│  ┌─────────────────────────────────┐│
│  │ +20 1 0 1 2 3 4 5 6 7 8         ││  (input: light purple bg)
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │   RESERVE YOUR SPOT             ││  (button: full-width, gold accent on hover)
│  └─────────────────────────────────┘│
│                                     │
│  [IF RESERVATIONS CLOSED]:          │
│  ┌─────────────────────────────────┐│
│  │ ⏸ Reservations Temporarily      ││
│  │   Closed                        ││
│  │                                 ││
│  │ Walk-ins still welcome!         ││
│  │ Please visit us in person       ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Implementation**:
- Service pickers: use pill/tag components (light gray, toggle to dark purple on select)
- Hero cards: stack vertically, show photo (placeholder ok), current depth, ETA
- "Next Available" card with special styling (accent color)
- Phone input: formatted, easy to use on mobile
- Main button: full-width, dark purple, white text, 48px height (thumb-friendly)
- When closed: show full-screen overlay with calm messaging, no form visible

---

### 2. customer-web: TrackTicketScreen

**Current State**: Text showing position and ETA

**Target Design** (adapt from Figma "Service Finished" confirmation):

**WAITING STATE** (position > 0):
```
┌─────────────────────────────────────┐
│  ◯ Tracking Your Spot               │  (header: dark purple bg)
├─────────────────────────────────────┤
│                                     │
│            ◯                        │  (large icon, 64px, light purple bg circle)
│                                     │
│  You are #3 in line                 │  (28px bold, dark text)
│                                     │
│  ⏱ ~15 minutes                      │  (20px, accent gold color, slightly larger)
│                                     │
│  ─────────────────────────────────  │  (divider)
│                                     │
│  👤 Yousef                          │  (barber info card)
│  Haircut Specialist                 │
│  Master piece Barbershop            │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📍 Master piece Barbershop         │  (location: optional, simple)
│  Giza, Egypt                        │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  REFRESH STATUS                 ││  (button: secondary style, light purple)
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │  CLOSE RESERVATION              ││  (button: text only, or subtle style)
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**READY STATE** (position = 0, auto-triggered):
```
┌─────────────────────────────────────┐
│  [Back] Your Turn!                  │  (header: close button)
├─────────────────────────────────────┤
│                                     │
│            ✓                        │  (large checkmark, 80px, green, animated bounce)
│                                     │
│  IT'S YOUR TURN!                    │  (32px bold, dark text)
│                                     │
│  Please head to the                 │  (18px, gray text)
│  barber chair now                   │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  👤 Yousef is ready for you         │  (confirmation text)
│  Service: Haircut                   │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  I'M ON MY WAY                  ││  (primary button, gold/accent, bold)
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │  CANCEL RESERVATION             ││  (secondary button, text-only red)
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**Implementation**:
- Use pill/badge icons (light purple circles as backgrounds for icons)
- ETA text: larger, accent color (gold), prominent
- Smooth realtime updates: fade in/out position changes
- Checkmark animation: bounce/pulse when transitioning to "your turn"
- All buttons: full-width or prominent, touch-friendly sizes

---

### 3. desktop-reporter: QueueManagementScreen

**Current State**: Basic list with toggle and manual form

**Target Design** (adapt from Figma list + admin layout):

```
┌──────────────────────────────────────────────────┐
│  Queue Management                                │  (header: dark purple)
├──────────────────────────────────────────────────┤
│                                                  │
│  🔴 Accepting Remote Reservations                │  (toggle: ON/OFF, red when OFF)
│  [━━━●] TOGGLE SWITCH                            │  (animated toggle)
│                                                  │
│  ─────────────────────────────────────────────   │
│                                                  │
│  Yousef's Queue (3 waiting, 1 being served)      │  (hero section header)
│                                                  │
│  WITH HERO:                                      │  (subheader)
│  ┌──────────────────────────────────────────┐   │
│  │ ▶ Ahmed - 201012345678                   │   │  (card: in-progress state, accent)
│  │   Haircut | Started 5 min ago            │   │
│  │ [⋮ Menu]  [Complete Receipt]             │   │  (actions)
│  └──────────────────────────────────────────┘   │
│                                                  │
│  WAITING:                                        │ (subheader)
│  ┌──────────────────────────────────────────┐   │
│  │ 1. Sara - 201087654321                   │   │  (card: draggable indicator ≡)
│  │    Fade | Added 8 min ago                │   │
│  │ [↑ ↓ ⋮]                                  │   │  (reorder buttons)
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 2. Omar - 201056789012                   │   │
│  │    Full Grooming | Added 3 min ago      │   │
│  │ [↑ ↓ ⋮]                                  │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │ 3. Fatima - 201098765432                 │   │
│  │    Beard Trim | Added 1 min ago          │   │
│  │ [↑ ↓ ⋮]                                  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  [+ ADD VIP / MANUAL BOOKING]                    │  (button: secondary, below list)
│                                                  │
│  ─────────────────────────────────────────────   │
│                                                  │
│  Ramy's Queue (1 waiting, 1 being served)        │  (repeat for other heroes)
│  ...                                             │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Implementation**:
- Toggle switch: animated, color-coded (green when on, red when off)
- Cards: clear visual hierarchy (with hero = accent color, waiting = neutral)
- Reorder buttons: up/down arrows, or drag handle (≡) on left
- Menu button (⋮): dropdown for remove/edit/notes
- "Add VIP" button: secondary style, below list
- Drag-and-drop: optional, up/down buttons as fallback

---

### 4. desktop-reporter: ReceiptEntryScreen

**Current State**: Form with product selector

**Target Design** (apply consistent styling):

```
┌──────────────────────────────────────────────────┐
│  Complete & Record                               │  (header: dark purple)
├──────────────────────────────────────────────────┤
│                                                  │
│  Current Customer                                │  (section label)
│  ┌──────────────────────────────────────────┐   │
│  │ Ahmed - 201012345678                     │   │  (card: info display)
│  │ Haircut | Started 5 min ago              │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Amount ($)                                      │  (input label)
│  ┌──────────────────────────────────────────┐   │
│  │ 200                                      │   │  (large, easy to read)
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Tip ($)                                         │
│  ┌──────────────────────────────────────────┐   │
│  │ 20                                       │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Products Used                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ Pomade (Stock: 3) ⚠️ LOW STOCK           │   │  (orange warning badge)
│  │ Qty: [1]                                 │   │
│  └──────────────────────────────────────────┘   │
│  [+ Add Another Product]                        │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  COMPLETE & RECORD                      ││  (primary button: full-width)
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Implementation**:
- Low-stock badge: orange, visible at a glance
- Card layout: consistent with other screens
- Button: large, prominent, hard to miss
- Inputs: light purple background, clear spacing

---

### 5. desktop-reporter: DailyReportScreen

**Current State**: Text-based summary

**Target Design** (card-based dashboard):

```
┌──────────────────────────────────────────────────┐
│  Daily Report                                    │  (header: dark purple)
├──────────────────────────────────────────────────┤
│                                                  │
│  Today's Summary                                 │  (section label)
│                                                  │
│  ┌─────────────────┬─────────────────────────┐  │
│  │ 💰 Income       │ 2,450 EGP              │  │  (metrics: cards)
│  │ 📊 Transactions │ 12 customers           │  │
│  │ 💸 Expenses     │ -500 EGP               │  │
│  │ 🎁 Bonuses      │ -350 EGP               │  │
│  │ ✓ Net Total     │ 1,600 EGP              │  │  (bold, accent color)
│  └─────────────────┴─────────────────────────┘  │
│                                                  │
│  Breakdown by Staff                              │  (section label)
│                                                  │
│  👤 Yousef                                       │  (staff card)
│  ┌──────────────────────────────────────────┐   │
│  │ Income:        1,200 EGP                 │   │
│  │ Transactions:  6                         │   │
│  │ Bonus (10%):   120 EGP                   │   │  (bonus: accent color)
│  │ Net:           1,080 EGP                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  👤 Ramy                                         │
│  ┌──────────────────────────────────────────┐   │
│  │ Income:        1,250 EGP                 │   │
│  │ Transactions:  6                         │   │
│  │ Bonus (10%):   125 EGP                   │   │
│  │ Net:           1,125 EGP                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  Expenses Breakdown                              │
│  ┌──────────────────────────────────────────┐   │
│  │ Rent:         300 EGP                    │   │
│  │ Supplies:     150 EGP                    │   │
│  │ Salaries:     50 EGP                     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  EXPORT REPORT (CSV)                     │   │  (secondary button)
│  └──────────────────────────────────────────┘   │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Implementation**:
- Metric cards: grid layout, white background, shadow, rounded
- Staff sections: collapsible or expandable
- Accent colors: gold for positive metrics, red for expenses
- Export button: secondary style

---

## Implementation Steps (in order)

1. **Color tokens**: Update all CSS/Tailwind config to use the palette above
2. **Button components**: Create standardized button styles (primary, secondary, text-only)
3. **Card components**: Create reusable card wrapper with consistent shadow/rounded corners
4. **Spacing/layout**: Apply 16px grid, consistent padding (16px or 24px)
5. **JoinQueueScreen**: Redesign with new colors, card layouts, pill selectors
6. **TrackTicketScreen**: Redesign with checkmark animation, larger ETA display
7. **QueueManagementScreen**: Add toggle, reorder buttons, card styling
8. **ReceiptEntryScreen**: Apply card styling, highlight low-stock badges
9. **DailyReportScreen**: Build card-based dashboard layout
10. **Polish**: animations, hover states, focus states on inputs/buttons

## Notes

- All screens should be **mobile-first** (both apps are mobile-view)
- Use Tailwind v4 for styling (already installed in both apps)
- Animate transitions: position changes, status updates, modal opens (smooth 300ms)
- Ensure contrast ratios meet WCAG AA (text readable on all backgrounds)
- Test on actual mobile devices (iPhone + Android) before marking done

## Definition of Done

All screens match the designs above in:
- ✅ Color palette
- ✅ Typography (sizing, weight)
- ✅ Component layouts (cards, buttons, inputs)
- ✅ Spacing and alignment
- ✅ Icons and visual hierarchy
- ✅ Responsive behavior on mobile
- ✅ Smooth animations/transitions
- ✅ Accessible (WCAG AA)

Proceed when ready, and append a /memory.md entry noting which screens were redesigned.
