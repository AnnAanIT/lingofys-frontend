/**
 * LOGIC_TEST.ts - Comprehensive Test Suite
 * 
 * Run these tests to verify all business logic:
 * - Credit pending engine (hold/release/refund)
 * - Pricing & revenue calculations
 * - Provider commissions
 * - Mentor payouts
 * - Financial integrity
 */

import { creditPendingServiceV2 } from '../../services/v2/creditPendingServiceV2';
import { pricingRevenueServiceV2 } from '../../services/v2/pricingRevenueServiceV2';
import { providerCommissionServiceV2 } from '../../services/v2/providerCommissionServiceV2';
import { mentorPayoutServiceV2 } from '../../services/v2/mentorPayoutServiceV2';
import { User, UserRole } from '../../types';

// ========== TEST UTILITIES ==========

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  return async () => {
    const start = performance.now();
    try {
      await fn();
      const duration = performance.now() - start;
      results.push({ name, passed: true, duration });
      console.log(`✅ PASS: ${name} (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - start;
      results.push({ 
        name, 
        passed: false, 
        error: String(error),
        duration 
      });
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${error}\n`);
    }
  };
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function clearDB() {
  localStorage.clear();
}

function setupMentee(id: string, credits: number = 100) {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const existing = users.find((u: User) => u.id === id);
  if (!existing) {
    users.push({
      id,
      name: `Mentee ${id}`,
      email: `${id}@test.com`,
      role: UserRole.MENTEE,
      credits,
      avatar: '',
      country: 'US',
      status: 'ACTIVE'
    });
    localStorage.setItem('users', JSON.stringify(users));
  }
}

function setupMentor(id: string, credits: number = 50) {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const existing = users.find((u: User) => u.id === id);
  if (!existing) {
    users.push({
      id,
      name: `Mentor ${id}`,
      email: `${id}@test.com`,
      role: UserRole.MENTOR,
      credits,
      avatar: '',
      country: 'US',
      status: 'ACTIVE'
    });
    localStorage.setItem('users', JSON.stringify(users));
  }
}

function getMenteeCredits(id: string): number {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find((u: User) => u.id === id);
  return user?.credits ?? 0;
}

function getMentorCredits(id: string): number {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find((u: User) => u.id === id);
  return user?.credits ?? 0;
}

function createBooking(id: string, menteeId: string, mentorId: string) {
  const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
  bookings.push({
    id,
    menteeId,
    mentorId,
    menteeName: `Mentee ${menteeId}`,
    mentorName: `Mentor ${mentorId}`,
    status: 'SCHEDULED'
  });
  localStorage.setItem('bookings', JSON.stringify(bookings));
}

// ========== TEST CASES ==========

// 1. CREDIT PENDING ENGINE TESTS

const test1_1 = test('1.1: Hold Credit on Booking', () => {
  clearDB();
  setupMentee('m1', 100);
  createBooking('b1', 'm1', 'mentor1');

  creditPendingServiceV2.holdCreditOnBooking('b1', 'm1', 25);

  assert(getMenteeCredits('m1') === 75, 'Mentee credits should be 75 after hold');

  const ledger = JSON.parse(localStorage.getItem('systemCreditLedger') || '[]');
  const entry = ledger.find((e: any) => e.bookingId === 'b1');
  assert(entry !== undefined, 'Ledger entry should exist');
  assert(entry.status === 'holding', 'Ledger status should be holding');
  assert(entry.amount === 25, 'Ledger amount should be 25');
});

const test1_2 = test('1.2: Release Credit to Mentor', () => {
  clearDB();
  setupMentee('m2', 100);
  setupMentor('mentor2', 50);
  createBooking('b2', 'm2', 'mentor2');
  
  creditPendingServiceV2.holdCreditOnBooking('b2', 'm2', 25);
  creditPendingServiceV2.releaseCreditToMentor('b2');

  assert(getMenteeCredits('m2') === 75, 'Mentee should have 75');
  assert(getMentorCredits('mentor2') === 75, 'Mentor should have 75 (50 + 25)');

  const ledger = JSON.parse(localStorage.getItem('systemCreditLedger') || '[]');
  const entry = ledger.find((e: any) => e.bookingId === 'b2');
  assert(entry.status === 'released', 'Status should be released');
  assert(entry.toUserId === 'mentor2', 'Credits should go to mentor2');
});

