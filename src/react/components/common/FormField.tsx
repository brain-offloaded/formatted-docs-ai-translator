import React, { cloneElement, isValidElement } from 'react';

// 자식 컴포넌트가 지원해야 하는 프로퍼티 정의
interface FormControlProps {
  id?: string;
  'aria-labelledby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-errormessage'?: string;
}

interface FormFieldProps {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

/**
 * 접근성이 개선된 폼 필드 컴포넌트
 * 라벨과 폼 컨트롤을 연결하여 스크린리더 지원
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  children,
  className = 'form-field',
  required = false,
  error = false,
  helperText,
}) => {
  // 자식 요소에 id 속성 추가
  const childWithProps = isValidElement(children)
    ? cloneElement(children as React.ReactElement<FormControlProps>, {
        id,
        'aria-labelledby': `${id}-label`,
        'aria-required': required,
        'aria-invalid': error,
        ...(error && helperText ? { 'aria-errormessage': `${id}-error` } : {}),
      })
    : children;

  return (
    <div className={`${className}${error ? ' has-error' : ''}`}>
      <label id={`${id}-label`} htmlFor={id} className={required ? 'required-label' : ''}>
        {label}
        {required && <span className="required-mark">*</span>}
      </label>

      {childWithProps}

      {helperText && (
        <div
          id={error ? `${id}-error` : undefined}
          className={`helper-text${error ? ' error-text' : ''}`}
          aria-live={error ? 'assertive' : 'polite'}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};

export default FormField;
