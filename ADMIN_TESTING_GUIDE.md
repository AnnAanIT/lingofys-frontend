# 🧪 Admin Menu Testing Guide

**Date:** December 20, 2025  
**Status:** Ready for Testing

---

## Quick Test (2 minutes)

### 1. Navigate to Admin Dashboard

```
URL: http://localhost:3000/#/admin/dashboard
Expected: Admin dashboard loads with sidebar visible
```

### 2. Test Toggle Button

```
Action: Click ☰ button (top-left)
Expected:
  - Sidebar smoothly collapses
  - Menu text disappears
  - Only icons visible
  - Content area expands
```

### 3. Test Toggle Again

```
Action: Click ☰ button (top-left)
Expected:
  - Sidebar smoothly expands
  - Menu text reappears
  - Content area shrinks back
  - Smooth 300ms transition
```

### 4. Test Notification Bell

```
Action: Click 🔔 button (top-right)
Expected:
  - Dropdown opens below bell
  - Shows "No notifications" message
  - Close button (X) visible
  - Dropdown has nice white background
```

### 5. Test Close Notification Center

```
Action: Click X button in notification header
Expected:
  - Notification dropdown closes
  - Content refreshes normal view
```

---

## Full Test Suite

### Test Group 1: Sidebar Toggle

#### Test 1.1: Open Sidebar

```
Initial State: Sidebar visible (256px)
Action: Click ☰ toggle button
Expected Result:
  ✓ Sidebar width changes smoothly
  ✓ Transition takes ~300ms
  ✓ Menu text disappears
  ✓ Icons remain visible
  ✓ Icon bar width: 80px
  ✓ Content margin adjusts
  ✓ No layout shift
Status: ____ (PASS/FAIL)
```

#### Test 1.2: Close Sidebar

```
Initial State: Sidebar collapsed (80px)
Action: Click ☰ toggle button
Expected Result:
  ✓ Sidebar width expands smoothly
  ✓ Text labels reappear
  ✓ Width becomes 256px again
  ✓ Content margin adjusts back
  ✓ Smooth transition animation
Status: ____ (PASS/FAIL)
```

#### Test 1.3: Toggle Multiple Times

```
Initial State: Any state
Action: Click ☰ button 5 times rapidly
Expected Result:
  ✓ Each toggle works smoothly
  ✓ No stuck states
  ✓ Animation completes properly
  ✓ No visual glitches
Status: ____ (PASS/FAIL)
```

### Test Group 2: Navigation with Collapsed Sidebar

#### Test 2.1: Click Menu Item (Expanded)

```
Initial State: Sidebar expanded (256px)
Action: Click "Users" in Operations menu
Expected Result:
  ✓ Navigate to /admin/users
  ✓ Correct page loads
  ✓ URL in browser updates
  ✓ Page content displays
Status: ____ (PASS/FAIL)
```

#### Test 2.2: Click Menu Item (Collapsed)

```
Initial State: Sidebar collapsed (80px)
Action: Click Users icon (hover shows "Users" tooltip)
Expected Result:
  ✓ Navigate to /admin/users
  ✓ Correct page loads
  ✓ Icons still clickable
  ✓ No need to expand sidebar
Status: ____ (PASS/FAIL)
```

#### Test 2.3: Menu Group Expansion

```
Initial State: Sidebar expanded
Action: Click "Operations" group header
Expected Result:
  ✓ Submenu expands with animation
  ✓ Shows: Users, Bookings, Messages, Homework
  ✓ ChevronRight → ChevronDown icon
  ✓ Child items appear with animation
Status: ____ (PASS/FAIL)
```

#### Test 2.4: Menu Group Collapse

```
Initial State: Operations group expanded
Action: Click "Operations" group header again
Expected Result:
  ✓ Submenu collapses smoothly
  ✓ Child items disappear
  ✓ ChevronDown → ChevronRight icon
  ✓ Smooth animation
Status: ____ (PASS/FAIL)
```

### Test Group 3: Notification Bell

#### Test 3.1: Open Notification Center

```
Initial State: No notifications showing
Action: Click 🔔 bell icon (top-right)
Expected Result:
  ✓ Dropdown appears below bell
  ✓ Smooth animation
  ✓ Shows "No notifications" message
  ✓ Nice white background (bg-white)
  ✓ Border and shadow visible
  ✓ Z-index above other elements
Status: ____ (PASS/FAIL)
```

#### Test 3.2: Close Notification Center