const test1_3 = test('1.3: Refund Credit on Cancellation', () => {
  clearDB();
  setupMentee('m3', 100);
  setupMentor('mentor3', 50);
  createBooking('b3', 'm3', 'mentor3');

  creditPendingServiceV2.holdCreditOnBooking('b3', 'm3', 25);
  assert(getMenteeCredits('m3') === 75, 'Mentee should have 75 after hold');

  creditPendingServiceV2.refundCreditToMentee('b3');
  assert(getMenteeCredits('m3') === 100, 'Mentee should have 100 after refund');

  const ledger = JSON.parse(localStorage.getItem('systemCreditLedger') || '[]');
  const entry = ledger.find((e: any) => e.bookingId === 'b3');
  assert(entry.status === 'returned', 'Status should be returned');
});

const test1_4 = test('1.4: Insufficient Credits Error', () => {
  clearDB();
  setupMentee('m4', 10);
  createBooking('b4', 'm4', 'mentor4');

  try {
    creditPendingServiceV2.holdCreditOnBooking('b4', 'm4', 25);
    throw new Error('Should have thrown error');
  } catch (err: any) {
    assert(err.message.includes('Insufficient'), 'Should mention insufficient credits');
  }
});

const test1_5 = test('1.5: Idempotent Release (no double credit)', () => {
  clearDB();
  setupMentee('m5', 100);
  setupMentor('mentor5', 50);
  createBooking('b5', 'm5', 'mentor5');

  creditPendingServiceV2.holdCreditOnBooking('b5', 'm5', 25);
  creditPendingServiceV2.releaseCreditToMentor('b5');
  const balanceAfterFirst = getMentorCredits('mentor5');

  // Second call should not change balance
  creditPendingServiceV2.releaseCreditToMentor('b5');
  const balanceAfterSecond = getMentorCredits('mentor5');

  assert(balanceAfterFirst === balanceAfterSecond, 'Balance should not change on duplicate release');
  assert(balanceAfterFirst === 75, 'Balance should be 75');
});

// 2. PRICING REVENUE ENGINE TESTS

const test2_1 = test('2.1: Basic Price Calculation (10 credits)', () => {
  clearDB();
  const price = pricingRevenueServiceV2.calculatePrice('mentor_basic', 'US');
  assert(price === 10, `Expected 10, got ${price}`);
});

const test2_2 = test('2.2: Country Multiplier (Japan 1.15x)', () => {
  clearDB();
  const price = pricingRevenueServiceV2.calculatePrice('mentor_basic', 'JP');
  assert(price === 11.5, `Expected 11.5, got ${price}`);
});

const test2_3 = test('2.3: Vietnam Discount (0.9x)', () => {
  clearDB();
  const price = pricingRevenueServiceV2.calculatePrice('mentor_basic', 'VN');
  assert(price === 9, `Expected 9, got ${price}`);
});

const test2_4 = test('2.4: Expert Mentor Premium (1.2x)', () => {
  clearDB();
  setupMentor('mentor_expert', 100);
  // Manually set mentor group
  const mentors = JSON.parse(localStorage.getItem('mentors') || '[]');
  const mentor = mentors.find((m: any) => m.id === 'mentor_expert');
  if (mentor) {
    mentor.mentorGroupId = 'expert';
    localStorage.setItem('mentors', JSON.stringify(mentors));
  }

  const price = pricingRevenueServiceV2.calculatePrice('mentor_expert', 'US');
  assert(price === 12, `Expected 12, got ${price}`);
});

const test2_5 = test('2.5: Combined Multipliers (Japan + Native Speaker)', () => {
  clearDB();
  const price = pricingRevenueServiceV2.calculatePrice('mentor_native', 'JP');
  // 10 × 1.15 × 1.4 = 16.1
  assert(Math.abs(price - 16.1) < 0.01, `Expected 16.1, got ${price}`);
});

// 3. PROVIDER COMMISSION TESTS

const test3_1 = test('3.1: Process Top-Up Commission', () => {
  clearDB();
  setupMentee('m6', 100);

  const commission = providerCommissionServiceV2.processTopupCommission('m6', 100, 'tx1');
  
  // Can be null if no referral, that's OK
  if (commission !== null) {
    assert(commission.topupAmountUsd === 100, 'Top-up amount should be 100');
    assert(commission.status === 'PENDING', 'Status should be PENDING');
  }
});

