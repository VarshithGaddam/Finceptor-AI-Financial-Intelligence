import { useState } from 'react';
import FilingParserPopup from './FilingParserPopup';

const FilingParserButton = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => {
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <>
      <button
        onClick={openPopup}
        className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-lg px-6 py-3 font-medium hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        SEC Filing Parser
      </button>
      
      <FilingParserPopup isOpen={isPopupOpen} onClose={closePopup} />
    </>
  );
};

export default FilingParserButton; 