```
Initial State: Notification center open
Action: Click X button in header
Expected Result:
  ✓ Dropdown closes smoothly
  ✓ Bell returns to normal state
  ✓ Content area visible again
  ✓ No lag or flicker
Status: ____ (PASS/FAIL)
```

#### Test 3.3: Close by Clicking Bell Again

```
Initial State: Notification center open
Action: Click 🔔 bell again
Expected Result:
  ✓ Dropdown closes
  ✓ Acts as toggle
  ✓ Bell click opens/closes
Status: ____ (PASS/FAIL)
```

#### Test 3.4: Notification Badge Display

```
Initial State: Notification center closed
Action: Open browser developer tools, trigger notification (future feature)
Expected Result:
  ✓ Badge appears on bell with red background
  ✓ Shows notification count (e.g., "2")
  ✓ Badge positioned top-right
  ✓ Bold white text
  ✓ Updates when notifications change
Status: ____ (PASS/FAIL)
```

### Test Group 4: Responsive Design

#### Test 4.1: Mobile View (375px)

```
Device: iPhone 12 or Chrome DevTools 375px
Action: Open admin dashboard
Expected Result:
  ✓ Sidebar hidden by default
  ✓ Content takes full width
  ✓ ☰ toggle button visible
  ✓ 🔔 bell visible
  ✓ Click ☰ expands sidebar full screen
  ✓ Menu overlays content (fullscreen)
  ✓ No horizontal scroll
Status: ____ (PASS/FAIL)
```

#### Test 4.2: Tablet View (768px)

```
Device: iPad or Chrome DevTools 768px
Action: Open admin dashboard
Expected Result:
  ✓ Sidebar visible at 256px
  ✓ Content area visible
  ✓ Toggle button works
  ✓ Proper spacing maintained
  ✓ Everything readable
  ✓ No overlapping elements
Status: ____ (PASS/FAIL)
```

#### Test 4.3: Desktop View (1440px)

```
Device: Desktop or Chrome DevTools 1440px
Action: Open admin dashboard
Expected Result:
  ✓ Sidebar at 256px
  ✓ Content takes 1184px
  ✓ Toggle button works smoothly
  ✓ Collapse to 80px icon bar
  ✓ Content expands to 1360px
  ✓ All text readable
  ✓ Professional appearance
Status: ____ (PASS/FAIL)
```

#### Test 4.4: Landscape Mobile (568px width)

```
Device: iPhone landscape or Chrome DevTools 568px
Action: Open admin dashboard
Expected Result:
  ✓ Sidebar hidden
  ✓ Content takes full width
  ✓ Toggle works
  ✓ Notifications visible
  ✓ No horizontal scroll
Status: ____ (PASS/FAIL)
```

### Test Group 5: Visual Quality

#### Test 5.1: Colors & Contrast

```
Initial State: Admin dashboard open
Verify:
  ✓ Top bar white background clear
  ✓ Buttons have proper hover colors
  ✓ Icons are dark gray (readable)
  ✓ Border gray matches design
  ✓ Text is black/dark (good contrast)
Status: ____ (PASS/FAIL)
```

#### Test 5.2: Icons Display

```
Initial State: Admin dashboard open
Verify:
  ✓ ☰ Menu icon clear and visible
  ✓ 🔔 Bell icon clear and visible
  ✓ All sidebar icons visible
  ✓ All icons properly sized
  ✓ Icons align properly
Status: ____ (PASS/FAIL)
```

#### Test 5.3: Animations

```
Initial State: Admin dashboard open
Verify:
  ✓ Toggle animation smooth (300ms)
  ✓ No jerky movements
  ✓ No flicker
  ✓ Dropdown animates smoothly
  ✓ Runs at 60fps (no lag)
Status: ____ (PASS/FAIL)
```

#### Test 5.4: Spacing & Alignment

```
Initial State: Admin dashboard open
Verify:
  ✓ Padding consistent
  ✓ Margin consistent
  ✓ Elements properly aligned
  ✓ No weird gaps
  ✓ Professional appearance
Status: ____ (PASS/FAIL)
```

### Test Group 6: Functionality

#### Test 6.1: All Menu Items Clickable

```
Initial State: Sidebar collapsed
Action: Try clicking each menu icon
Expected Result:
  ✓ Dashboard icon → Dashboard page
  ✓ Users icon → Users page
  ✓ Bookings icon → Bookings page
  ✓ Messages icon → Messages page
  ✓ Revenue icon → Revenue page
  ✓ All other items work
Status: ____ (PASS/FAIL)
```

#### Test 6.2: Active State Indication

