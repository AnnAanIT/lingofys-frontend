
import React, { useState } from 'react';
import { X, Clock, Trash2, RotateCw } from 'lucide-react';
import { AvailabilitySlot } from '../types';

interface EditAvailabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    slot: AvailabilitySlot;
    onUpdate: (id: string, updates: Partial<AvailabilitySlot>) => void;
    onDelete: (id: string) => void;
}

export const EditAvailabilityModal: React.FC<EditAvailabilityModalProps> = ({ isOpen, onClose, slot, onUpdate, onDelete }) => {
    const [startTime, setStartTime] = useState(slot.startTime);
    const [duration, setDuration] = useState(slot.duration);
    const [recurring, setRecurring] = useState(slot.recurring);

    if (!isOpen) return null;

    const handleUpdate = () => {
        onUpdate(slot.id, { startTime, duration, recurring });
        onClose();
    };

    const handleDelete = () => {
        if(window.confirm('Are you sure you want to delete this availability slot?')) {
            onDelete(slot.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-slide-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                
                <h3 className="text-lg font-bold text-slate-900 mb-6">Edit Availability</h3>

                <div className="space-y-4">
                     <div className="p-3 bg-brand-50 rounded-lg border border-brand-100 text-center">
                        <div className="text-sm text-brand-700 font-bold uppercase tracking-wide">{slot.day}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Time</label>
                            <input 
                                type="time" 
                                value={startTime} 
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration</label>
                            <select 
                                value={duration} 
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                            >
                                <option value={30}>30 Min</option>
                                <option value={60}>60 Min</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input 
                            type="checkbox" 
                            id="recurring" 
                            checked={recurring} 
                            onChange={(e) => setRecurring(e.target.checked)}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor="recurring" className="text-sm text-slate-700 flex items-center gap-1">
                            <RotateCw size={12} /> Recurring Weekly
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-8 border-t border-slate-100 pt-4">
                    <button 
                        onClick={handleDelete} 
                        className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                        title="Delete Slot"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button onClick={handleUpdate} className="flex-1 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-md">
                        Update Slot
                    </button>
                </div>
            </div>
        </div>
    );
};
