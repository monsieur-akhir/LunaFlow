import React from 'react';

interface InsightCardProps {
  title: string;
  content: string;
  loading: boolean;
  type: 'cycle' | 'pregnancy';
}

const InsightCard: React.FC<InsightCardProps> = ({ title, content, loading, type }) => {
  const gradient = type === 'cycle' 
    ? 'from-rose-400 to-orange-300' 
    : 'from-teal-400 to-blue-400';

  const handleShare = () => {
    alert('Partage du conseil en cours...');
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg transition-all duration-500 hover:shadow-xl`}>
      {/* Decorative circles */}
      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl"></div>
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl"></div>

      <div className="relative z-10">
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-1/3 bg-white/30 rounded"></div>
            <div className="h-4 w-full bg-white/20 rounded"></div>
            <div className="h-4 w-2/3 bg-white/20 rounded"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl bg-white/20 p-1.5 rounded-full">✨</span>
              <h3 className="font-bold text-lg tracking-tight">{title}</h3>
            </div>
            <p className="text-white/90 leading-relaxed font-medium mb-4">
              {content}
            </p>
            <div className="flex justify-end">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 active:scale-95 rounded-xl text-sm font-bold transition-all backdrop-blur-sm border border-white/10"
              >
                <span>📤</span> Partager
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InsightCard;