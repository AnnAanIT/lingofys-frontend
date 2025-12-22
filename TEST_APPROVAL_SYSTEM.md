# 🧪 Test Cases - User Registration Approval System

## **Test Environment**
- **Build Status**: ✅ Success (0 TypeScript errors)
- **Build Time**: 7.76s
- **Date**: 2025-12-22

---

## **Test Case 1: MENTEE Registration (Auto-Approve)**

### **Objective**
Verify that MENTEE accounts are created with ACTIVE status immediately

### **Steps**
1. Navigate to Login page
2. Click "REGISTER" tab
3. Fill form:
   - Name: "Test Mentee User"
   - Email: "testmentee@test.com"
   - Password: "password123"
4. Click "Next"
5. Select role: **MENTEE**
6. Click "Complete Register"

### **Expected Result**
- ✅ Success message: "Registration successful!"
- ✅ Redirect to LOGIN tab after 1.5 seconds
- ✅ User can login immediately
- ✅ User.status = 'ACTIVE' in database
- ✅ No email notification to admin
- ✅ No admin notification badge

### **Actual Result**
```
Status: [PASS/FAIL]
User Status: ________
Can Login: [YES/NO]
Notes: ________________
```

---

## **Test Case 2: MENTOR Registration (Requires Approval)**

### **Objective**
Verify that MENTOR accounts require admin approval

### **Steps**
1. Navigate to Login page
2. Click "REGISTER" tab
3. Fill form:
   - Name: "Test Mentor User"
   - Email: "testmentor@test.com"
   - Password: "password123"
4. Click "Next"
5. Select role: **MENTOR**
6. Click "Complete Register"

### **Expected Result**
- ✅ Success message: "Registration successful! Your MENTOR account is pending admin approval. You will receive an email notification once approved."
- ✅ Message displays for 4 seconds
- ✅ Redirect to LOGIN tab
- ✅ User.status = 'PENDING_APPROVAL' in localStorage
- ✅ Console log email to admin:
  ```
  📧 [EMAIL NOTIFICATION] New MENTOR application received
     To: admin@englishplatform.com
     Subject: New MENTOR Registration - Pending Approval
     Body: Test Mentor User (testmentor@test.com) has registered as MENTOR. Please review and approve.
  ```
- ✅ Admin notification created
- ✅ Admin nav shows red badge with count

### **Actual Result**
```
Status: [PASS/FAIL]
User Status: ________
Success Message Duration: _____ seconds
Console Email Log: [YES/NO]
Admin Badge Count: ________
Notes: ________________
```

---

## **Test Case 3: PROVIDER Registration (Requires Approval)**

### **Objective**
Verify that PROVIDER accounts require admin approval

### **Steps**
1. Navigate to Login page
2. Click "REGISTER" tab
3. Fill form:
   - Name: "Test Provider User"
   - Email: "testprovider@test.com"
   - Password: "password123"
4. Click "Next"
5. Select role: **PROVIDER**
6. Click "Complete Register"

### **Expected Result**
- ✅ Success message: "Registration successful! Your PROVIDER account is pending admin approval..."
- ✅ Message displays for 4 seconds
- ✅ User.status = 'PENDING_APPROVAL'
- ✅ Console email log appears
- ✅ Admin badge count increases

### **Actual Result**
```
Status: [PASS/FAIL]
User Status: ________
Admin Badge Shows: [YES/NO]
Notes: ________________
```

---

## **Test Case 4: Login with PENDING_APPROVAL Status**

### **Objective**
Verify that users with pending approval cannot login

### **Prerequisites**
- Complete Test Case 2 (create pending MENTOR account)

### **Steps**
1. Navigate to Login page
2. Enter credentials:
   - Email: "testmentor@test.com"
   - Password: "password123"
3. Click "Enter System"

### **Expected Result**
- ✅ Login blocked
- ✅ Error message: "Tài khoản của bạn đang chờ admin phê duyệt. Vui lòng kiểm tra email để biết thêm chi tiết."
- ✅ User remains on login page
- ✅ No navigation occurs

### **Actual Result**
```
Status: [PASS/FAIL]
Error Message Shown: [YES/NO]
Error Message Text: ________________
Notes: ________________
```

---

## **Test Case 5: Admin Views Pending Approvals**

### **Objective**
Verify admin can see pending approval list

### **Prerequisites**
- Complete Test Cases 2 & 3 (create pending users)

### **Steps**
1. Quick login as Admin (George Boss or Hannah Root)
2. Navigate to sidebar → "Operations" section
3. Check for red badge on "Pending Approvals" link
4. Click "Pending Approvals"

### **Expected Result**
- ✅ Red badge shows count (should be 2 if both Test 2 & 3 completed)
- ✅ Page title: "Pending Approvals"
- ✅ Blue info banner explaining approval process
- ✅ List shows both pending users:
  - Test Mentor User (testmentor@test.com)
  - Test Provider User (testprovider@test.com)
