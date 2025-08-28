import React, { useState } from 'react';
import SelectOfferingType from '../components/SelectOfferingType';
import FinancialInputs from '../components/FinancialInputs';
import Summary from '../components/Summary';

const CapitalRaisingPage = () => {
  const [step, setStep] = useState(1); // 1: Select Type, 2: Inputs, 3: Summary
  const [offeringType, setOfferingType] = useState(null);
  const [financials, setFinancials] = useState(null);

  const handleSelectType = (type) => {
    setOfferingType(type);
    setStep(2);
  };

  const handleFinancialsSubmit = (data) => {
    setFinancials(data);
    setStep(3);
  };

  const handleStartOver = () => {
      setStep(1);
      setOfferingType(null);
      setFinancials(null);
  };

  const renderStep = () => {
      switch (step) {
          case 1:
              return <SelectOfferingType onSelect={handleSelectType} />;
          case 2:
              return <FinancialInputs offeringType={offeringType} onSubmit={handleFinancialsSubmit} />;
          case 3:
              return <Summary offeringType={offeringType} financials={financials} onBack={handleStartOver} />;
          default:
              return <SelectOfferingType onSelect={handleSelectType} />;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Capital Raising Notes</h2>
        {step > 1 && (
            <button onClick={handleStartOver} className="text-sm text-blue-600 hover:underline">
                Reset
            </button>
        )}
      </div>
      
      {renderStep()}
    </div>
  );
};

export default CapitalRaisingPage;