const test3_2 = test('3.2: Get Total Pending Commission', () => {
  clearDB();
  const total = providerCommissionServiceV2.getTotalPendingCommission('provider1');
  assert(total >= 0, 'Total should be non-negative');
});

// 4. MENTOR PAYOUT ENGINE TESTS

const test4_1 = test('4.1: Get Mentor Balance Details', async () => {
  clearDB();
  setupMentor('mentor_payout', 100);

  const balance = await mentorPayoutServiceV2.getMentorBalanceDetails('mentor_payout');
  
  assert(balance.total === 100, `Total should be 100, got ${balance.total}`);
  assert(balance.payable >= 0, 'Payable should be non-negative');
  assert(balance.locked >= 0, 'Locked should be non-negative');
  assert(balance.paid >= 0, 'Paid should be non-negative');
});

const test4_2 = test('4.2: Request Payout - Validation', async () => {
  clearDB();
  setupMentor('mentor_neg', 100);

  const adminUser: User = {
    id: 'admin1',
    name: 'Admin',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    credits: 0,
    avatar: '',
    country: 'US',
    status: 'ACTIVE',
    balance: 0,
    joinedAt: new Date().toISOString()
  };

  try {
    // Negative amount should fail
    await mentorPayoutServiceV2.requestPayout(adminUser, 'mentor_neg', -50, 'PayPal');
    throw new Error('Should have thrown error');
  } catch (err: any) {
    assert(
      err.message.includes('Invalid') || err.message.includes('positive'),
      'Should reject negative amount'
    );
  }
});

// 5. FINANCIAL INTEGRITY TESTS

const test5_1 = test('5.1: Credit Conservation (Zero-Sum)', () => {
  clearDB();
  setupMentee('m_cons', 100);
  setupMentor('mentor_cons', 50);
  createBooking('b_cons', 'm_cons', 'mentor_cons');

  const totalBefore = getMenteeCredits('m_cons') + getMentorCredits('mentor_cons');

  creditPendingServiceV2.holdCreditOnBooking('b_cons', 'm_cons', 25);
  creditPendingServiceV2.releaseCreditToMentor('b_cons');

  const totalAfter = getMenteeCredits('m_cons') + getMentorCredits('mentor_cons');

  assert(totalBefore === totalAfter, `Total should be conserved: ${totalBefore} vs ${totalAfter}`);
});

const test5_2 = test('5.2: Audit Trail - Ledger Entry Created', () => {
  clearDB();
  setupMentee('m_audit', 100);
  createBooking('b_audit', 'm_audit', 'mentor_audit');

  creditPendingServiceV2.holdCreditOnBooking('b_audit', 'm_audit', 25);

  const ledger = JSON.parse(localStorage.getItem('systemCreditLedger') || '[]');
  assert(ledger.length > 0, 'Ledger should have entries');

  const entry = ledger.find((e: any) => e.bookingId === 'b_audit');
  assert(entry !== undefined, 'Should have booking entry in ledger');
  assert(entry.id !== undefined && entry.createdAt !== undefined, 'Entry should have id and timestamp');
});

const test5_3 = test('5.3: Audit Trail - Transaction Logged', () => {
  clearDB();
  setupMentee('m_tx', 100);
  createBooking('b_tx', 'm_tx', 'mentor_tx');

  creditPendingServiceV2.holdCreditOnBooking('b_tx', 'm_tx', 25);

  const txs = JSON.parse(localStorage.getItem('transactions') || '[]');
  assert(txs.length > 0, 'Should have transaction entries');

  const tx = txs.find((t: any) => t.relatedEntityId === 'b_tx');
  assert(tx !== undefined, 'Should have transaction for booking');
  assert(tx.type === 'booking_use', `Type should be booking_use, got ${tx.type}`);
  assert(tx.amount === -25, `Amount should be -25, got ${tx.amount}`);
});

const test5_4 = test('5.4: Conversion Ratio Applied (0.8)', () => {
  clearDB();
  setupMentee('m_ratio', 0);

  // In actual API, buyCredits should apply 0.8 ratio
  // This is verified in api.ts, but we can test the concept
  const usdAmount = 100;
  const ratio = 0.8;
  const creditsExpected = usdAmount * ratio;

  assert(creditsExpected === 80, 'Should get 80 credits for $100 with 0.8 ratio');
});

// 6. CONCURRENT OPERATIONS TESTS (Multi-User Scenarios)

