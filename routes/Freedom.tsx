import React from 'react';
import { useStore } from '../state/store';
import { computeDerived } from '../state/selectors';
import FreedomEngine from '../components/Freedom';
import Fortress from '../components/Fortress';

const FreedomRoute: React.FC = () => {
  const state = useStore(s => s.state);
  const activeLens = useStore(s => s.activeLens);
  const language = useStore(s => s.language);
  const isPremium = useStore(s => s.isPremium);
  const setIsPremium = useStore(s => s.setIsPremium);
  const handleToggleLifeCard = useStore(s => s.handleToggleLifeCard);
  const handleAddGoal = useStore(s => s.handleAddGoal);
  const handleUpdateGoal = useStore(s => s.handleUpdateGoal);
  const handleDeleteGoal = useStore(s => s.handleDeleteGoal);

  const derived = computeDerived(state, activeLens, language);

  return (
    <div className="space-y-6">
      <FreedomEngine
        monthlyBurn={derived.monthlyBurn}
        monthlyPassive={derived.monthlyPassive}
        sovereigntyGap={derived.sovereigntyGap}
        monthlyIncome={state.monthlyIncome}
        currentLiquidAssets={derived.totalPocketCash}
        lifeCards={state.lifeCards}
        onToggleLifeCard={handleToggleLifeCard}
        language={language}
      />

      <Fortress
        state={state}
        onAddGoal={handleAddGoal}
        onUpdateGoal={handleUpdateGoal}
        onDeleteGoal={handleDeleteGoal}
        activeLens={activeLens}
        language={language}
        isPremium={isPremium}
        onUpgrade={() => setIsPremium(true)}
      />
    </div>
  );
};

export default FreedomRoute;
