
import React, { useState, useEffect } from 'react';
import { Mentor } from '../../types';
import { Star, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../App';

interface MentorCardProps {
    mentor: Mentor;
    onSelect: () => void;
}

export const MentorCard: React.FC<MentorCardProps> = ({ mentor, onSelect }) => {
    const { user } = useApp();
    const [displayRate, setDisplayRate] = useState<number | null>(null);

    useEffect(() => {
        const fetchRate = async () => {
            try {
                // Calculate rate dynamically based on current viewer's country
                const rateData = await api.getMentorLocalizedRate(mentor.id, user?.country || 'US');
                // Extract the localizedRate number from the response object
                const rate = typeof rateData === 'object' && rateData !== null
                    ? (rateData as any).localizedRate
                    : rateData;
                setDisplayRate(rate);
            } catch (error) {
                console.error('Failed to fetch localized rate:', error);
                // No fallback - rate must be fetched from backend
                setDisplayRate(0);
            }
        };
        fetchRate();
    }, [mentor.id, user?.country]);

    return (
        <div className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 overflow-hidden flex flex-col h-full">
            <div className="p-6 flex flex-col items-center flex-1">
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-brand-100 to-blue-50">
                        <img 
                            src={mentor.avatar} 
                            alt={mentor.name} 
                            className="w-full h-full rounded-full object-cover border-2 border-white" 
                        />
                    </div>
                    <div className="absolute -bottom-2 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100 flex items-center text-xs font-bold text-slate-800">
                        <Star size={10} className="text-yellow-400 mr-1 fill-current" />
                        {mentor.rating}
                    </div>
                </div>

                <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center justify-center gap-1">
                        {mentor.name}
                        {mentor.mentorGroupId === 'expert' && <ShieldCheck size={16} className="text-blue-500" />}
                        {mentor.mentorGroupId === 'native' && <ShieldCheck size={16} className="text-purple-500" />}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center justify-center mt-1">
                        <MapPin size={12} className="mr-1" /> {mentor.country}
                    </p>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                    {(mentor.specialties || []).slice(0, 3).map(s => (
                        <span key={s} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-md font-medium border border-slate-100">
                            {s}
                        </span>
                    ))}
                </div>

                {/* Teaching Languages with flags */}
                {mentor.teachingLanguages && mentor.teachingLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                        {mentor.teachingLanguages.map(lang => {
                            const flags: Record<string, string> = {
                                'English': '🇬🇧',
                                'Chinese': '🇨🇳',
                                'Japanese': '🇯🇵',
                                'Korean': '🇰🇷'
                            };
                            return (
                                <span key={lang} className="px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded-md font-bold border border-brand-200">
                                    {flags[lang] || '🌐'} {lang}
                                </span>
                            );
                        })}
                    </div>
                )}

                <p className="text-slate-500 text-sm text-center line-clamp-2 mb-4 px-2">
                    {mentor.headline}
                </p>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                    <div className="text-xs text-slate-400 uppercase font-bold">Your Rate</div>
                    <div className="font-bold text-slate-900">
                        {displayRate !== null ? displayRate : '...'} <span className="text-xs font-normal text-slate-500">Credits/hr</span>
                    </div>
                </div>
                <button 
                    onClick={onSelect}
                    className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-bold hover:bg-brand-600 hover:text-white hover:border-brand-600 transition-all flex items-center shadow-sm"
                >
                    Availability <ArrowRight size={14} className="ml-1" />
                </button>
            </div>
        </div>
    );
};
