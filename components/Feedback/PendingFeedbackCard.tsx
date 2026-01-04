import React from 'react';
import { Clock, AlertCircle, Calendar } from 'lucide-react';

interface PendingFeedbackCardProps {
  booking: {
    id: string;
    startTime: string;
    endTime: string;
    mentee: {
      name: string;
      avatar?: string;
    };
  };
  deadline: string;
  hoursLeft: number;
  isOverdue: boolean;
  onSubmit: () => void;
}

const PendingFeedbackCard: React.FC<PendingFeedbackCardProps> = ({
  booking,
  hoursLeft,
  isOverdue,
  onSubmit
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 ${
        isOverdue
          ? 'border-red-500 border-2 bg-red-50'
          : hoursLeft <= 6
          ? 'border-yellow-500 border-2 bg-yellow-50'
          : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
          {booking.mentee.avatar ? (
            <img
              src={booking.mentee.avatar}
              alt={booking.mentee.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-lg">
              {booking.mentee.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Session with {booking.mentee.name}
                {isOverdue && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(booking.startTime)}
              </div>
            </div>
          </div>

          {/* Deadline Warning */}
          <div
            className={`flex items-center gap-2 text-sm mb-3 ${
              isOverdue
                ? 'text-red-700'
                : hoursLeft <= 6
                ? 'text-yellow-700'
                : 'text-gray-600'
            }`}
          >
            <Clock className="w-4 h-4" />
            {isOverdue ? (
              <span className="font-medium">Overdue! Please submit ASAP</span>
            ) : hoursLeft <= 6 ? (
              <span className="font-medium">
                Only {hoursLeft} hour{hoursLeft !== 1 ? 's' : ''} left to submit
              </span>
            ) : (
              <span>
                Submit within {hoursLeft} hour{hoursLeft !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={onSubmit}
            className={`w-full px-4 py-2 rounded-md text-white font-medium transition-colors ${
              isOverdue
                ? 'bg-red-600 hover:bg-red-700'
                : hoursLeft <= 6
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isOverdue ? 'Submit Feedback Now!' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingFeedbackCard;
