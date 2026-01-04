import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getSubmittedFeedbacks, getPendingFeedbacks } from '../services/api';
import FeedbackCard from '../components/Feedback/FeedbackCard';
import FeedbackViewModal from '../components/Feedback/FeedbackViewModal';
import FeedbackSubmitModal from '../components/Feedback/FeedbackSubmitModal';
import PendingFeedbackCard from '../components/Feedback/PendingFeedbackCard';

const MentorFeedback: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');
  const [submittedFeedbacks, setSubmittedFeedbacks] = useState<any[]>([]);
  const [pendingFeedbacks, setPendingFeedbacks] = useState<any>({ pending: [], overdue: [] });
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'submitted') {
      fetchSubmittedFeedbacks();
    } else {
      fetchPendingFeedbacks();
    }
  }, [activeTab, page]);

  const fetchSubmittedFeedbacks = async () => {
    try {
      setLoading(true);
      const result = await getSubmittedFeedbacks({ page, limit: 10 });
      setSubmittedFeedbacks(result?.feedbacks || []);
      setPagination(result?.pagination || null);
    } catch (error) {
      console.error('Error fetching submitted feedbacks:', error);
      setSubmittedFeedbacks([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingFeedbacks = async () => {
    try {
      setLoading(true);
      const result = await getPendingFeedbacks();
      setPendingFeedbacks(result || { pending: [], overdue: [] });
    } catch (error) {
      console.error('Error fetching pending feedbacks:', error);
      setPendingFeedbacks({ pending: [], overdue: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = (feedback: any) => {
    setSelectedFeedback(feedback);
    setIsViewModalOpen(true);
  };

  const handleSubmitFeedback = (booking: any) => {
    setSelectedBooking(booking);
    setIsSubmitModalOpen(true);
  };

  const handleFeedbackSubmitted = () => {
    fetchPendingFeedbacks();
    if (activeTab === 'submitted') {
      fetchSubmittedFeedbacks();
    }
  };

  const totalPending = (pendingFeedbacks?.pending?.length || 0) + (pendingFeedbacks?.overdue?.length || 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          Session Feedback
        </h1>
        <p className="text-gray-600 mt-2">
          Provide feedback to your students and track your submissions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('pending');
            setPage(1);
          }}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'pending'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending
            {totalPending > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {totalPending}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('submitted');
            setPage(1);
          }}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'submitted'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Submitted
          </div>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'pending' ? (
        <div className="space-y-6">
          {/* Overdue */}
          {pendingFeedbacks.overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-red-900">
                  Overdue ({pendingFeedbacks.overdue.length})
                </h2>
              </div>
              <div className="space-y-4">
                {pendingFeedbacks.overdue.map((item: any) => (
                  <PendingFeedbackCard
                    key={item.booking.id}
                    booking={item.booking}
                    deadline={item.deadline}
                    hoursLeft={item.hoursLeft}
                    isOverdue={item.isOverdue}
                    onSubmit={() => handleSubmitFeedback(item.booking)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pending */}
          {pendingFeedbacks.pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Pending ({pendingFeedbacks.pending.length})
                </h2>
              </div>
              <div className="space-y-4">
                {pendingFeedbacks.pending.map((item: any) => (
                  <PendingFeedbackCard
                    key={item.booking.id}
                    booking={item.booking}
                    deadline={item.deadline}
                    hoursLeft={item.hoursLeft}
                    isOverdue={item.isOverdue}
                    onSubmit={() => handleSubmitFeedback(item.booking)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalPending === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-600">
                You've submitted feedback for all completed sessions
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {submittedFeedbacks.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Submitted Feedback
              </h3>
              <p className="text-gray-600">
                Your submitted feedback will appear here
              </p>
            </div>
          ) : (
            submittedFeedbacks.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onClick={() => handleViewFeedback(feedback)}
                userRole="MENTOR"
              />
            ))
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
        </div>
      )}

      {/* Modals */}
      <FeedbackViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedFeedback(null);
        }}
        feedback={selectedFeedback}
      />

      <FeedbackSubmitModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onSuccess={handleFeedbackSubmitted}
      />
    </div>
  );
};

export default MentorFeedback;
