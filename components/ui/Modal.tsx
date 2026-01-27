import React, { ReactNode } from 'react';
import { CloseRounded as CloseRoundedIcon } from '@mui/icons-material';

interface ModalProps {
  isOpen: boolean; // Whether the modal is open or not
  onClose: () => void; // Function to close the modal
  title: string; // Title for the modal
  children: ReactNode; // Content to display in the modal body
  footer?: ReactNode; // Custom footer content (optional)
  width?: string; // Custom width (optional, defaults to min-w-[32rem])
  noBodyScroll?: boolean; // Disable body scroll when content has its own scroll (optional)
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  width,
  noBodyScroll = false,
}) => {
  if (!isOpen) return null; // Do not render if modal is closed

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'
      onClick={handleBackdropClick}
    >
      <div
        className={`dark:bg-[#222222] bg-white border-[1px] rounded-[18px] border-[#00000026] dark:border-[#FFFFFF26] shadow-[0px_4px_8px_0px_#00000026] ${
          width || 'w-auto min-w-[32rem] max-w-[90%]'
        } flex flex-col`}
      >
        {/* Modal Header */}
        <div className='flex justify-between items-center px-[1.5rem] py-4 border-b border-[#0000000D] dark:border-[#FFFFFF0D]'>
          <h5 className='modal-title dark:text-white'>{title}</h5>
          <button
            onClick={onClose}
            className='text-button-secondary hover:text-gray-900 focus:outline-none dark:text-white'
            aria-label='Close modal'
          >
            <CloseRoundedIcon className='w-5 h-5' />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className={`px-6 py-4 flex-1 ${
            noBodyScroll ? 'overflow-visible' : 'overflow-auto'
          }`}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer ? footer : null}
      </div>
    </div>
  );
};

export default Modal;
