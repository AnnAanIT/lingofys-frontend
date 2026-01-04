
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Mentor, PricingGroup } from '../types';
import { MentorCard } from '../components/FindMentor/MentorCard';
import { Search, Filter, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../App';
import { translations } from '../lib/i18n';

export default function MenteeFindMentor() {
  const { language } = useApp();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [groups, setGroups] = useState<PricingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const t = translations[language].mentee;
  const commonT = translations[language].common;

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
        const [mentorsData, groupsData] = await Promise.all([
            api.getMentors(),
            api.getPricingGroups()
        ]);
        setMentors(mentorsData);
        setGroups(groupsData);
        setLoading(false);
    };
    fetchData();
  }, []);

  // Extract all unique specialties for filter tags
  const allSpecialties = useMemo(() => 
    Array.from(new Set(mentors.flatMap(m => m.specialties))),
    [mentors]
  );

  // Extract all unique teaching languages for filter
  const allLanguages = useMemo(() => {
    console.log('🔍 [Language Filter Debug] All mentors:', mentors);
    console.log('🔍 [Language Filter Debug] teachingLanguages:', mentors.map(m => ({ name: m.name, teachingLanguages: m.teachingLanguages })));
    const langs = Array.from(new Set(mentors.flatMap(m => m.teachingLanguages || [])));
    console.log('🔍 [Language Filter Debug] Extracted languages:', langs);
    return langs;
  }, [mentors]);

  // Optimized Filter logic using useMemo
  const filteredMentors = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return mentors.filter(m => {
        const matchesSearch = !searchTerm || 
                              m.name.toLowerCase().includes(searchLower) || 
                              m.specialties.some(s => s.toLowerCase().includes(searchLower));
        
        const matchesGroup = selectedGroup === 'ALL' || (m.mentorGroupId || 'basic') === selectedGroup;
        const matchesSpecialty = selectedSpecialty === 'ALL' || m.specialties.includes(selectedSpecialty);
        const matchesLanguage = selectedLanguage === 'ALL' || (m.teachingLanguages || []).includes(selectedLanguage);

        return matchesSearch && matchesGroup && matchesSpecialty && matchesLanguage;
    });
  }, [mentors, searchTerm, selectedGroup, selectedSpecialty, selectedLanguage]);

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto min-h-screen pb-20">
      
      <div className="text-center space-y-4 pt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t.findMentorTitle}
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              {t.findMentorSubtitle}
          </p>
      </div>

      <div className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md py-4 border-b border-slate-200 -mx-6 px-6 md:mx-0 md:px-0 md:bg-transparent md:border-none md:static">
          <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
              <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
                  </div>
                  <input 
                      type="text" 
                      placeholder={t.searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
                  />
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                  <div className="relative min-w-[160px]">
                      <select
                          value={selectedGroup}
                          onChange={(e) => setSelectedGroup(e.target.value)}
                          className="w-full appearance-none pl-4 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 font-medium cursor-pointer"
                      >
                          <option value="ALL">{t.allLevels}</option>
                          {groups.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                      </select>
                      <Filter className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                  </div>
              </div>
          </div>

          {/* Language Filter Tags */}
          {allLanguages.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-4xl mx-auto">
                  <button
                      onClick={() => setSelectedLanguage('ALL')}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                          selectedLanguage === 'ALL'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600'
                      }`}
                  >
                      {t.allLanguages || 'All Languages'}
                  </button>
                  {allLanguages.map(lang => {
                      // Language flag mapping
                      const flagMap: Record<string, string> = {
                          'English': '🇬🇧',
                          'Chinese': '🇨🇳',
                          'Japanese': '🇯🇵',
                          'Korean': '🇰🇷'
                      };
                      const flag = flagMap[lang] || '🌐';
                      
                      return (
                          <button 
                              key={lang}
                              onClick={() => setSelectedLanguage(selectedLanguage === lang ? 'ALL' : lang)}
                              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                                  selectedLanguage === lang 
                                  ? 'bg-purple-600 text-white border-purple-600' 
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600'
                              }`}
                          >
                              {flag} {lang}
                          </button>
                      );
                  })}
              </div>
          )}

          {/* Specialty Filter Tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-4xl mx-auto">
              <button
                  onClick={() => setSelectedSpecialty('ALL')}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selectedSpecialty === 'ALL'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
              >
                  {t.allTopics}
              </button>
              {allSpecialties.slice(0, 6).map(s => (
                  <button 
                      key={s}
                      onClick={() => setSelectedSpecialty(selectedSpecialty === s ? 'ALL' : s)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                          selectedSpecialty === s 
                          ? 'bg-brand-600 text-white border-brand-600' 
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-200 hover:text-brand-600'
                      }`}
                  >
                      {s}
                  </button>
              ))}
          </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="animate-spin mb-4 text-brand-500" size={32} />
            <p>{commonT.loading}</p>
        </div>
      ) : (
        <>
            <div className="flex justify-between items-center text-sm text-slate-500 px-2">
                <span className="font-medium">{t.mentorsAvailable.replace('{count}', filteredMentors.length.toString())}</span>
                <span className="flex items-center gap-1"><Sparkles size={14} className="text-yellow-500"/> {t.recommended}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMentors.map(mentor => (
                    <MentorCard 
                        key={mentor.id} 
                        mentor={mentor} 
                        onSelect={() => navigate(`/mentee/find-mentor/${mentor.id}`)}
                    />
                ))}
            </div>
            
            {filteredMentors.length === 0 && (
                <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Search size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{t.noMentorsFound}</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mb-6">{t.noMentorsDesc}</p>
                </div>
            )}
        </>
      )}
    </div>
  );
}
