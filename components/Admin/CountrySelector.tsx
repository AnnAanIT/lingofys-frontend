
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PricingCountry } from '../../types';
import { Globe, Loader2 } from 'lucide-react';

interface CountrySelectorProps {
    value?: string; // Country name or code, user data stores country name generally, but we need to map it carefully
    onChange: (countryCode: string) => void;
    label?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({ value, onChange, label = "User Country" }) => {
    const [countries, setCountries] = useState<PricingCountry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await api.getPricingCountries();
            setCountries(data);
            setLoading(false);
        };
        load();
    }, []);

    // Helper: Match input value (name or code) to pricing country
    // The user record currently stores "Country Name" (e.g. 'Vietnam'). 
    // Pricing stores ID='VN', name='Vietnam'.
    // We should ideally store code, but for demo continuity we might need to map back and forth or just update user to use code.
    // Let's assume we want to store the Code (ID) going forward for better pricing logic.
    
    // Match by id (code) or name, case-insensitive for id
    const selectedCountry = countries.find(c =>
        c.name === value ||
        c.id === value ||
        c.id?.toLowerCase() === value?.toLowerCase()
    );

    console.log('🌍 [CountrySelector] Debug:', {
        inputValue: value,
        countriesCount: countries.length,
        selectedCountry: selectedCountry?.id || 'NOT FOUND',
        allCountryIds: countries.map(c => c.id)
    });

    if (loading) return <div className="flex items-center text-sm text-slate-400"><Loader2 className="animate-spin mr-2" size={14}/> Loading countries...</div>;

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-sm font-bold text-slate-700 flex items-center mb-2">
                <Globe size={16} className="mr-2 text-brand-600" />
                {label}
            </label>
            <select
                value={selectedCountry?.id || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            >
                <option value="">Select country...</option>
                {countries.map(country => (
                    <option key={country.id} value={country.id}>
                        {country.name}
                    </option>
                ))}
            </select>
        </div>
    );
};
