import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/format';

export default function FloatingCartButton() {
    const navigate = useNavigate();
    const { items, totalItems, totalPrice } = useCart();

    // Don't show if cart is empty
    if (totalItems === 0) {
        return null;
    }

    return (
        <button
            onClick={() => navigate('/cart')}
            className="fixed top-24 right-3 md:right-6 z-40 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 group"
            aria-label="Zum Warenkorb"
        >
            <div className="flex items-center gap-2 md:gap-3 px-3 py-2 md:px-5 md:py-4">
                {/* Cart Icon with Badge */}
                <div className="relative">
                    <svg 
                        className="w-5 h-5 md:w-6 md:h-6" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                        />
                    </svg>
                    <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-red-500 text-white text-[10px] md:text-xs font-bold rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center animate-pulse">
                        {totalItems}
                    </span>
                </div>

                {/* Price */}
                <div className="flex flex-col items-start">
                    <span className="text-[10px] md:text-xs opacity-90">Warenkorb</span>
                    <span className="font-bold text-sm md:text-lg">{formatPrice(totalPrice)}</span>
                </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </button>
    );
}
