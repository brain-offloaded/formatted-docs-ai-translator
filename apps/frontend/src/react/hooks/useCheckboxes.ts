import { useState, useCallback } from 'react';

interface UseCheckboxesOptions<T> {
  idExtractor: (item: T) => number;
}

/**
 * 체크박스 상태 관리를 위한 커스텀 훅
 */
export const useCheckboxes = <T>({
  idExtractor,
}: UseCheckboxesOptions<T>): {
  checkedItems: Set<number>;
  handleCheckboxChange: (id: number, checked: boolean) => void;
  handleCheckAll: (items: T[], checked: boolean) => void;
  isChecked: (id: number) => boolean;
  areAllChecked: (items: T[]) => boolean;
  clearCheckedItems: () => void;
} => {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  /**
   * 개별 체크박스 변경 처리
   */
  const handleCheckboxChange = useCallback((id: number, checked: boolean) => {
    setCheckedItems((prev) => {
      const newCheckedItems = new Set(prev);

      if (checked) {
        newCheckedItems.add(id);
      } else {
        newCheckedItems.delete(id);
      }

      return newCheckedItems;
    });
  }, []);

  /**
   * 전체 체크박스 변경 처리
   */
  const handleCheckAll = useCallback(
    (items: T[], checked: boolean) => {
      if (checked) {
        const allIds = items.map((item) => idExtractor(item));
        setCheckedItems(new Set(allIds));
      } else {
        setCheckedItems(new Set());
      }
    },
    [idExtractor]
  );

  /**
   * 특정 아이템이 체크되어 있는지 확인
   */
  const isChecked = useCallback((id: number) => checkedItems.has(id), [checkedItems]);

  /**
   * 모든 아이템이 체크되어 있는지 확인
   */
  const areAllChecked = useCallback(
    (items: T[]) => {
      return items.length > 0 && items.every((item) => checkedItems.has(idExtractor(item)));
    },
    [checkedItems, idExtractor]
  );

  /**
   * 체크된 항목 초기화
   */
  const clearCheckedItems = useCallback(() => {
    setCheckedItems(new Set());
  }, []);

  return {
    checkedItems,
    handleCheckboxChange,
    handleCheckAll,
    isChecked,
    areAllChecked,
    clearCheckedItems,
  };
};
