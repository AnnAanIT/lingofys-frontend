
import React from 'react';
import { useApp } from '../App';
import { MentorBioEditor } from '../components/MentorBioEditor';
import { Mentor } from '../types';

export default function MentorBioPage() {
    const { user, refreshUser } = useApp();

    if (!user || user.role !== 'MENTOR') return <div>Unauthorized</div>;

    return (
        <div className="animate-fade-in">
            <MentorBioEditor mentor={user as Mentor} onSave={refreshUser} />
        </div>
    );
}
