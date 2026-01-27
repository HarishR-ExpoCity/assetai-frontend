'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import FolderTreePicker from './FolderTreePicker';
import { FileData } from './filemanagementcolumns';

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (destinationId: string) => void;
  itemsToMove: FileData[];
  isLoading?: boolean;
}

const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemsToMove,
  isLoading = false,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');

  // Get list of folder IDs that should be disabled (can't move a folder into itself or its children)
  const disabledFolderIds = itemsToMove
    .filter((item) => item.isFolder)
    .map((item) => item.id);

  // Get current folder ID (parent of items being moved)
  const currentFolderId =
    itemsToMove.length > 0 ? itemsToMove[0].parentReference?.id : undefined;

  const handleSelect = (
    folderId: string,
    folderPath: string,
    folderName: string
  ) => {
    setSelectedFolderId(folderId);
    setSelectedFolderName(folderName);
  };

  const handleConfirm = () => {
    if (selectedFolderId) {
      onConfirm(selectedFolderId);
    }
  };

  const handleClose = () => {
    setSelectedFolderId(null);
    setSelectedFolderName('');
    onClose();
  };

  const itemCount = itemsToMove.length;
  const itemLabel =
    itemCount === 1 ? `"${itemsToMove[0].name}"` : `${itemCount} items`;

  const footerContent = (
    <div className='flex justify-end space-x-3 px-6 pb-4'>
      <Button
        className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D] dark:text-white'
        variant='secondary'
        onClick={handleClose}
        disabled={isLoading}
      >
        <MaterialIcon icon='close' size='sm' className='w-5 h-5' />
        Cancel
      </Button>
      <Button
        type='submit'
        className='px-4 py-2 text-white rounded-lg admin-btn'
        onClick={handleConfirm}
        disabled={
          !selectedFolderId || selectedFolderId === currentFolderId || isLoading
        }
      >
        {isLoading ? (
          <>
            <MaterialIcon
              icon='sync'
              size='sm'
              className='w-5 h-5 animate-spin'
            />
            Moving...
          </>
        ) : (
          <>
            <MaterialIcon
              icon='drive_file_move'
              size='sm'
              className='w-5 h-5'
            />
            Move Here
          </>
        )}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title='Move'
      width='w-[50vw] min-w-[400px] max-w-[700px] max-h-[85vh]'
      footer={footerContent}
      noBodyScroll
    >
      <div className='flex flex-col'>
        {/* Info header - Moving items and destination */}
        <div className='flex items-center justify-between mb-4'>
          <div className='text-sm text-muted-foreground'>
            Moving {itemLabel}
          </div>
          {selectedFolderId && (
            <div className='flex items-center text-sm'>
              <MaterialIcon
                icon='arrow_forward'
                className='mr-1.5 text-muted-foreground'
                size={16}
              />
              <MaterialIcon
                icon='folder'
                className='mr-1.5 text-primary'
                size={16}
              />
              <span className='text-foreground font-medium'>
                {selectedFolderName}
              </span>
            </div>
          )}
        </div>

        {/* Folder Tree Picker - Has internal scroll */}
        <FolderTreePicker
          onSelect={handleSelect}
          selectedFolderId={selectedFolderId}
          disabledFolderIds={disabledFolderIds}
          currentFolderId={currentFolderId}
        />

        {/* Warning if trying to move to same location */}
        {selectedFolderId === currentFolderId && (
          <div className='flex items-center text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2.5 rounded-md text-yellow-700 dark:text-yellow-300 mt-3'>
            <MaterialIcon icon='warning' className='mr-2' size={18} />
            Items are already in this location
          </div>
        )}
      </div>
    </Modal>
  );
};

export default MoveModal;