- ✅ Each card shows:
  - Avatar, name, role badge
  - Email, country, applied date
  - Green "Approve" button
  - Red "Reject" button

### **Actual Result**
```
Status: [PASS/FAIL]
Badge Count: ________
Pending Users Shown: ________
Card Layout Correct: [YES/NO]
Notes: ________________
```

---

## **Test Case 6: Admin Approves User**

### **Objective**
Verify admin can approve pending users

### **Prerequisites**
- Complete Test Case 5

### **Steps**
1. On Pending Approvals page
2. Find "Test Mentor User" card
3. Click green "Approve" button

### **Expected Result**
- ✅ Button shows "Approving..." during processing
- ✅ User removed from pending list
- ✅ Badge count decreases by 1
- ✅ Console log shows:
  ```
  📧 [EMAIL NOTIFICATION] Account Approved
     To: testmentor@test.com
     Subject: Your MENTOR Account Has Been Approved
     Body: Congratulations! Your account has been approved. You can now log in.
  ```
- ✅ User.status changed to 'ACTIVE' in localStorage
- ✅ In-app notification sent to user

### **Actual Result**
```
Status: [PASS/FAIL]
User Removed from List: [YES/NO]
Badge Count Updated: [YES/NO]
Console Email Log: [YES/NO]
User Status in DB: ________
Notes: ________________
```

---

## **Test Case 7: Approved User Can Login**

### **Objective**
Verify approved users can login successfully

### **Prerequisites**
- Complete Test Case 6 (approve testmentor@test.com)

### **Steps**
1. Logout from admin account
2. Navigate to Login page
3. Enter credentials:
   - Email: "testmentor@test.com"
   - Password: "password123"
4. Click "Enter System"

### **Expected Result**
- ✅ Login successful
- ✅ Navigate to /mentor dashboard
- ✅ No error messages
- ✅ User can access all mentor features

### **Actual Result**
```
Status: [PASS/FAIL]
Login Success: [YES/NO]
Redirected To: ________________
Notes: ________________
```

---

## **Test Case 8: Admin Rejects User**

### **Objective**
Verify admin can reject pending users with reason

### **Prerequisites**
- Complete Test Case 5 (pending provider exists)

### **Steps**
1. Login as Admin
2. Navigate to Pending Approvals
3. Find "Test Provider User" card
4. Click red "Reject" button
5. Modal opens
6. Enter rejection reason: "Insufficient qualifications"
7. Click "Confirm Rejection"

### **Expected Result**
- ✅ Rejection modal appears
- ✅ Reason field is required (cannot submit empty)
- ✅ Button shows "Rejecting..." during processing
- ✅ User removed from pending list
- ✅ Badge count decreases
- ✅ Console log shows:
  ```
  📧 [EMAIL NOTIFICATION] Account Rejected
     To: testprovider@test.com
     Subject: Your PROVIDER Application Has Been Rejected
     Body: Your application has been rejected. Reason: Insufficient qualifications. You may re-apply.
  ```
- ✅ User.status = 'REJECTED'
- ✅ User.rejectionReason = "Insufficient qualifications"

### **Actual Result**
```
Status: [PASS/FAIL]
Modal Validation Works: [YES/NO]
User Removed: [YES/NO]
Console Email: [YES/NO]
Rejection Reason Saved: [YES/NO]
Notes: ________________
```

---

## **Test Case 9: Rejected User Tries to Login**

### **Objective**
Verify rejected users see proper error with reason

### **Prerequisites**
- Complete Test Case 8

### **Steps**
1. Navigate to Login page
2. Enter credentials:
   - Email: "testprovider@test.com"
   - Password: "password123"
3. Click "Enter System"

### **Expected Result**
- ✅ Login blocked
- ✅ Error message: "Tài khoản của bạn đã bị từ chối. Lý do: Insufficient qualifications. Bạn có thể đăng ký lại."
- ✅ User remains on login page
- ✅ Message mentions re-apply option

### **Actual Result**
```
Status: [PASS/FAIL]
Error Shows Reason: [YES/NO]
Rejection Reason Text: ________________
Re-apply Mentioned: [YES/NO]
Notes: ________________
```

---

## **Test Case 10: Re-Apply After Rejection**

### **Objective**
Verify rejected users can register again

### **Prerequisites**
- Complete Test Case 9

### **Steps**
1. Navigate to Login page
2. Click "REGISTER" tab
3. Fill form with SAME email:
   - Name: "Test Provider Updated"
   - Email: "testprovider@test.com" (same as rejected)
   - Password: "newpassword123"
4. Select role: PROVIDER
5. Click "Complete Register"

### **Expected Result**
- ✅ Registration successful (no "email already exists" error)
- ✅ New pending approval created
- ✅ Old rejection data cleared
- ✅ User.status = 'PENDING_APPROVAL'
- ✅ User.rejectionReason = undefined (cleared)
- ✅ Admin sees new application in pending list

