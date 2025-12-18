
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Mentor } from '../types';
import { Navbar, Footer } from '../components/landing/Sections';
import { MentorCard } from '../components/FindMentor/MentorCard';
import { Search, Loader2 } from 'lucide-react';

export default function PublicMentorBrowse() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getMentors().then(data => {
      setMentors(data);
      setLoading(false);
    });
  }, []);

  const filtered = mentors.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />
      <main className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Find Your Perfect Mentor</h1>
          <p className="text-lg text-slate-600">Browse our global network of English experts.</p>
        </div>

        <div className="max-w-2xl mx-auto mb-12 relative">
           <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
           <input 
             type="text"
             placeholder="Search by name or specialty..."
             className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
             value={search}
             onChange={e => setSearch(e.target.value)}
           />
        </div>

        {loading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={32} /></div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map(m => (
                 <div key={m.id} className="relative">
                     <MentorCard mentor={m} onSelect={() => navigate('/login')} />
                     {/* Overlay to encourage login */}
                     <div className="absolute inset-0 z-10" onClick={() => navigate('/login')}></div>
                 </div>
              ))}
           </div>
        )}
        
        {!loading && filtered.length === 0 && (
            <div className="text-center py-20 text-slate-500">
                No mentors found. Try a different search.
            </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
