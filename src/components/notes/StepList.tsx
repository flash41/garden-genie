import React from 'react';

interface StepProps {
  title: string;
  children: React.ReactNode;
  stepNumber?: number;
}

interface StepListProps {
  children: React.ReactNode;
}

export function Step({ title, children, stepNumber = 1 }: StepProps) {
  return (
    <li className="flex gap-5 mb-6 last:mb-0">
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full bg-[#b8962e] flex items-center justify-center font-bold text-white text-sm"
        aria-hidden="true"
      >
        {stepNumber}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="font-serif font-bold text-[#0a3d2b] text-base mb-2">{title}</p>
        <div className="text-stone-700 text-sm leading-relaxed">{children}</div>
      </div>
    </li>
  );
}

export function StepList({ children }: StepListProps) {
  const steps = React.Children.map(children, (child, index) => {
    if (React.isValidElement<StepProps>(child)) {
      return React.cloneElement(child, { stepNumber: index + 1 });
    }
    return child;
  });

  return (
    <ol className="not-prose list-none p-0 my-6">
      {steps}
    </ol>
  );
}
