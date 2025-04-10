import { FileCopy as FileCopyIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { Tooltip, IconButton } from '@mui/material';
import React, { useState, useRef, useEffect } from 'react';

interface CopyButtonProps {
  targetValue?: string;
  targetSelector?: string;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  targetValue,
  targetSelector,
  title = '복사',
  size = 'small',
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async (e: React.MouseEvent) => {
    // 이벤트 전파 중단 (버블링 방지)
    e.stopPropagation();

    try {
      let textToCopy = '';

      if (targetValue) {
        textToCopy = targetValue;
      } else if (targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
          if (
            targetElement instanceof HTMLInputElement ||
            targetElement instanceof HTMLTextAreaElement
          ) {
            textToCopy = targetElement.value;
          } else {
            textToCopy = targetElement.textContent || '';
          }
        }
      }

      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (err) {
      console.error('복사에 실패했습니다:', err);
    }
  };

  return (
    <Tooltip title={copied ? '복사됨!' : title}>
      <IconButton
        onClick={handleCopy}
        size={size}
        color={copied ? 'success' : 'default'}
        aria-label={title}
      >
        {copied ? <CheckCircleIcon fontSize={size} /> : <FileCopyIcon fontSize={size} />}
      </IconButton>
    </Tooltip>
  );
};
