import React from 'react';
import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, id }) => {
  return (
    <label className="relative inline-flex items-center justify-center cursor-pointer p-1 -m-1 select-none" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div
        className={`w-4.5 h-4.5 rounded flex items-center justify-center transition-colors duration-150 border ${
          checked
            ? 'bg-[#22C55E] border-[#22C55E]'
            : 'bg-white border-[#EAEAEA] hover:border-[#635BFF]'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white stroke-[3]" />}
      </div>
    </label>
  );
};
