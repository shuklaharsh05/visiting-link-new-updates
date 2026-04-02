import React from 'react';
import SimpleCardGenerator from './SimpleCardGenerator';

const CardGenerator = ({
  inquiryId,
  onBack,
  onCardGenerated,
  mode = "inquiry",
  targetUserId,
  editCardId,
}) => {
  return (
    <SimpleCardGenerator
      inquiryId={inquiryId}
      onBack={onBack}
      onCardGenerated={onCardGenerated}
      mode={mode}
      targetUserId={targetUserId}
      editCardId={editCardId}
    />
  );
};

export default CardGenerator;