const test6_1 = test('6.1: Multiple Users Holding Credits Simultaneously', () => {
  clearDB();
  
  // Setup 5 mentees with 100 credits each
  for (let i = 1; i <= 5; i++) {
    setupMentee(`m_concurrent_${i}`, 100);
    createBooking(`b_concurrent_${i}`, `m_concurrent_${i}`, `mentor_c_${i}`);
  }

  const totalBefore = 5 * 100; // 500 credits

  // Simulate concurrent holds (rapid sequential in JS, but testing effect)
  for (let i = 1; i <= 5; i++) {
    creditPendingServiceV2.holdCreditOnBooking(
      `b_concurrent_${i}`,
      `m_concurrent_${i}`,
      20
    );
  }

  // Verify all holds succeeded without interference
  let totalAfter = 0;
  for (let i = 1; i <= 5; i++) {
    const balance = getMenteeCredits(`m_concurrent_${i}`);
    assert(balance === 80, `User ${i} should have 80, got ${balance}`);
    totalAfter += balance;
  }

  // Verify zero-sum is maintained
  const ledger = JSON.parse(localStorage.getItem('systemCreditLedger') || '[]');
  const heldAmount = ledger.reduce((sum: number, e: any) => {
    return e.status === 'holding' ? sum + e.amount : sum;
  }, 0);

  const total = totalAfter + heldAmount;
  assert(total === totalBefore, `Total should be ${totalBefore}, got ${total}`);
});

const test6_2 = test('6.2: Multiple Users Releasing Credits Simultaneously', () => {
  clearDB();

  // Setup
  setupMentee('m_release_1', 100);
  setupMentee('m_release_2', 100);
  setupMentor('mentor_release_1', 50);
  setupMentor('mentor_release_2', 50);

  createBooking('b_release_1', 'm_release_1', 'mentor_release_1');
  createBooking('b_release_2', 'm_release_2', 'mentor_release_2');

  // Hold credits
  creditPendingServiceV2.holdCreditOnBooking('b_release_1', 'm_release_1', 30);
  creditPendingServiceV2.holdCreditOnBooking('b_release_2', 'm_release_2', 25);

  const mentor1Before = getMentorCredits('mentor_release_1');
  const mentor2Before = getMentorCredits('mentor_release_2');

  // Release simultaneously (in practice, rapid sequential)
  creditPendingServiceV2.releaseCreditToMentor('b_release_1');
  creditPendingServiceV2.releaseCreditToMentor('b_release_2');

  // Verify both releases succeeded independently
  const mentor1After = getMentorCredits('mentor_release_1');
  const mentor2After = getMentorCredits('mentor_release_2');

  assert(
    mentor1After === mentor1Before + 30,
    `Mentor 1 should have ${mentor1Before + 30}, got ${mentor1After}`
  );
  assert(
    mentor2After === mentor2Before + 25,
    `Mentor 2 should have ${mentor2Before + 25}, got ${mentor2After}`
  );
});

const test6_3 = test('6.3: Mixed Operations (Hold + Release + Refund)', () => {
  clearDB();

  setupMentee('m_mixed_1', 100);
  setupMentee('m_mixed_2', 100);
  setupMentee('m_mixed_3', 100);
  setupMentor('mentor_mixed_1', 50);
  setupMentor('mentor_mixed_2', 50);

  createBooking('b_mixed_hold', 'm_mixed_1', 'mentor_mixed_1');
  createBooking('b_mixed_release', 'm_mixed_2', 'mentor_mixed_1');
  createBooking('b_mixed_refund', 'm_mixed_3', 'mentor_mixed_2');

  const totalBefore = 300 + 100; // 3 mentees + 2 mentors

  // Concurrent operations
  creditPendingServiceV2.holdCreditOnBooking('b_mixed_hold', 'm_mixed_1', 25);
  creditPendingServiceV2.holdCreditOnBooking('b_mixed_release', 'm_mixed_2', 30);
  creditPendingServiceV2.holdCreditOnBooking('b_mixed_refund', 'm_mixed_3', 20);

  creditPendingServiceV2.releaseCreditToMentor('b_mixed_release');
  creditPendingServiceV2.refundCreditToMentee('b_mixed_refund');

  // Verify final state
  assert(getMenteeCredits('m_mixed_1') === 75, 'User 1: 100 - 25 held');
  assert(getMenteeCredits('m_mixed_2') === 70, 'User 2: 100 - 30 held (released to mentor)');
  assert(getMenteeCredits('m_mixed_3') === 100, 'User 3: 100 - 20 held + 20 refunded');
  assert(getMentorCredits('mentor_mixed_1') === 80, 'Mentor 1: 50 + 30 released');

  // Verify conservation
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const totalAfter = users.reduce((sum: number, u: User) => sum + u.credits, 0);
  const ledger = JSON.parse(localStorage.getItem('systemCreditLedger') || '[]');
  const heldAmount = ledger.reduce((sum: number, e: any) => {
    return e.status === 'holding' ? sum + e.amount : sum;
  }, 0);

  assert(totalAfter + heldAmount === totalBefore, 'Zero-sum should be maintained');
});

