import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Mentor } from '../types';
import { Star, MapPin, Globe, ShieldCheck, BookOpen, ArrowLeft, Award, FileVideo } from 'lucide-react';

/**
 * Public Mentor Profile - Simplified Version
 * Visible to ALL users (no login required)
 * Shows: Avatar, Name, Rating, Bio, Experience, Specialties, Reviews
 * Does NOT show: Calendar, Pricing (login required)
 */
export default function PublicMentorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  useEffect(() => {
    if (id) {
      // Fetch mentor data (public API)
      Promise.all([
        api.getMentorById(id),
        fetchReviews(id, 10)
      ])
        .then(([mentorData]) => {
          setMentor(mentorData || null);
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load mentor:', err);
          setMentor(null);
          setLoading(false);
        });
    }
  }, [id]);

  const fetchReviews = async (mentorId: string, limit: number) => {
    setReviewsLoading(true);
    try {
      const data = await api.getMentorReviews(mentorId, limit);
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSignupClick = () => {
    setShowSignupModal(true);
  };

  const handleNavigateToSignup = () => {
    navigate('/signup');
  };

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading mentor profile...</p>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-600">Mentor not found</p>
          <button
            onClick={() => navigate('/find-mentor')}
            className="mt-4 text-brand-600 hover:text-brand-700 font-medium"
          >
            ← Back to Find Mentors
          </button>
        </div>
      </div>
    );
  }

  // Calculate rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => r.rating === stars).length;
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
    return { stars, count, percentage };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/find-mentor')}
            className="flex items-center text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Find Mentors
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={mentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&size=200&background=3b82f6&color=fff`}
                alt={mentor.name}
                className="w-32 h-32 rounded-full border-4 border-brand-100"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{mentor.name}</h1>
              <p className="text-lg text-slate-600 mb-3">Native English Teacher</p>

              {/* Rating */}
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Star size={20} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold text-slate-900">{mentor.rating.toFixed(1)}</span>
                <span className="text-slate-500">· {mentor.reviewCount} reviews</span>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <div className="flex items-center gap-1 text-slate-600">
                  <MapPin size={16} />
                  <span className="text-sm">{mentor.country || 'Location'}</span>
                </div>
                {mentor.specialties?.includes('Native Speaker') && (
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <Globe size={16} />
                    <span className="text-sm font-medium">Native Speaker</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <ShieldCheck size={16} />
                  <span className="text-sm font-medium">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <button
              onClick={handleSignupClick}
              className="w-full md:w-auto px-8 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all text-lg"
            >
              Sign Up to Book Lessons
            </button>
          </div>
        </div>

        {/* Video Introduction */}
        {mentor.videoIntro && (
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileVideo size={24} className="text-brand-600" />
              Introduction Video
            </h2>
            <div className="relative rounded-xl overflow-hidden bg-slate-100">
              <video 
                src={mentor.videoIntro} 
                controls 
                className="w-full"
                style={{ maxHeight: '500px' }}
                preload="metadata"
              >
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        )}

        {/* About Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <BookOpen size={24} className="text-brand-600" />
            About Me
          </h2>

          <p className="text-slate-700 leading-relaxed mb-6">
            {mentor.aboutMe || mentor.headline || 'No bio available'}
          </p>

          {/* Experience */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Award size={20} className="text-brand-600" />
              Experience
            </h3>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-brand-600">•</span>
                <span>{mentor.experienceYears || 0} years teaching experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-600">•</span>
                <span>{mentor.reviewCount || 0}+ students taught</span>
              </li>
              {mentor.specialties?.includes('TESOL Certified') && (
                <li className="flex items-start gap-2">
                  <span className="text-brand-600">•</span>
                  <span>TESOL Certified</span>
                </li>
              )}
            </ul>
          </div>

          {/* Specialties */}
          {mentor.specialties && mentor.specialties.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {mentor.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-brand-50 text-brand-700 rounded-full font-medium text-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Star size={24} className="text-brand-600" />
            Student Reviews ({mentor.reviewCount})
          </h2>

          {/* Rating Breakdown */}
          {reviews.length > 0 && (
            <div className="mb-8 p-6 bg-slate-50 rounded-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Rating Breakdown</h3>
              <div className="space-y-2">
                {ratingBreakdown.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-700 w-8">{stars}★</span>
                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-600 w-16 text-right">{count} reviews</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Reviews */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Reviews</h3>
            
            {reviewsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review, idx) => (
                  <div key={idx} className="border-b border-slate-200 last:border-0 pb-6 last:pb-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                        {review.menteeName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">
                            {review.menteeName ? `${review.menteeName.split(' ')[0]} ${review.menteeName.split(' ').slice(-1)[0].charAt(0)}.` : 'Anonymous'}
                          </span>
                          <span className="text-sm text-slate-500">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={16}
                              className={star <= (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                            />
                          ))}
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {review.review || 'No review text'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No reviews yet</p>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl shadow-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to Start Learning?</h2>
          <p className="text-brand-100 mb-6">Join thousands of students learning with verified teachers</p>
          <button
            onClick={handleSignupClick}
            className="px-8 py-4 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 shadow-lg transition-all text-lg"
          >
            Create Free Account
          </button>
        </div>
      </div>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
            <button
              onClick={() => setShowSignupModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl"
            >
              ×
            </button>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">Sign Up to Continue</h3>
            <p className="text-slate-600 mb-6">Create an account to book lessons with {mentor.name}</p>

            <div className="space-y-3">
              <button
                onClick={handleNavigateToSignup}
                className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all"
              >
                Create Account
              </button>
              <button
                onClick={handleNavigateToLogin}
                className="w-full py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-all"
              >
                Already have an account? Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
