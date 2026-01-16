import React from 'react';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => {
    return <input ref={ref} {...props} className={`${props.className ?? ''} px-2 py-1 rounded-md bg-white/5 text-white`} />;
  }
);

Input.displayName = 'Input';

export default Input;