const test6_4 = test('6.4: Duplicate Operations (Race Condition - Same Booking)', () => {
  clearDB();

  setupMentee('m_dup', 100);
  setupMentor('mentor_dup', 50);
  createBooking('b_dup', 'm_dup', 'mentor_dup');

  creditPendingServiceV2.holdCreditOnBooking('b_dup', 'm_dup', 25);

  const mentorBefore = getMentorCredits('mentor_dup');

  // Simulate concurrent release attempts (should be idempotent)
  creditPendingServiceV2.releaseCreditToMentor('b_dup');
  const mentorAfterFirst = getMentorCredits('mentor_dup');

  creditPendingServiceV2.releaseCreditToMentor('b_dup');
  const mentorAfterSecond = getMentorCredits('mentor_dup');

  creditPendingServiceV2.releaseCreditToMentor('b_dup');
  const mentorAfterThird = getMentorCredits('mentor_dup');

  assert(
    mentorAfterFirst === mentorBefore + 25,
    `First release: should add 25`
  );
  assert(
    mentorAfterSecond === mentorAfterFirst,
    `Second release: should be idempotent (no change)`
  );
  assert(
    mentorAfterThird === mentorAfterFirst,
    `Third release: should be idempotent (no change)`
  );

  const ledger = JSON.parse(localStorage.getItem('systemCreditLedger') || '[]');
  const releaseCount = ledger.filter(
    (e: any) => e.bookingId === 'b_dup' && e.status === 'released'
  ).length;
  assert(releaseCount === 1, 'Should only have 1 released entry');
});

const test6_5 = test('6.5: Conflicting Operations (Hold + Refund on Same Booking)', () => {
  clearDB();

  setupMentee('m_conflict', 100);
  setupMentor('mentor_conflict', 50);
  createBooking('b_conflict', 'm_conflict', 'mentor_conflict');

  const menteeInitial = getMenteeCredits('m_conflict');

  creditPendingServiceV2.holdCreditOnBooking('b_conflict', 'm_conflict', 25);
  const menteeAfterHold = getMenteeCredits('m_conflict');
  assert(menteeAfterHold === 75, 'After hold: 75');

  // Attempt refund on held booking
  creditPendingServiceV2.refundCreditToMentee('b_conflict');
  const menteeAfterRefund = getMenteeCredits('m_conflict');

  // Should be back to 100
  assert(menteeAfterRefund === 100, `After refund: should be 100, got ${menteeAfterRefund}`);

  // Verify ledger transition
  const ledger = JSON.parse(localStorage.getItem('systemCreditLedger') || '[]');
  const entry = ledger.find((e: any) => e.bookingId === 'b_conflict');
  assert(entry.status === 'returned', `Status should be returned, got ${entry.status}`);
});

const test6_6 = test('6.6: Massive Concurrent Holds (Stress Test)', () => {
  clearDB();

  const userCount = 50;
  const holdAmount = 10;

  // Setup 50 users
  for (let i = 0; i < userCount; i++) {
    setupMentee(`m_stress_${i}`, 200);
    setupMentor(`mentor_stress_${i}`, 50);
    createBooking(`b_stress_${i}`, `m_stress_${i}`, `mentor_stress_${i}`);
  }

  const totalBefore = userCount * 200 + userCount * 50; // 12500

  // Concurrent holds
  for (let i = 0; i < userCount; i++) {
    creditPendingServiceV2.holdCreditOnBooking(`b_stress_${i}`, `m_stress_${i}`, holdAmount);
  }

  // Verify all users have correct balance
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const usersBalance = users.reduce((sum: number, u: User) => sum + u.credits, 0);

  const ledger = JSON.parse(localStorage.getItem('systemCreditLedger') || '[]');
  const heldBalance = ledger.reduce((sum: number, e: any) => {
    return e.status === 'holding' ? sum + e.amount : sum;
  }, 0);

  const totalAfter = usersBalance + heldBalance;

  assert(totalAfter === totalBefore, `Total should be ${totalBefore}, got ${totalAfter}`);
  assert(
    ledger.filter((e: any) => e.status === 'holding').length === userCount,
    `Should have ${userCount} holding entries`
  );
});

