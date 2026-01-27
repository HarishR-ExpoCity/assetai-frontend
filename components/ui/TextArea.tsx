import React from 'react';

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  id: string;
}

const TextArea: React.FC<TextAreaProps> = ({ label, value, onChange, placeholder, rows = 4, id }) => {
  return (
    <div className="mb-4">
      {/* Label */}
      <label htmlFor={id} className="text-sm font-normal dark:text-white text-black label-text">
        {label}
      </label>

      {/* Textarea */}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 p-2 w-full text-base font-medium dark:bg-[#222222] border-[1px] dark:border-[#FFFFFF40] border-[#00000040] rounded-[8px]"
      />
    </div>
  );
};

export default TextArea;
