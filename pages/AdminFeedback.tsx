import React, { useState, useEffect } from 'react';
import { MessageSquare, BarChart3, AlertTriangle, Star } from 'lucide-react';
import { getAllFeedbacks, getFeedbackStats, getOverdueFeedbacks } from '../services/api';
import FeedbackCard from '../components/Feedback/FeedbackCard';
import FeedbackViewModal from '../components/Feedback/FeedbackViewModal';

const AdminFeedback: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'stats' | 'overdue'>('stats');
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [overdueFeedbacks, setOverdueFeedbacks] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllFeedbacks();
    } else if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'overdue') {
      fetchOverdueFeedbacks();
    }
  }, [activeTab, page]);

  const fetchAllFeedbacks = async () => {
    try {
      setLoading(true);
      const result = await getAllFeedbacks({ page, limit: 10 });
      setFeedbacks(result.feedbacks);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const result = await getFeedbackStats();
      setStats(result);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverdueFeedbacks = async () => {
    try {
      setLoading(true);
      const result = await getOverdueFeedbacks();
      setOverdueFeedbacks(result);
    } catch (error) {
      console.error('Error fetching overdue feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = (feedback: any) => {
    setSelectedFeedback(feedback);
    setIsViewModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          Feedback Management
        </h1>
        <p className="text-gray-600 mt-2">
          Monitor and analyze session feedback across the platform
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('stats'); setPage(1); }}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'stats'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statistics
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('all'); setPage(1); }}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            All Feedback
          </div>
        </button>
        <button
          onClick={() => { setActiveTab('overdue'); setPage(1); }}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'overdue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Overdue
            {stats && stats.overdueCount > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.overdueCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'stats' ? (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Total Feedback</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.totalFeedbacks || 0}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Average Rating</p>
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <p className="text-3xl font-bold text-yellow-600">{stats?.averageRating || 0}/5</p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">On-Time Submission</p>
              <p className="text-3xl font-bold text-green-600">{stats?.onTimeRate || 0}%</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <p className="text-sm text-gray-600 mb-1">Overdue</p>
              <p className="text-3xl font-bold text-red-600">{stats?.overdueCount || 0}</p>
            </div>
          </div>

          {/* Top Mentors */}
          {stats?.topMentors && stats.topMentors.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Rated Mentors</h2>
              <div className="space-y-3">
                {stats.topMentors.map((item: any, index: number) => (
                  <div key={item.mentor.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {item.mentor.avatar ? (
                        <img src={item.mentor.avatar} alt={item.mentor.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-blue-600 font-semibold">{item.mentor.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.mentor.name}</p>
                      <p className="text-sm text-gray-600">{item.totalFeedbacks} reviews</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-lg font-bold text-gray-900">{item.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'all' ? (
        <div className="space-y-4">
          {feedbacks.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Yet</h3>
              <p className="text-gray-600">Feedback will appear here once mentors submit them</p>
            </div>
          ) : (
            feedbacks.map((feedback) => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                onClick={() => handleViewFeedback(feedback)}
                userRole="ADMIN"
              />
            ))
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700">Page {page} of {pagination.totalPages}</span>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {overdueFeedbacks.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Overdue Feedback</h3>
              <p className="text-gray-600">All mentors are submitting feedback on time</p>
            </div>
          ) : (
            overdueFeedbacks.map((item: any) => (
              <div key={item.booking.id} className="bg-white rounded-lg border-2 border-red-500 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Mentor: {item.booking.mentor.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Mentee: {item.booking.mentee.name}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Session: {new Date(item.booking.startTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-700">Overdue by</div>
                    <div className="text-2xl font-bold text-red-600">{item.hoursOverdue}h</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* View Modal */}
      <FeedbackViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedFeedback(null);
        }}
        feedback={selectedFeedback}
      />
    </div>
  );
};

export default AdminFeedback;
