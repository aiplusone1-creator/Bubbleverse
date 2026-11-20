import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { cn } from '@/lib/utils';

export interface LiquidSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface LiquidSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Convenience alias matching native <select> pattern */
  onChange?: (value: string) => void;
  options: (LiquidSelectOption | string)[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  disabled?: boolean;
  dir?: 'ltr' | 'rtl';
  id?: string;
  name?: string;
  'aria-label'?: string;
}

export const LiquidSelect = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  LiquidSelectProps
>(
  (
    {
      value,
      defaultValue,
      onValueChange,
      onChange,
      options,
      placeholder,
      className,
      triggerClassName,
      contentClassName,
      itemClassName,
      disabled,
      dir,
      id,
      name,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    const handleValueChange = (val: string) => {
      onValueChange?.(val);
      onChange?.(val);
    };

    const normalizedOptions: LiquidSelectOption[] = React.useMemo(() => {
      return options.map((opt) =>
        typeof opt === 'string' ? { value: opt, label: opt } : opt
      );
    }, [options]);

    return (
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={handleValueChange}
        disabled={disabled}
        dir={dir}
        name={name}
      >
        <SelectTrigger
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          className={cn(className, triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={cn('liquid-glass-dropdown', contentClassName)}>
          {normalizedOptions.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className={itemClassName}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

LiquidSelect.displayName = 'LiquidSelect';
