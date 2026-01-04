import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { submitFeedback } from '../../services/api';

interface FeedbackSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    mentee: {
      name: string;
    };
    startTime: string;
    endTime: string;
  };
  onSuccess: () => void;
}

const FeedbackSubmitModal: React.FC<FeedbackSubmitModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess
}) => {
  const [rating, setRating] = useState(5);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!strengths.trim() || !improvements.trim() || !nextSteps.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      await submitFeedback({
        bookingId: booking.id,
        rating,
        strengths: strengths.trim(),
        improvements: improvements.trim(),
        nextSteps: nextSteps.trim(),
        notes: notes.trim() || undefined
      });

      onSuccess();
      onClose();

      // Reset form
      setRating(5);
      setStrengths('');
      setImprovements('');
      setNextSteps('');
      setNotes('');
    } catch (err: any) {
      console.error('Submit feedback error:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Submit Feedback</h2>
            <p className="text-sm text-gray-600 mt-1">
              Session with {booking.mentee.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-lg font-semibold text-gray-700">
                {rating}/5
              </span>
            </div>
          </div>

          {/* Strengths */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Strengths <span className="text-red-500">*</span>
            </label>
            <textarea
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="What did the student do well? What were their strong points?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Highlight what the student excelled at during the session
            </p>
          </div>

          {/* Areas for Improvement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Areas for Improvement <span className="text-red-500">*</span>
            </label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="What areas need more work? What should they focus on?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Provide constructive feedback on areas that need development
            </p>
          </div>

          {/* Next Steps */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Steps <span className="text-red-500">*</span>
            </label>
            <textarea
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="What should the student focus on for the next session?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Recommend specific actions or topics for future sessions
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other comments or observations?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackSubmitModal;