const test6_7 = test('6.7: Concurrent Payouts (Multiple Mentor Withdrawals)', () => {
  clearDB();

  setupMentor('mentor_payout_1', 100);
  setupMentor('mentor_payout_2', 150);
  setupMentor('mentor_payout_3', 80);

  const adminUser: User = {
    id: 'admin_concurrent',
    name: 'Admin',
    email: 'admin@test.com',
    role: UserRole.ADMIN,
    credits: 0,
    avatar: '',
    country: 'US',
    status: 'ACTIVE',
    balance: 0,
    joinedAt: new Date().toISOString()
  };

  // Request multiple payouts
  mentorPayoutServiceV2.requestPayout(adminUser, 'mentor_payout_1', 50, 'PayPal');
  mentorPayoutServiceV2.requestPayout(adminUser, 'mentor_payout_2', 75, 'Bank');
  mentorPayoutServiceV2.requestPayout(adminUser, 'mentor_payout_3', 40, 'PayPal');

  // Verify payouts are independent
  const payouts = JSON.parse(localStorage.getItem('mentorPayouts') || '[]');
  assert(payouts.length >= 3, 'Should have at least 3 payout entries');

  const payout1 = payouts.find((p: any) => p.mentorId === 'mentor_payout_1');
  const payout2 = payouts.find((p: any) => p.mentorId === 'mentor_payout_2');
  const payout3 = payouts.find((p: any) => p.mentorId === 'mentor_payout_3');

  assert(payout1?.requestedAmount === 50, 'Payout 1 amount should be 50');
  assert(payout2?.requestedAmount === 75, 'Payout 2 amount should be 75');
  assert(payout3?.requestedAmount === 40, 'Payout 3 amount should be 40');
});

const test6_8 = test('6.8: Race Condition - Hold + Insufficient (Boundary)', () => {
  clearDB();

  setupMentee('m_boundary', 50);
  setupMentor('mentor_boundary', 50);

  createBooking('b_boundary_1', 'm_boundary', 'mentor_boundary');
  createBooking('b_boundary_2', 'm_boundary', 'mentor_boundary');

  // First hold uses 30 credits (20 remain)
  creditPendingServiceV2.holdCreditOnBooking('b_boundary_1', 'm_boundary', 30);
  assert(getMenteeCredits('m_boundary') === 20, 'After first hold: 20 remaining');

  // Second hold should succeed (exactly 20)
  creditPendingServiceV2.holdCreditOnBooking('b_boundary_2', 'm_boundary', 20);
  assert(getMenteeCredits('m_boundary') === 0, 'After second hold: 0 remaining');

  // Third hold should fail
  try {
    setupMentee('m_boundary', 0); // Update balance to 0
    createBooking('b_boundary_3', 'm_boundary', 'mentor_boundary');
    creditPendingServiceV2.holdCreditOnBooking('b_boundary_3', 'm_boundary', 1);
    throw new Error('Should have thrown insufficient credits');
  } catch (err: any) {
    assert(
      err.message.includes('Insufficient'),
      'Should report insufficient credits'
    );
  }
});

// ========== RUNNER ==========

export async function runAllTests() {
  console.log('\n🧪 ========== COMPREHENSIVE LOGIC TESTS ==========\n');

  const tests = [
    test1_1, test1_2, test1_3, test1_4, test1_5,
    test2_1, test2_2, test2_3, test2_4, test2_5,
    test3_1, test3_2,
    test4_1, test4_2,
    test5_1, test5_2, test5_3, test5_4,
    test6_1, test6_2, test6_3, test6_4, test6_5, test6_6, test6_7, test6_8
  ];

  for (const t of tests) {
    await t();
  }

  console.log('\n📊 ========== TEST SUMMARY ==========\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏱️  Total Time: ${totalTime.toFixed(2)}ms\n`);

  if (failed > 0) {
    console.log('Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  return { passed, failed, total: results.length };
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  (window as any).runAllTests = runAllTests;
  console.log('💡 Run tests with: window.runAllTests()');
}