### **Actual Result**
```
Status: [PASS/FAIL]
Re-registration Allowed: [YES/NO]
New Pending Created: [YES/NO]
Old Data Cleared: [YES/NO]
Notes: ________________
```

---

## **Test Case 11: Admin Badge Auto-Refresh**

### **Objective**
Verify badge count auto-refreshes every 30 seconds

### **Prerequisites**
- Login as Admin
- Have at least 1 pending approval

### **Steps**
1. Login as Admin
2. Note current badge count
3. Open DevTools Console
4. In another browser tab, register a new MENTOR
5. Wait 30 seconds
6. Check badge count in admin tab (without refresh)

### **Expected Result**
- ✅ Badge count increases automatically after 30 seconds
- ✅ No manual page refresh needed
- ✅ Console shows periodic fetch (every 30s)

### **Actual Result**
```
Status: [PASS/FAIL]
Auto-refresh Works: [YES/NO]
Wait Time: _____ seconds
Notes: ________________
```

---

## **Test Case 12: Empty State (No Pending Approvals)**

### **Objective**
Verify empty state displays when no pending users

### **Steps**
1. Login as Admin
2. Approve/Reject all pending users
3. Navigate to Pending Approvals page

### **Expected Result**
- ✅ No badge on nav link (or badge shows 0)
- ✅ Page shows green checkmark icon
- ✅ Heading: "All Clear!"
- ✅ Message: "No pending approvals at the moment."
- ✅ No user cards displayed

### **Actual Result**
```
Status: [PASS/FAIL]
Empty State Shown: [YES/NO]
Message Correct: [YES/NO]
Notes: ________________
```

---

## **Test Case 13: Notification System Integration**

### **Objective**
Verify in-app notifications are sent properly

### **Steps**
1. Register as MENTOR
2. Login as Admin
3. Approve the MENTOR
4. Logout admin
5. Login as the approved MENTOR
6. Click notification bell icon

### **Expected Result**
- ✅ Notification appears in dropdown
- ✅ Type: success (green)
- ✅ Title: "Tài khoản đã được phê duyệt"
- ✅ Message: "Chúc mừng! Tài khoản của bạn đã được admin phê duyệt..."
- ✅ Notification is marked unread initially

### **Actual Result**
```
Status: [PASS/FAIL]
Notification Received: [YES/NO]
Notification Type: ________
Notes: ________________
```

---

## **Test Case 14: Edge Case - BANNED Status**

### **Objective**
Verify BANNED status blocks login (existing feature, ensure not broken)

### **Prerequisites**
- Have an ACTIVE user account

### **Steps**
1. Login as Admin
2. Navigate to User Management
3. Find a user, click Ban
4. Logout
5. Try to login as banned user

### **Expected Result**
- ✅ Login blocked
- ✅ Error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin."
- ✅ Different from pending/rejected messages

### **Actual Result**
```
Status: [PASS/FAIL]
Ban Still Works: [YES/NO]
Error Message Unique: [YES/NO]
Notes: ________________
```

---

## **Test Case 15: Database Persistence**

### **Objective**
Verify approval status persists after page refresh

### **Prerequisites**
- Have pending/rejected users in system

### **Steps**
1. Create pending MENTOR
2. Note User.status in DevTools → Application → LocalStorage
3. Hard refresh page (Ctrl+F5)
4. Check User.status again

### **Expected Result**
- ✅ User.status remains 'PENDING_APPROVAL'
- ✅ User.appliedAt timestamp preserved
- ✅ All data persists correctly

### **Actual Result**
```
Status: [PASS/FAIL]
Data Persists: [YES/NO]
Fields Preserved: ________________
Notes: ________________
```

---

## **📊 Test Summary**

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC1: MENTEE Auto-Approve | ⬜ | |
| TC2: MENTOR Pending | ⬜ | |
| TC3: PROVIDER Pending | ⬜ | |
| TC4: Login Blocked (Pending) | ⬜ | |
| TC5: Admin View Pending | ⬜ | |
| TC6: Admin Approve | ⬜ | |
| TC7: Approved Login | ⬜ | |
| TC8: Admin Reject | ⬜ | |
| TC9: Rejected Login | ⬜ | |
| TC10: Re-apply | ⬜ | |
| TC11: Badge Auto-refresh | ⬜ | |
| TC12: Empty State | ⬜ | |
| TC13: Notifications | ⬜ | |
| TC14: BANNED Status | ⬜ | |
| TC15: Data Persistence | ⬜ | |

**Total**: 0/15 Passed

---

## **🐛 Bugs Found**

### Bug #1: [Title]
- **Severity**: [Critical/High/Medium/Low]
- **Description**:
- **Steps to Reproduce**:
- **Expected**:
- **Actual**:
- **Fix**:

---

## **✅ Sign-off**

**Tester**: ________________
**Date**: ________________
**Build Version**: v1.0.0 - Approval System
**Status**: ⬜ PASS / ⬜ FAIL

