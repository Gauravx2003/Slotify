import React from 'react';

const SimpleWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-yellow-100 p-10 border-4 border-red-500">
      <h1 className="text-2xl font-bold">Simple Wrapper</h1>
      {children}
    </div>
  );
};

export default SimpleWrapper;
