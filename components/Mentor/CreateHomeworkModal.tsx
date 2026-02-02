import React, { useState } from 'react';
import { Booking, Homework } from '../../types';
import { api } from '../../services/api';
import { Modal, ModalFooter } from '../ui/Modal';
import { Button } from '../ui/Button';
import { FileText, Calendar, AlertCircle } from 'lucide-react';

interface CreateHomeworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking;
    onCreated: (homework: Homework) => void;
}

export const CreateHomeworkModal: React.FC<CreateHomeworkModalProps> = ({
    isOpen,
    onClose,
    booking,
    onCreated,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Calculate min/max due dates
    const now = new Date();
    const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const formatDateForInput = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const handleSubmit = async () => {
        // Client-side validation
        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        if (!description.trim()) {
            setError('Description is required');
            return;
        }
        if (!dueDate) {
            setError('Due date is required');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            const homework = await api.createHomework({
                bookingId: booking.id,
                title: title.trim(),
                description: description.trim(),
                dueDate: new Date(dueDate).toISOString(),
            } as any);

            onCreated(homework);
            // Reset form
            setTitle('');
            setDescription('');
            setDueDate('');
        } catch (err: any) {
            setError(err.message || 'Failed to create homework');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setTitle('');
            setDescription('');
            setDueDate('');
            setError('');
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Assign Homework"
            description={`For ${booking.menteeName || 'Student'}`}
            size="md"
        >
            <div className="space-y-5">
                {/* Lesson context */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                    <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600">
                        Lesson on <strong>{new Date(booking.startTime).toLocaleDateString()}</strong>
                    </span>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Vocabulary Practice - Unit 5"
                        className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                        disabled={isSubmitting}
                        maxLength={200}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what the student needs to do..."
                        className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all resize-none"
                        rows={4}
                        disabled={isSubmitting}
                        maxLength={2000}
                    />
                </div>

                {/* Due Date */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        min={formatDateForInput(minDate)}
                        max={formatDateForInput(maxDate)}
                        className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
                        disabled={isSubmitting}
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                        Between {formatDateForInput(minDate)} and {formatDateForInput(maxDate)}
                    </p>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2.5 p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800">
                    <FileText size={16} className="flex-shrink-0 mt-0.5 text-purple-500" />
                    <span>Student will be notified immediately and can submit until the due date.</span>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            <ModalFooter className="mt-6 px-0 py-0 border-0 bg-transparent">
                <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={!title.trim() || !description.trim() || !dueDate}
                >
                    Assign Homework
                </Button>
            </ModalFooter>
        </Modal>
    );
};
