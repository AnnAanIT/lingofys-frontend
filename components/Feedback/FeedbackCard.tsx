import React from 'react';
import { Star, Calendar, Eye } from 'lucide-react';

interface FeedbackCardProps {
  feedback: {
    id: string;
    rating: number;
    strengths: string;
    submittedAt: string;
    viewedAt?: string;
    mentor?: {
      name: string;
      avatar?: string;
    };
    mentee?: {
      name: string;
      avatar?: string;
    };
    booking: {
      startTime: string;
    };
  };
  onClick: () => void;
  userRole: 'MENTOR' | 'MENTEE' | 'ADMIN';
}

import { formatDate } from '../../utils/dateFormatters'; // ✅ FIX: Use centralized date formatter

const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, onClick, userRole }) => {
  // ✅ FIX: Removed local formatDate - now using centralized formatter

  const displayUser = userRole === 'MENTEE' ? feedback.mentor : feedback.mentee;
  const isUnread = userRole === 'MENTEE' && !feedback.viewedAt;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isUnread ? 'border-blue-500 border-2' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
          {displayUser?.avatar ? (
            <img
              src={displayUser.avatar}
              alt={displayUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-lg">
              {displayUser?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {userRole === 'MENTEE' ? 'From' : 'For'} {displayUser?.name}
                {isUnread && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    New
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(feedback.booking.startTime)}
                </span>
                {feedback.viewedAt && userRole === 'MENTEE' && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <Eye className="w-3.5 h-3.5" />
                    Viewed
                  </span>
                )}
              </div>
            </div>

            {/* Rating Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= feedback.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
              <span className="ml-1 text-sm font-semibold text-gray-700">
                {feedback.rating}
              </span>
            </div>
          </div>

          {/* Preview */}
          <p className="text-sm text-gray-600 line-clamp-2">
            {feedback.strengths}
          </p>

          <div className="mt-3 text-xs text-gray-500">
            Submitted {formatDate(feedback.submittedAt)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackCard;
