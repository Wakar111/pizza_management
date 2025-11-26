import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { settingsService, type Discount } from '../lib/supabase';

export default function PromotionBanner() {
    const [activePromotions, setActivePromotions] = useState<Discount[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        loadActivePromotions();
    }, []);

    useEffect(() => {
        if (activePromotions.length <= 1) return;

        // Auto-play slideshow every 5 seconds
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activePromotions.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [activePromotions.length]);

    const loadActivePromotions = async () => {
        try {
            const allPromotions = await settingsService.getAllDiscounts();
            const now = new Date();

            // Filter for active promotions
            const active = allPromotions.filter(promo => {
                if (!promo.enabled) return false;
                const start = new Date(promo.startDate);
                const end = new Date(promo.endDate);
                return now >= start && now <= end;
            });

            setActivePromotions(active);
        } catch (error) {
            console.error('Error loading promotions:', error);
        }
    };

    if (activePromotions.length === 0) return null;

    const currentPromo = activePromotions[currentIndex];
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="relative w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] animate-pulse"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between gap-4 text-white">
                    {/* Left: Discount badge */}
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2 border-2 border-white/50">
                            <span className="text-3xl font-black">{currentPromo.percentage}%</span>
                            <span className="ml-2 text-sm font-semibold uppercase tracking-wide">Rabatt</span>
                        </div>

                        {/* Center: Promotion name */}
                        <div className="hidden md:block">
                            <h3 className="text-2xl font-bold drop-shadow-lg">{currentPromo.name}</h3>
                            <p className="text-sm opacity-90 font-medium">
                                🎁 {formatDate(currentPromo.startDate)} - {formatDate(currentPromo.endDate)}
                            </p>
                        </div>
                    </div>

                    {/* Right: CTA */}
                    <Link to="/menu" className="flex items-center gap-3 hover:scale-105 transition-transform">
                        <span className="hidden sm:block text-sm font-semibold uppercase tracking-wider animate-pulse">
                            Jetzt bestellen!
                        </span>
                        <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>

                {/* Mobile: Show name below */}
                <div className="md:hidden mt-3 text-center">
                    <h3 className="text-xl font-bold drop-shadow-lg">{currentPromo.name}</h3>
                    <p className="text-xs opacity-90 font-medium mt-1">
                        🎁 {formatDate(currentPromo.startDate)} - {formatDate(currentPromo.endDate)}
                    </p>
                </div>
            </div>

            {/* Slideshow indicators */}
            {activePromotions.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                    {activePromotions.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 rounded-full transition-all ${index === currentIndex
                                ? 'bg-white w-6'
                                : 'bg-white/50 w-2 hover:bg-white/75'
                                }`}
                            aria-label={`Go to promotion ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
