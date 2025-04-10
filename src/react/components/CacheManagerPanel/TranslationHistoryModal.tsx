import React from 'react';

import { TranslationHistory } from '@/types/cache';
import { CopyButton } from '../common/CopyButton';

interface TranslationHistoryModalProps {
  translationHistory: TranslationHistory[] | null;
}

/**
 * 번역 이력을 보여주는 모달 콘텐츠 컴포넌트
 * 새로운 모달 시스템용으로 수정
 */
export const TranslationHistoryModal: React.FC<TranslationHistoryModalProps> = ({
  translationHistory,
}) => {
  if (!translationHistory) return null;

  return (
    <div className="translation-history-content">
      <table className="history-table">
        <thead>
          <tr>
            <th>버전</th>
            <th>번역 텍스트</th>
            <th>변경일</th>
          </tr>
        </thead>
        <tbody>
          {translationHistory.map((history, index) => (
            <tr key={index}>
              <td>V{index + 1}</td>
              <td className="text-cell">
                <div className="text-with-copy">
                  <span id={`history-${index}`}>{history.target}</span>
                  <CopyButton targetSelector={`#history-${index}`} />
                </div>
              </td>
              <td>{new Date(history.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TranslationHistoryModal;
