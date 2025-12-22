# 🔧 FIX: React Hooks Order Violation

**Date:** 2025-12-20
**Bug:** React hooks order violation causing crash
**Error:** "Rendered more hooks than during the previous render"
**Status:** ✅ FIXED

---

## 🐛 PROBLEM DESCRIPTION

### Error Message

```
App.tsx:103 React has detected a change in the order of Hooks called by Layout.
This will lead to bugs and errors if not fixed.

Previous render            Next render
------------------------------------------------------
1. useContext                 useContext
2. useContext                 useContext
3. useContext                 useContext
4. useState                   useState
5. undefined                  useMemo
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Uncaught Error: Rendered more hooks than during the previous render.
    at Layout (App.tsx:103:20)
```

### Root Cause

**File:** `App.tsx:90-139`

```typescript
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, language, setLanguage, unreadCount } = useApp();
  const location = useLocation();
  const t = user?.role === UserRole.MENTEE ? translations[language] : translations['en'];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;  // ❌ Early return #1

  if (user.role === UserRole.ADMIN) return <>{children}</>;  // ❌ Early return #2

  // ❌ useMemo called AFTER early returns
  const navLinks = useMemo(() => {
    switch (user.role) {
      // ...
    }
  }, [user.role, t]);

  const primaryNavLinks = useMemo(() => navLinks.slice(0, 4), [navLinks]);
  const secondaryNavLinks = useMemo(() => navLinks.slice(4), [navLinks]);
  // ...
}
```

**Problem:**
1. When `!user` or `user.role === ADMIN`, component returns early at line 98/100
2. In this render: Only 4 hooks called (useContext x3, useState)
3. When `user` exists and is not ADMIN, component continues
4. In this render: 7 hooks called (useContext x3, useState, useMemo x3)
5. **React detects different number of hooks between renders → CRASH**

**Why This Violates Rules of Hooks:**
- Hooks must be called in the **same order** on every render
- Conditional early returns before hooks cause different execution paths
- React tracks hooks by call order, not by name/position

---

## ✅ SOLUTION

### Fix Applied

Move all hooks **BEFORE** early returns to ensure they're always called in the same order.

**File:** `App.tsx:90-139`

```typescript
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, language, setLanguage, unreadCount } = useApp();
  const location = useLocation();
  const t = user?.role === UserRole.MENTEE ? translations[language] : translations['en'];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ✅ FIX: ALL hooks BEFORE early returns
  const navLinks = useMemo(() => {
    if (!user) return [];  // Handle null case inside useMemo
    switch (user.role) {
      case UserRole.MENTEE:
        return [
          { icon: LayoutDashboard, label: t.nav.dashboard, path: '/mentee' },
          { icon: Search, label: t.nav.findMentor, path: '/mentee/find-mentor' },
          { icon: Calendar, label: t.nav.bookings, path: '/mentee/bookings' },
          { icon: Award, label: t.nav.subscriptions, path: '/mentee/subscriptions' },
          { icon: BookOpen, label: t.nav.homework, path: '/mentee/homework' },
          { icon: MessageSquare, label: 'Support Chat', path: '/mentee/chat' },
          { icon: CreditCard, label: t.nav.wallet, path: '/mentee/wallet' },
          { icon: UserIcon, label: t.nav.profile, path: '/mentee/profile' },
        ];
      case UserRole.MENTOR:
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/mentor' },
          { icon: Calendar, label: 'Schedule', path: '/mentor/schedule' },
          { icon: BookOpen, label: 'Homework', path: '/mentor/homework' },
          { icon: MessageSquare, label: 'Admin Support', path: '/mentor/chat' },
          { icon: DollarSign, label: 'Earnings & Payout', path: '/mentor/payout' },
          { icon: UserIcon, label: 'Profile', path: '/mentor/profile' },
        ];
      case UserRole.PROVIDER:
        return [
          { icon: LayoutDashboard, label: 'Dashboard', path: '/provider' },
          { icon: UserIcon, label: 'Profile', path: '/provider/profile' },
        ];
      case UserRole.ADMIN:
      default:
        return [];
    }
  }, [user, user?.role, t]);  // ✅ Added 'user' to dependencies

  const primaryNavLinks = useMemo(() => navLinks.slice(0, 4), [navLinks]);
  const secondaryNavLinks = useMemo(() => navLinks.slice(4), [navLinks]);

  // ✅ Early returns AFTER all hooks
  if (!user) return <>{children}</>;

  if (user.role === UserRole.ADMIN) return <>{children}</>;

  // Rest of component...
}
```

### Key Changes

1. **Moved hooks before early returns**
   - All `useMemo` calls now execute on every render
   - Consistent hook order regardless of `user` state

2. **Added null check inside useMemo**
   - `if (!user) return []` handles the null case
   - Hook still executes, just returns empty array

3. **Updated dependencies**
   - Changed from `[user.role, t]` to `[user, user?.role, t]`
   - Ensures proper reactivity when user changes

