# 🛠️ Development Tools Guide

## LocalStorage Database Console Tools

### ✅ Setup Complete
Dev tools are automatically loaded in development mode. No installation needed!

---

## 📖 How to Use

### 1️⃣ Open Browser Console
- Press **F12** or **Right Click → Inspect**
- Go to **Console** tab

### 2️⃣ Type Commands
All commands start with `db.`

---

## 🎯 Common Commands

### 📊 **View Data**

```javascript
// List all tables
db.tables()

// View all users
db.view('users')

// View all mentors
db.view('mentors')

// View all bookings
db.view('bookings')

// Count records
db.count('users')

// Get statistics
db.stats('users')
```

---

### 🔍 **Search Data**

```javascript
// Find users by email
db.find('users', 'email', 'george@admin.com')

// Find pending approval users
db.find('users', 'status', 'PENDING_APPROVAL')

// Find rejected users
db.find('users', 'status', 'REJECTED')

// Find by ID
db.findById('users', 'u_1234567890')

// Search all fields (fuzzy search)
db.search('users', 'george')
```

---

### ✏️ **Update Data**

```javascript
// Approve a pending user
db.update('users', 'u_1234567890', { status: 'ACTIVE' })

// Reject a user
db.update('users', 'u_1234567890', {
  status: 'REJECTED',
  rejectionReason: 'Insufficient qualifications'
})

// Give credits to user
db.update('users', 'u_1234567890', { credits: 1000 })

// Change user role
db.update('users', 'u_1234567890', { role: 'ADMIN' })

// Update multiple fields
db.update('mentors', 'm_1234', {
  hourlyRate: 20,
  rating: 5,
  bio: 'Updated bio'
})
```

---

### ➕ **Add Data**

```javascript
// Add new test user
db.add('users', {
  id: 'u_test_' + Date.now(),
  name: 'Test User',
  email: 'test@example.com',
  role: 'MENTEE',
  status: 'ACTIVE',
  credits: 100,
  balance: 0,
  avatar: 'https://i.pravatar.cc/150?u=test',
  joinedAt: new Date().toISOString()
})
```

---

### 🗑️ **Delete Data**

```javascript
// Delete a specific user
db.delete('users', 'u_1234567890')

// Clear all bookings (useful for testing)
db.clear('bookings')

// ⚠️ WARNING: This deletes ALL data in the table!
db.clear('users')
```

---

### 💾 **Backup & Export**

```javascript
// Export single table to JSON file
db.export('users')

// Export entire database
db.exportAll()

// This will download a JSON file with timestamp
// Example: database_backup_1703123456789.json
```

---

## 🔥 Real-World Examples

### **Testing Approval System**

```javascript
// 1. View all pending users
db.find('users', 'status', 'PENDING_APPROVAL')

// 2. Approve first pending user
db.update('users', 'u_1703123456789', { status: 'ACTIVE' })

// 3. Reject another user
db.update('users', 'u_1703123999999', {
  status: 'REJECTED',
  rejectionReason: 'Test rejection'
})

// 4. Verify changes
db.view('users')
```

---

### **Testing Re-Apply Flow**

```javascript
// 1. Find rejected user
const rejected = db.find('users', 'status', 'REJECTED')[0]

// 2. View their data
console.log(rejected)

// 3. Manually reset to re-apply (simulate new registration)
db.update('users', rejected.id, {
  status: 'PENDING_APPROVAL',
  rejectionReason: undefined,
  appliedAt: new Date().toISOString()
})
```

---

### **Testing Credits System**

```javascript
// Give test credits to current user
const users = db.view('users')
const myUser = users.find(u => u.email === 'your-email@test.com')
db.update('users', myUser.id, { credits: 5000 })

// Refresh page to see updated credits!
```

---

### **Clean Up Test Data**

```javascript
// Clear all test bookings
db.clear('bookings')

// Delete specific test users
db.delete('users', 'u_test_1234')

// Find and delete all test users
const testUsers = db.search('users', 'test@')
testUsers.forEach(u => db.delete('users', u.id))
```

---

### **Check Mentor Visibility**

```javascript
// View all mentors
const mentors = db.view('mentors')

// Check for non-ACTIVE mentors (should not be visible to mentees)
const nonActive = mentors.filter(m => m.status !== 'ACTIVE')
console.log('Non-active mentors (BUG if any):', nonActive)

// Manually fix if needed
nonActive.forEach(m => {
  db.update('mentors', m.id, { status: 'ACTIVE' })
})
```

---

## 📋 All Available Tables

```javascript
users              - All users (MENTEE, MENTOR, PROVIDER, ADMIN)
mentors            - Mentor-specific data
providers          - Provider-specific data
providerLevels     - Commission levels
bookings           - All bookings
subscriptions      - Subscription plans purchased
subscriptionPlans  - Available subscription plans
transactions       - Payment transactions
creditHistory      - Credit transaction log
mentorEarnings     - Mentor earnings
providerCommissions - Provider commission records
systemLedger       - Credit ledger entries
homework           - Homework assignments
messages           - Chat messages
conversations      - Chat conversations
notifications      - User notifications
systemLogs         - System logs
payouts            - Payout requests
pricingGroups      - Pricing tier groups
```

---

## 🆘 Help Command

```javascript
// Show full help in console
db.help()
```

---

## ⚠️ Important Notes

### **Data Persistence**
- All changes are **PERMANENT** in localStorage
- Data persists even after page refresh
- **Always backup before bulk edits!**

### **Safety Tips**
```javascript
// ✅ GOOD: Backup before major changes
db.exportAll()
// ... then make changes

// ✅ GOOD: Test on one record first
db.update('users', 'u_test', { credits: 999 })

// ❌ BAD: Clearing production data
db.clear('users') // DON'T DO THIS unless intentional!
```

### **Refresh After Changes**
After updating user data (credits, status, etc.), **refresh the page** to see changes in UI.

---

## 🐛 Debugging Tips

### **Find Why User Can't Login**
```javascript
// 1. Find user
const user = db.find('users', 'email', 'problem-user@test.com')[0]

// 2. Check status
console.log('Status:', user.status)
console.log('Rejection reason:', user.rejectionReason)

// 3. Fix if needed
db.update('users', user.id, { status: 'ACTIVE' })
```

### **Check Booking Status**
```javascript
// View all scheduled bookings
const upcoming = db.view('bookings').filter(b => b.status === 'SCHEDULED')
console.table(upcoming)

// Find bookings for specific user
db.find('bookings', 'menteeId', 'u_1234')
```

### **Verify Credit Balance**
```javascript
// Quick check all user credits
db.view('users').forEach(u => {
  console.log(`${u.name}: ${u.credits} credits`)
})
```

---

## 🚀 Production Notes

**Dev tools are ONLY loaded in development mode:**
- ✅ `npm run dev` → Tools available
- ❌ `npm run build` → Tools NOT included in production bundle
- ❌ Production deployment → No console access

This ensures:
- Zero performance impact in production
- No security risk
- Smaller bundle size

---

## 📞 Support

If you have questions or need help:
1. Check console for error messages
2. Run `db.help()` for command reference
3. Backup with `db.exportAll()` before risky operations
4. Test on development data first

---

**Happy Debugging! 🎉**
