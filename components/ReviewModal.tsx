
import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => void;
    mentorName: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, onSubmit, mentorName }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (comment.trim().length < 5) {
            alert("Please leave a short comment (min 5 chars).");
            return;
        }
        onSubmit(rating, comment);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">Rate your lesson</h3>
                <p className="text-sm text-slate-500 mb-6">How was your session with <strong>{mentorName}</strong>?</p>

                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            className="transition-transform hover:scale-110 focus:outline-none"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        >
                            <Star 
                                size={32} 
                                className={`${(hoverRating || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                            />
                        </button>
                    ))}
                </div>

                <div className="text-left mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Write a review</label>
                    <textarea 
                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm resize-none"
                        rows={3}
                        placeholder="Tell us what you liked..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                </div>

                <button 
                    onClick={handleSubmit}
                    className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-100"
                >
                    Submit Review
                </button>
            </div>
        </div>
    );
};
