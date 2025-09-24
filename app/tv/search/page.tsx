"use client";
import { useState, useEffect } from 'react';
import { useTVNavigation } from '@/app/hooks/useTVNavigation';
import { OnScreenKeyboard } from '@/app/components/OnScreenKeyboard'; // Caminho corrigido
import Image from 'next/image';

// Dados de exemplo para simular os resultados
const fakeResults = [
    { id: 1, title: "Dudu e Carol GTA 5: A Grande Fuga", poster: "https://i.ytimg.com/vi/zG5g_g_N-zk/hq720.jpg" },
    { id: 2, title: "Dudu e Carol jogando Minecraft", poster: "https://i.ytimg.com/vi/q_kStHMt2tw/hq720.jpg" },
    { id: 3, title: "1 HORA COM DUDU E CAROL VÍDEO ESPECIAL", poster: "https://i.ytimg.com/vi/mR_u4hC-d_g/hq720.jpg" },
    { id: 4, title: "CAROL E DUDU", poster: "https://i.ytimg.com/vi/U8nTTbYiVpI/hq720.jpg" },
];

export default function TVSearchPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    useTVNavigation(); // Aplica a navegação a toda a página

    useEffect(() => {
        if (searchTerm.length > 2) {
            // Simula sugestões baseadas na pesquisa
            setSuggestions([
                `${searchTerm}`,
                `${searchTerm} gta 5`, 
                `${searchTerm} 2025`, 
                `${searchTerm} jogando`, 
                `${searchTerm} jogando gta v`
            ]);
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
                    <div className='tv-search-results-wrapper'>
                        <h2 className='tv-search-results-title'>Resultados da pesquisa para "{searchTerm}"</h2>
                        <div className="tv-search-results">
                            {fakeResults.map(item => (
                                <div key={item.id} className="tv-search-result-card focusable">
                                    <Image src={item.poster} alt={item.title} width={246} height={138} />
                                    <p>{item.title}</p>
                                </div>
                            ))}
                        </div>
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