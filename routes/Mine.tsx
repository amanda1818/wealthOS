import React from 'react';
import { useStore } from '../state/store';
import IndividualSanctuary from '../components/IndividualSanctuary';

const Mine: React.FC = () => {
  const state = useStore(s => s.state);
  const language = useStore(s => s.language);
  const setSelectedPocket = useStore(s => s.setSelectedPocket);
  const handleUpdateUser = useStore(s => s.handleUpdateUser);

  return (
    <IndividualSanctuary
      state={state}
      language={language}
      onPocketClick={setSelectedPocket}
      onPrivacyToggle={() => {
        if (!state.user) return;
        handleUpdateUser(state.user.id, { isPrivateMode: !state.user.isPrivateMode });
      }}
    />
  );
};

export default Mine;
