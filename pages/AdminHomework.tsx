
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AdminLayout, StatusBadge } from '../components/AdminComponents';
import { Homework, Mentor } from '../types';
import { FileText, Download, Filter } from 'lucide-react';

export default function AdminHomework() {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [filterMentorId, setFilterMentorId] = useState<string>('ALL');

  useEffect(() => {
    const loadData = async () => {
      const data = await api.getAllHomework();
      const mentorData = await api.getMentors();
      setHomeworkList(data);
      setMentors(mentorData);
    };
    loadData();
  }, []);

  const filteredHomework = homeworkList.filter(h => 
    filterMentorId === 'ALL' || h.mentorId === filterMentorId
  );

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900">Homework Management</h1>
            
            <div className="flex gap-4 items-center w-full md:w-auto">
                {/* Mentor Filter */}
                <div className="relative flex-1 md:flex-none">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        value={filterMentorId}
                        onChange={(e) => setFilterMentorId(e.target.value)}
                        className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none bg-white"
                    >
                        <option value="ALL">All Mentors</option>
                        {mentors.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 shadow-sm whitespace-nowrap">
                    Total: {filteredHomework.length}
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Mentor</th>
                <th className="px-6 py-4">Mentee ID</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submission</th>
                <th className="px-6 py-4">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHomework.map(h => {
                const mentor = mentors.find(m => m.id === h.mentorId);
                return (
                <tr key={h.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{h.title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px]">{h.description}</div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{mentor ? mentor.name : h.mentorId}</div>
                      <div className="text-xs text-slate-500 font-mono">{h.mentorId}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{h.menteeId}</td>
                  <td className="px-6 py-4 text-slate-500">{h.dueDate ? new Date(h.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4"><StatusBadge status={h.status} /></td>
                  <td className="px-6 py-4">
                      {h.studentSubmission ? (
                          <span className="flex items-center text-blue-600 text-xs font-medium cursor-pointer hover:underline">
                              <FileText size={14} className="mr-1" /> View File
                          </span>
                      ) : (
                          <span className="text-slate-400 text-xs">-</span>
                      )}
                  </td>
                  <td className="px-6 py-4">
                      {h.grade ? (
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{h.grade}</span>
                      ) : '-'}
                  </td>
                </tr>
              )})}
              {filteredHomework.length === 0 && (
                  <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No homework found matching filters.</td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
