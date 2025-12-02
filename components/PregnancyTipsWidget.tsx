import React from 'react';

interface PregnancyTipsWidgetProps {
  week: number;
}

const PregnancyTipsWidget: React.FC<PregnancyTipsWidgetProps> = ({ week }) => {
  
  const getTip = (w: number) => {
    if (w < 4) return { category: 'Découverte', text: "C'est le tout début ! Pensez à commencer l'acide folique si ce n'est pas déjà fait.", icon: '💊' };
    if (w < 13) return { category: 'Bien-être', text: "La fatigue est normale au 1er trimestre. Écoutez votre corps et faites des siestes.", icon: '💤' };
    if (w < 18) return { category: 'Alimentation', text: "Bébé grandit ! Privilégiez les aliments riches en fer et en calcium.", icon: '🥦' };
    if (w < 24) return { category: 'Connexion', text: "Vous pourriez commencer à sentir bouger bébé. Prenez un moment le soir pour vous connecter.", icon: '🦋' };
    if (w < 28) return { category: 'Santé', text: "Hydratez-vous bien pour éviter les crampes et la rétention d'eau.", icon: '💧' };
    if (w < 32) return { category: 'Préparation', text: "Commencez à réfléchir à votre valise de maternité et au projet de naissance.", icon: 'bag' };
    if (w < 37) return { category: 'Repos', text: "Le sommeil devient difficile ? Essayez un coussin d'allaitement pour vous caler.", icon: '🛌' };
    return { category: 'Arrivée', text: "Détendez-vous, bébé sera bientôt là. Pratiquez des exercices de respiration.", icon: '🧘‍♀️' };
  };

  const tip = getTip(week);

  return (
    <div className="bg-teal-50 rounded-[2rem] p-5 shadow-sm border border-teal-100 mt-6 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 bg-teal-100 w-24 h-24 rounded-full opacity-50 blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
            <span className="bg-white text-teal-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-teal-200 uppercase tracking-wider">
                Semaine {week} • {tip.category}
            </span>
            <span className="text-2xl">{tip.icon}</span>
        </div>
        
        <p className="text-teal-900 font-medium text-sm leading-relaxed">
            "{tip.text}"
        </p>
      </div>
    </div>
  );
};

export default PregnancyTipsWidget;