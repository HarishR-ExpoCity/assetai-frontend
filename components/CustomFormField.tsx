'use client';

import React from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Control, FieldPath } from 'react-hook-form';
import { formValidation } from '@/lib/validation';
import Image from 'next/image';
import { addBasePath } from 'next/dist/client/add-base-path';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface CustomProps {
  control: Control<z.infer<typeof formValidation>>;
  name: FieldPath<z.infer<typeof formValidation>>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showClearButton?: boolean;
  children?: React.ReactNode;
}

const CustomFormField = ({
  control,
  name,
  label,
  placeholder,
  className,
  showClearButton = true,
}: CustomProps) => {
  return (
    <div>
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <div className='form-item'>
              <FormLabel className={`form-label-two`} htmlFor={name}>
                {label}
              </FormLabel>
              <div className='flex flex-col w-full'>
                <FormControl>
                  <div className='relative'>
                    <Input
                      id={name}
                      className={`input-class-two placeholder-custom-placeholder ${className}`}
                      placeholder={placeholder}
                      type='text'
                      {...field}
                      style={{ paddingRight: '2.25rem' }}
                    />
                    {showClearButton && field.value && (
                      <span
                        className='absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer'
                        onClick={() => {
                          field.onChange(''); // Clear the field
                        }}
                      >
                        <Image
                          src={addBasePath('/icons/clear.svg')}
                          alt='x'
                          width={14}
                          height={14}
                        />
                      </span>
                    )}
                  </div>
                </FormControl>
                <FormDescription></FormDescription>
                <FormMessage className='shad-error' />
              </div>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export default CustomFormField;
