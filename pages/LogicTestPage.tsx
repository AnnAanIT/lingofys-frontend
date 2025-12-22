import React, { useState } from 'react';
import { ChevronDown, CheckCircle, XCircle, Clock } from 'lucide-react';
import { runAllTests } from '../lib/v2/logicTests';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export default function LogicTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      const result = await runAllTests();
      // Collect results from localStorage or console
      console.log('Test results:', result);
      setResults([]); // Update with actual results
    } catch (err) {
      console.error('Error running tests:', err);
    }
    
    setIsRunning(false);
  };

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Logic Test Suite</h1>
          <p className="text-slate-600">Comprehensive tests for all business logic flows</p>
        </div>

        {/* Run Button */}
        <div className="mb-6">
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              isRunning
                ? 'bg-slate-300 text-slate-600 cursor-not-allowed'
                : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95'
            }`}
          >
            {isRunning ? '⏳ Running Tests...' : '▶️ Run All Tests'}
          </button>
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-2xl font-bold text-green-600">{passed}</div>
              <div className="text-sm text-slate-600">Passed</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-2xl font-bold text-red-600">{failed}</div>
              <div className="text-sm text-slate-600">Failed</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-2xl font-bold text-slate-600">{results.length}</div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-2">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === result.name ? null : result.name)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors"
              >
                {result.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                
                <span className={result.passed ? 'text-green-700' : 'text-red-700'}>
                  {result.name}
                </span>

                <span className="ml-auto flex items-center gap-2 text-slate-600 text-sm">
                  <Clock className="w-4 h-4" />
                  {result.duration.toFixed(2)}ms
                </span>

                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    expanded === result.name ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expanded === result.name && result.error && (
                <div className="px-4 py-3 bg-red-50 border-t border-slate-200">
                  <p className="text-red-700 font-mono text-sm">{result.error}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Test Categories Info */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Credit Pending Engine</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Hold credit on booking</li>
              <li>✓ Release credit to mentor</li>
              <li>✓ Refund credit on cancellation</li>
              <li>✓ Error handling</li>
            </ul>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Pricing Revenue Engine</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✓ Basic calculations</li>
              <li>✓ Country multipliers</li>
              <li>✓ Mentor group rates</li>
              <li>✓ Combined multipliers</li>
            </ul>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">Provider Commissions</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>✓ Commission calculation</li>
              <li>✓ Top-up processing</li>
              <li>✓ Payout tracking</li>
            </ul>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-2">Financial Integrity</h3>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>✓ Credit conservation</li>
              <li>✓ Audit trails</li>
              <li>✓ Zero-sum verification</li>
            </ul>
          </div>
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-slate-100 p-6 rounded-lg border border-slate-300">
          <h3 className="font-semibold text-slate-900 mb-3">📋 Test Coverage</h3>
          <p className="text-slate-700 mb-3">
            This test suite validates all critical business logic:
          </p>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>✅ 18+ comprehensive test cases</li>
            <li>✅ Credit flow (hold → release/refund)</li>
            <li>✅ Pricing calculations with multipliers</li>
            <li>✅ Commission processing</li>
            <li>✅ Mentor payout validation</li>
            <li>✅ Financial integrity constraints</li>
            <li>✅ Edge cases and error handling</li>
            <li>✅ Conversion & settlement ratios</li>
          </ul>
        </div>

        {/* Key Invariants */}
        <div className="mt-6 bg-amber-50 p-6 rounded-lg border border-amber-200">
          <h3 className="font-semibold text-amber-900 mb-3">🔐 Critical Invariants</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-amber-900">
            <div>
              <strong>Credit Conservation:</strong><br/>
              Σ(user credits) = constant
            </div>
            <div>
              <strong>No Double Processing:</strong><br/>
              Same operation is idempotent
            </div>
            <div>
              <strong>Audit Trail:</strong><br/>
              Every op logged in ledger
            </div>
            <div>
              <strong>Ratio Applied:</strong><br/>
              0.8 conversion, 0.9 settlement
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
