import React from 'react';
import { TranslationTable } from '../../components/CacheManagerPanel/TranslationTable';

const CacheView = () => {
  return (
    <TranslationTable
      translations={[]}
      checkedItems={new Set()}
      onCheckboxChange={() => {}}
      onCheckAll={() => {}}
      onDeleteCheckedItems={() => {}}
      onDeleteAllItems={() => {}}
    />
  );
};

export default CacheView;
