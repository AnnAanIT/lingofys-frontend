import React from 'react';
import { X, Star, Calendar, User } from 'lucide-react';
import { formatDateTime } from '../../utils/dateFormatters'; // ✅ FIX: Use centralized date formatter

interface Feedback {
  id: string;
  rating: number;
  strengths: string;
  improvements: string;
  nextSteps: string;
  notes?: string;
  submittedAt: string;
  mentor: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  booking: {
    id: string;
    startTime: string;
    endTime: string;
  };
}

interface FeedbackViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: Feedback | null;
}

const FeedbackViewModal: React.FC<FeedbackViewModalProps> = ({
  isOpen,
  onClose,
  feedback
}) => {
  if (!isOpen || !feedback) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Session Feedback</h2>
            <p className="text-sm text-gray-600 mt-1">
              From {feedback.mentor.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Mentor Info */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              {feedback.mentor.avatar ? (
                <img
                  src={feedback.mentor.avatar}
                  alt={feedback.mentor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{feedback.mentor.name}</p>
              <p className="text-sm text-gray-600">{feedback.mentor.email}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {formatDateTime(feedback.submittedAt)}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 text-center">
            <p className="text-sm font-medium text-gray-700 mb-2">Overall Rating</p>
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 ${
                    star <= feedback.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-3xl font-bold text-gray-900">{feedback.rating}/5</p>
          </div>

          {/* Strengths */}
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">💪</span>
              Strengths
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{feedback.strengths}</p>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Areas for Improvement
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{feedback.improvements}</p>
          </div>

          {/* Next Steps */}
          <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Next Steps
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{feedback.nextSteps}</p>
          </div>

          {/* Additional Notes */}
          {feedback.notes && (
            <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Additional Notes
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{feedback.notes}</p>
            </div>
          )}

          {/* Session Info */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Session Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Start Time</p>
                <p className="font-medium text-gray-900">{formatDateTime(feedback.booking.startTime)}</p>
              </div>
              <div>
                <p className="text-gray-600">End Time</p>
                <p className="font-medium text-gray-900">{formatDateTime(feedback.booking.endTime)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackViewModal;
