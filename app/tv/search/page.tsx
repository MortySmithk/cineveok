"use client";
import { useState, useEffect } from 'react';
import { useTVNavigation } from '@/app/hooks/useTVNavigation';
import { OnScreenKeyboard } from '../components/OnScreenKeyboard';
import Image from 'next/image';

// Dados de exemplo
const fakeResults = [
    { id: 1, title: "Dudu e Carol GTA 5: A Grande Fuga", poster: "https://i.ytimg.com/vi/example1/hqdefault.jpg" },
    { id: 2, title: "Dudu e Carol jogando Minecraft", poster: "https://i.ytimg.com/vi/example2/hqdefault.jpg" },
];

export default function TVSearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    useTVNavigation(); // Aplica a navegação a toda a página

    useEffect(() => {
        if (searchTerm.length > 2) {
            setSuggestions([`${searchTerm} gta 5`, `${searchTerm} minecraft`, `${searchTerm} melhores momentos`]);
        } else {
            setSuggestions([]);
        }
    }, [searchTerm]);

    const handleKeyPress = (key: string) => setSearchTerm(prev => prev + key);
    const handleBackspace = () => setSearchTerm(prev => prev.slice(0, -1));
    const handleClear = () => setSearchTerm('');

    return (
        <div className="tv-search-page">
            <div className="tv-search-input-area">
                <div className="tv-search-field">{searchTerm || 'Pesquisar'}</div>
                <div className="tv-search-suggestions">
                    {suggestions.map(s => <button className="focusable" key={s}>{s}</button>)}
                </div>
                 {searchTerm && (
                    <div className="tv-search-results">
                        {fakeResults.map(item => (
                            <div key={item.id} className="tv-search-result-card focusable">
                                <Image src={item.poster} alt={item.title} width={246} height={138} />
                                <p>{item.title}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <OnScreenKeyboard 
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
            />
        </div>
    );
}