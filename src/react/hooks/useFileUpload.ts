import { useState, useRef, useCallback, MutableRefObject } from 'react';

interface UseFileUploadReturn {
  selectedFiles: File[] | null;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  clearFiles: () => void;
  isDragActive: boolean;
}

interface UseFileUploadOptions {
  onFilesSelected?: (files: File[]) => void;
  onError?: (message: string) => void;
  acceptedFileTypes?: string[];
  multiple?: boolean;
  maxFileSize?: number;
  disabled?: boolean;
}

/**
 * 파일 업로드 및 드래그 앤 드롭 기능을 위한 커스텀 훅
 */
export function useFileUpload({
  onFilesSelected,
  onError,
  acceptedFileTypes = [],
  multiple = true,
  maxFileSize,
  disabled = false,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 유효성 검사
  const validateFiles = useCallback(
    (files: File[]): File[] => {
      const validFiles = files.filter((file) => {
        // 파일 타입 검사
        if (acceptedFileTypes.length > 0) {
          // const fileType = file.name.split('.').pop()?.toLowerCase() || ''; // 이 변수는 현재 사용되지 않습니다.
          if (!acceptedFileTypes.some((type) => file.name.endsWith(type))) {
            onError?.(
              `'${file.name}' 파일은 지원되지 않는 형식입니다. 지원되는 형식: ${acceptedFileTypes.join(', ')}`
            );
            return false;
          }
        }

        // 파일 크기 검사
        if (maxFileSize && file.size > maxFileSize) {
          const sizeMB = maxFileSize / (1024 * 1024);
          onError?.(
            `'${file.name}' 파일이 너무 큽니다. 최대 ${sizeMB}MB까지 업로드할 수 있습니다.`
          );
          return false;
        }

        return true;
      });

      return validFiles;
    },
    [acceptedFileTypes, maxFileSize, onError]
  );

  // 파일 선택 핸들러
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;

      if (e.target.files && e.target.files.length > 0) {
        const fileArray = Array.from(e.target.files);
        const validFiles = validateFiles(fileArray);

        if (validFiles.length > 0) {
          setSelectedFiles(validFiles);
          onFilesSelected?.(validFiles);
        }
      }
    },
    [disabled, validateFiles, onFilesSelected]
  );

  // 드래그 이벤트 핸들러들
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragActive(false);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fileArray = Array.from(e.dataTransfer.files);
        const validFiles = validateFiles(fileArray);

        if (validFiles.length > 0) {
          setSelectedFiles(multiple ? validFiles : [validFiles[0]]);
          onFilesSelected?.(multiple ? validFiles : [validFiles[0]]);
        }
      }
    },
    [disabled, multiple, validateFiles, onFilesSelected]
  );

  // 파일 목록 지우기
  const clearFiles = useCallback(() => {
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    selectedFiles,
    fileInputRef,
    handleFileChange,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    clearFiles,
    isDragActive,
  };
}

export default useFileUpload;