4. **Added ADMIN case to switch**
   - Prevents unnecessary computation for admin users
   - Returns `[]` since admins don't use sidebar navigation

---

## 📊 CHANGES SUMMARY

| File | Changes | Lines Modified |
|------|---------|----------------|
| App.tsx | Fixed hooks order | ~15 lines |

**Total:** 1 file modified

---

## 🧪 TESTING

### Test Cases

✅ **Test 1: Login as Mentee**
```
1. Login as alice@demo.com
2. Navigate to dashboard
3. Check console for errors
4. Expected: No React hooks errors
5. Result: ✅ PASS - Sidebar renders correctly
```

✅ **Test 2: Login as Mentor**
```
1. Login as Charlie Davis (quick login)
2. Navigate to dashboard
3. Check console for errors
4. Expected: No React hooks errors
5. Result: ✅ PASS - Sidebar renders correctly
```

✅ **Test 3: Login as Provider**
```
1. Login as Evan Wright (quick login)
2. Navigate to dashboard
3. Expected: Sidebar shows 2 items (Dashboard, Profile)
4. Result: ✅ PASS
```

✅ **Test 4: Login as Admin**
```
1. Login as George Boss (quick login)
2. Navigate to dashboard
3. Expected: No sidebar (admin uses full layout)
4. Result: ✅ PASS
```

✅ **Test 5: Logout Flow**
```
1. Login as any user
2. Click Logout
3. Expected: Redirect to login page, no errors
4. Result: ✅ PASS
```

✅ **Test 6: Navigation Between Pages**
```
1. Login as mentee
2. Navigate: Dashboard → Find Mentor → Bookings → Profile
3. Check console for hooks warnings
4. Expected: No warnings, smooth navigation
5. Result: ✅ PASS
```

---

## 🔍 TECHNICAL DETAILS

### Rules of Hooks Explained

**Rule #1: Only Call Hooks at the Top Level**
- ❌ Don't call hooks inside loops, conditions, or nested functions
- ✅ Always use hooks at the top level of your function component

**Rule #2: Only Call Hooks from React Functions**
- ❌ Don't call hooks from regular JavaScript functions
- ✅ Call hooks from React function components or custom hooks

### Why Order Matters

React relies on hook call order to preserve state between renders:

```typescript
// Render 1 (user = null)
useState()    // Hook 1
useState()    // Hook 2
useState()    // Hook 3
// Early return - stops here

// Render 2 (user = mentee)
useState()    // Hook 1
useState()    // Hook 2
useState()    // Hook 3
useMemo()     // Hook 4 ❌ React: "Wait, where did this hook come from?"
useMemo()     // Hook 5
useMemo()     // Hook 6
```

React tracks hooks by index, not name. Different number of hooks = crash.

### Correct Pattern

```typescript
// ✅ GOOD: All hooks before conditionals
const Component = () => {
  const [state1] = useState();
  const [state2] = useState();
  const memo1 = useMemo(() => {...}, []);

  if (condition) return null;  // OK - after all hooks

  return <div>...</div>;
};

// ❌ BAD: Hooks after conditionals
const Component = () => {
  const [state1] = useState();

  if (condition) return null;  // Early return

  const memo1 = useMemo(() => {...}, []);  // Hook only called sometimes!
};
```

---

## 📝 LESSONS LEARNED

### Best Practices for Hook Usage

1. **Always call hooks at the top level**
   - Before any conditional logic
   - Before any early returns
   - In consistent order

2. **Handle conditionals inside hooks**
   - Use conditional logic INSIDE useMemo/useCallback
   - Don't conditionally call the hooks themselves

3. **Use ESLint plugin**
   - `eslint-plugin-react-hooks` catches these issues
   - Enforces rules of hooks automatically

4. **Test different render paths**
   - Login/logout flows
   - Different user roles
   - Various navigation patterns

---

## ✅ VERIFICATION

### TypeScript Compilation
```bash
npx tsc --noEmit
# Result: ✅ 0 errors
```

### Runtime Testing
- ✅ No React hooks warnings in console
- ✅ All user roles render correctly
- ✅ Navigation works smoothly
- ✅ Login/logout flows work
- ✅ Sidebar appears for MENTEE, MENTOR, PROVIDER
- ✅ No sidebar for ADMIN (correct behavior)

### Performance
- ✅ Memoization still works (navLinks only recompute when deps change)
- ✅ No unnecessary re-renders
- ✅ Smooth navigation transitions

---

## 🎯 CONCLUSION

### Fixed
✅ React hooks order violation resolved
✅ Component renders without errors
✅ All user roles work correctly
✅ Memoization optimization preserved

### Impact
- **Before:** App crashed when navigating between login and dashboard
- **After:** Smooth operation, no console errors
- **Performance:** No degradation, memoization still effective

---

**Fixed by:** Claude Code
**Related to:** PERF-1 (Navigation memoization)
**Status:** ✅ Ready for production deployment

🎉 **React Hooks violation fixed!**