```
Initial State: On /admin/dashboard
Verify:
  ✓ Dashboard item highlighted (brand color)
  ✓ Other items normal color
  ✓ Navigate to different page
  ✓ Active state updates
  ✓ Previous page de-highlighted
Status: ____ (PASS/FAIL)
```

#### Test 6.3: Logout Button

```
Initial State: Admin dashboard open
Action: Click "Sign Out" button (bottom of sidebar)
Expected Result:
  ✓ Button has red hover color
  ✓ Click logs out
  ✓ Redirects to login page
  ✓ Session cleared
Status: ____ (PASS/FAIL)
```

#### Test 6.4: Navigation Persistence

```
Initial State: Collapsed sidebar
Action: Navigate between pages
Expected Result:
  ✓ Sidebar stays in collapsed state
  ✓ Toggle state persists (across pages)
  ✓ Can toggle on any page
Status: ____ (PASS/FAIL)
```

### Test Group 7: Edge Cases

#### Test 7.1: Rapid Toggle

```
Initial State: Any state
Action: Click ☰ very quickly 10 times
Expected Result:
  ✓ No stuck states
  ✓ Toggles smoothly
  ✓ Animations complete
Status: ____ (PASS/FAIL)
```

#### Test 7.2: Toggle During Animation

```
Initial State: Sidebar starting to expand
Action: Click ☰ before animation finishes
Expected Result:
  ✓ Animation reverses smoothly
  ✓ No jank or jumping
  ✓ Completes properly
Status: ____ (PASS/FAIL)
```

#### Test 7.3: Window Resize

```
Initial State: Desktop with collapsed sidebar
Action: Resize window to mobile size
Expected Result:
  ✓ Layout adjusts properly
  ✓ Sidebar state preserved or adjusted
  ✓ Content flows correctly
Status: ____ (PASS/FAIL)
```

#### Test 7.4: Notification Count Update

```
Initial State: No notifications
Action: Add multiple notifications (future feature)
Expected Result:
  ✓ Badge shows "1", "2", "3" etc
  ✓ Updates in real-time
  ✓ Badge position correct
  ✓ Numbers clearly visible
Status: ____ (PASS/FAIL)
```

---

## Browsers to Test

- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Safari (Desktop)
- [ ] Edge (Desktop)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

---

## Devices to Test

- [ ] Desktop (1440px+)
- [ ] Laptop (1024px)
- [ ] Tablet (768px)
- [ ] Large Phone (428px)
- [ ] Medium Phone (375px)
- [ ] Small Phone (320px)

---

## Test Results Summary

| Test Group     | Total Tests | Passed | Failed | Notes |
| -------------- | ----------- | ------ | ------ | ----- |
| Sidebar Toggle | 3           | \_\_\_ | \_\_\_ |       |
| Navigation     | 4           | \_\_\_ | \_\_\_ |       |
| Notifications  | 4           | \_\_\_ | \_\_\_ |       |
| Responsive     | 4           | \_\_\_ | \_\_\_ |       |
| Visual Quality | 4           | \_\_\_ | \_\_\_ |       |
| Functionality  | 4           | \_\_\_ | \_\_\_ |       |
| Edge Cases     | 4           | \_\_\_ | \_\_\_ |       |
| **Total**      | **31**      | \_\_\_ | \_\_\_ |       |

---

## Known Issues & Solutions

### Issue: Sidebar overlaps content on mobile

**Solution:** This is expected - sidebar should overlay. Click ☰ to hide.

### Issue: Menu items invisible when collapsed

**Solution:** Hover over icons to see tooltip with item name.

### Issue: Animation stutters

**Solution:** This shouldn't happen. Clear cache and reload.

### Issue: Notification center position weird

**Solution:** Make sure browser window is wide enough (~1024px+).

---

## Performance Benchmarks

**Toggle Animation Duration:** 300ms  
**Expected Frame Rate:** 60fps  
**Notification Auto-dismiss:** 5000ms (5 seconds)  
**No noticeable lag:** Expected

---

## Accessibility Checks

- [ ] Toggle button has title tooltip
- [ ] All icons have proper sizes (24px+)
- [ ] Color contrast WCAG AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Touch targets 44px+

---

## Sign-Off

**Date Tested:** ******\_\_\_\_******  
**Tester Name:** ******\_\_\_\_******  
**Overall Status:** ☐ PASS ☐ FAIL  
**Critical Issues:** ********\_\_********  
**Notes:** ********\_\_********

---

## Quick Command Reference

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Check TypeScript errors
npm run type-check

# Run tests
npm test
```

---

**All tests should PASS.** If not, check the console for errors and refer to documentation.
