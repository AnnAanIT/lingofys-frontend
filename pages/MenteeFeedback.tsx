import React, { useState, useEffect } from 'react';
import { MessageSquare, Eye, Calendar, Filter } from 'lucide-react';
import { getReceivedFeedbacks, api } from '../services/api';
import FeedbackCard from '../components/Feedback/FeedbackCard';
import FeedbackViewModal from '../components/Feedback/FeedbackViewModal';

const MenteeFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [mentorFilter, setMentorFilter] = useState<string>('');

  useEffect(() => {
    fetchFeedbacks();
  }, [page, mentorFilter]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const result = await getReceivedFeedbacks({
        page,
        limit: 10,
        mentorId: mentorFilter || undefined
      });
      setFeedbacks(result?.feedbacks || []);
      setPagination(result?.pagination || null);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      setFeedbacks([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = async (feedback: any) => {
    try {
      // Call API to get feedback details - this also marks it as read on backend
      const result = await api.getFeedbackById(feedback.id);
      const detailedFeedback = result.data || result;
      setSelectedFeedback(detailedFeedback);
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      // Fallback to existing data if API fails
      setSelectedFeedback(feedback);
    }
    setIsViewModalOpen(true);
  };

  const unreadCount = feedbacks.filter(f => !f.viewedAt).length;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              Session Feedback
            </h1>
            <p className="text-gray-600 mt-2">
              View feedback from your mentors to track your progress
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
              <Eye className="w-5 h-5" />
              <span className="font-medium">{unreadCount} new feedback{unreadCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {feedbacks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Feedback</p>
            <p className="text-2xl font-bold text-gray-900">{pagination?.total || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Average Rating</p>
            <p className="text-2xl font-bold text-yellow-600">
              {(feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)}/5
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Unread</p>
            <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
          </div>
        </div>
      )}

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Feedback Yet
          </h3>
          <p className="text-gray-600">
            Complete sessions with your mentors to receive feedback on your progress
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <FeedbackCard
              key={feedback.id}
              feedback={feedback}
              onClick={() => handleViewFeedback(feedback)}
              userRole="MENTEE"
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* View Modal */}
      <FeedbackViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedFeedback(null);
          // Refresh to update viewedAt
          fetchFeedbacks();
        }}
        feedback={selectedFeedback}
      />
    </div>
  );
};

export default MenteeFeedback;
