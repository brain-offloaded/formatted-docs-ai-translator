import React, { useState, useEffect } from 'react';
import { CopyButton } from '../common/CopyButton';
import type { CacheTranslation } from '@/types/cache';

interface TranslationDetailModalProps {
  translation: CacheTranslation | null;
  onHistoryClick: (translationId: number) => void;
  onSave: (newTarget: string) => void;
}

/**
 * 번역 상세 정보를 보여주는 모달 콘텐츠 컴포넌트
 * 새로운 모달 시스템에서는 콘텐츠만 제공하고 상태는 부모 컴포넌트에서 관리
 */
export const TranslationDetailModal: React.FC<TranslationDetailModalProps> = ({
  translation,
  onHistoryClick,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTarget, setEditingTarget] = useState('');

  // translation이 변경될 때 편집 상태 초기화
  useEffect(() => {
    if (!translation) {
      setIsEditing(false);
      return;
    }

    // translation이 변경되면 편집 상태 초기화
    setIsEditing(false);
    setEditingTarget(translation.target);
  }, [translation]);

  // 편집 모드 시작
  const startEditing = () => {
    if (translation) {
      setEditingTarget(translation.target);
      setIsEditing(true);
    }
  };

  // 편집 취소
  const cancelEditing = () => {
    setIsEditing(false);
    if (translation) {
      setEditingTarget(translation.target);
    }
  };

  // 편집 내용 저장
  const saveEditing = () => {
    if (translation) {
      onSave(editingTarget);
      // 저장 후 즉시 모달에도 변경사항 반영
      translation.target = editingTarget;
      setIsEditing(false);
    }
  };

  // 입력 내용 변경 처리
  const handleEditingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingTarget(e.target.value);
  };

  if (!translation) return null;

  return (
    <div className="translation-detail-content">
      <div className="detail-item">
        <div className="detail-label">
          <span>원문</span>
          <CopyButton targetValue={translation.source} />
        </div>
        <div className="detail-value">{translation.source}</div>
      </div>

      <div className="detail-item">
        <div className="detail-label">
          <span>번역</span>
          {!isEditing && <CopyButton targetValue={translation.target} />}
        </div>
        {isEditing ? (
          <div className="editing-container">
            <textarea
              value={editingTarget}
              onChange={handleEditingChange}
              onClick={(e) => e.stopPropagation()}
              rows={5}
            />
            <div className="edit-actions">
              <button className="edit-button save" onClick={saveEditing}>
                저장
              </button>
              <button className="edit-button cancel" onClick={cancelEditing}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-value">
            {translation.target}
            <button className="edit-button edit-text" onClick={startEditing}>
              편집
            </button>
          </div>
        )}
      </div>

      {translation.fileName && (
        <div className="detail-item">
          <div className="detail-label">
            <span>파일 이름</span>
            <CopyButton targetValue={translation.fileName} />
          </div>
          <div className="detail-value">{translation.fileName}</div>
        </div>
      )}

      {translation.filePath && (
        <div className="detail-item">
          <div className="detail-label">
            <span>파일 경로</span>
            <CopyButton targetValue={translation.filePath} />
          </div>
          <div className="detail-value">{translation.filePath}</div>
        </div>
      )}

      <div className="detail-item">
        <div className="detail-label">생성일</div>
        <div className="detail-value">{new Date(translation.createdAt).toLocaleString()}</div>
      </div>

      <div className="detail-item">
        <div className="detail-label">마지막 사용일</div>
        <div className="detail-value">{new Date(translation.lastAccessedAt).toLocaleString()}</div>
      </div>

      <div className="detail-actions">
        <button className="detail-action history" onClick={() => onHistoryClick(translation.id)}>
          이력 보기
        </button>
      </div>
    </div>
  );
};

export default TranslationDetailModal;
