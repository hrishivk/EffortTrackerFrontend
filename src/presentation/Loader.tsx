import React from "react";

const RxLoader: React.FC = () => {
  return (
    <>
      <div className="fixed inset-0 bg-gray-50 bg-opacity-50 z-40" />
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50">
        <div className="loader">
          <div className="loader__bar"></div>
          <div className="loader__bar"></div>
          <div className="loader__bar"></div>
          <div className="loader__bar"></div>
          <div className="loader__bar"></div>
          <div className="loader__ball"></div>
        </div>
        <p className="text-center text-[#825294] text-lg mt-4">
          Preparing your workspace. Please wait…
        </p>
      </div>
    </>
  );
};

export default RxLoader;
