
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Video, ArrowRight } from 'lucide-react';

export default function BookingSuccess() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-8 text-center animate-slide-up">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} />
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Booking Confirmed!</h1>
            <p className="text-slate-500 mb-8">Your session has been successfully scheduled. We've sent a calendar invite to your email.</p>

            <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left space-y-4 border border-slate-100">
                <div className="flex items-center space-x-3">
                    <Calendar className="text-brand-600" size={20} />
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Booking ID</div>
                        <div className="font-mono font-medium text-slate-800">#{bookingId}</div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Video className="text-brand-600" size={20} />
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Join Link</div>
                        <div className="text-sm text-blue-600 underline cursor-pointer">meet.google.com/abc-xyz-123</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col space-y-3">
                <button 
                    onClick={() => navigate('/mentee/schedule')}
                    className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-100"
                >
                    View My Schedule
                </button>
                <button 
                    onClick={() => navigate('/mentee/find-mentor')}
                    className="w-full py-3 bg-white text-slate-600 hover:bg-slate-50 rounded-xl font-medium"
                >
                    Book Another Class
                </button>
            </div>
        </div>
    </div>
  );
}
