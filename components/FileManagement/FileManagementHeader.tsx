import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Modal from '@/components/ui/Modal';
import { Label } from '@/components/ui/label';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { useAccessToken } from '@/hooks/useAccessToken';
import {
  FileUploadRounded as FileUpload,
  FileDownloadRounded as DownloadIcon,
  DriveFileMoveRounded as MoveIcon,
} from '@mui/icons-material';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import TextArea from '@/components/ui/TextArea';
import { VisibilityState } from '@tanstack/react-table';

interface FileManagementHeaderProps {
  handleFileUpload: (files: any) => void;
  // handlePublish: (comments: string) => void;
  handleCreateNewFolder: (folderName: string) => void;
  selectedPath: any;
  treeViewActivePath?: string[];
  viewMode: 'flat' | 'tree';
  onViewModeChange: (mode: 'flat' | 'tree') => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  availableColumns?: { id: string; label: string }[];
  selectedRowsCount?: number;
  selectedRows?: any[];
  onBulkPublish?: (ids: string[], comments: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkDownload?: (ids: string[]) => void;
  onBulkMove?: () => void;
  uploadProgress?: number;
  rootAllowedActions?: {
    newfolder?: boolean;
    upload?: boolean;
  };
}

const FileManagementHeader = (props: FileManagementHeaderProps) => {
  const {
    handleFileUpload,
    // handlePublish,
    handleCreateNewFolder,
    selectedPath,
    treeViewActivePath = [],
    viewMode,
    onViewModeChange,
    columnVisibility,
    onColumnVisibilityChange,
    availableColumns = [],
    selectedRowsCount = 0,
    selectedRows = [],
    onBulkPublish,
    onBulkDelete,
    onBulkDownload,
    onBulkMove,
    uploadProgress = 0,
    rootAllowedActions = {},
  } = props;
  // const [searchQuery, setSearchQuery] = useState<string>("");

  const [isNewFolderModalOpen, setIsNewFolderModalOpen] =
    useState<boolean>(false);
  const [folderName, setFolderName] = useState<string>('');
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] =
    useState<boolean>(false);
  const [isBulkPublishModalOpen, setIsBulkPublishModalOpen] =
    useState<boolean>(false);
  const [bulkPublishComments, setBulkPublishComments] = useState<string>('');
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] =
    useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null); // Reference for file input
  const folderInputRef = useRef<HTMLInputElement | null>(null); // Reference for folder input

  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { accessToken, getAccessToken } = useAccessToken();

  useEffect(() => {
    if (accessToken == null) {
      getAccessToken();
    }
  }, [accessToken, getAccessToken]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isUploadDropdownOpen &&
        uploadButtonRef.current &&
        !uploadButtonRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsUploadDropdownOpen(false);
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isUploadDropdownOpen]);

  const handleNewFolder = (): void => setIsNewFolderModalOpen(true);

  const closeNewFolderModal = (): void => {
    setIsNewFolderModalOpen(false);
    setFolderName('');
  };

  // const handleUpload = (): void => setIsUploadDropdownOpen((prev) => !prev);
  const handleUpload = async (): Promise<void> => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // const handleSelectOption = (option: "File" | "Folder") => {
  //   if (option === "File") {
  //     fileInputRef?.current?.click(); // Trigger file input on selecting File
  //   } else if (option === "Folder") {
  //     folderInputRef?.current?.click(); // Trigger folder input on selecting Folder
  //   }
  //   setIsUploadDropdownOpen(false);
  // };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    handleFileUpload(files);
  };

  // Handle folder selection
  const handleFolderChange = () => {
    // Implementation pending
  };

  const createNewFolder = () => {
    handleCreateNewFolder(folderName);
    closeNewFolderModal();
  };

  // Check if we're at root level (no selected path)
  // For tree view, use treeViewActivePath; for flat view, use selectedPath
  const activePath = viewMode === 'tree' ? treeViewActivePath : selectedPath;
  const isRootLevel = !activePath || activePath.length === 0;
  const entityName = isRootLevel ? 'Project' : 'Folder';

  // Use rootAllowedActions consistently for both flat and tree views
  // rootAllowedActions is set from API response when fetching folder contents
  const activeAllowedActions = rootAllowedActions;

  // Check if all selected items are eligible for publishing (all must have publish permission)
  const canPublishSelected =
    selectedRows.length > 0 &&
    selectedRows.every((row) => row.allowed_actions?.publish === true);

  // Check if all selected items are eligible for deletion (all must have delete permission)
  const canDeleteSelected =
    selectedRows.length > 0 &&
    selectedRows.every((row) => row.allowed_actions?.delete === true);

  // Check if all selected items are eligible for download (all must have download permission)
  const canDownloadSelected =
    selectedRows.length > 0 &&
    selectedRows.every((row) => row.allowed_actions?.download === true);

  // Check if all selected items are eligible for move (all must have move permission)
  const canMoveSelected =
    selectedRows.length > 0 &&
    selectedRows.every((row) => row.allowed_actions?.move === true);

  const handleBulkPublish = () => {
    setIsBulkPublishModalOpen(true);
  };

  const closeBulkPublishModal = () => {
    setIsBulkPublishModalOpen(false);
    setBulkPublishComments('');
  };

  const confirmBulkPublish = () => {
    if (onBulkPublish) {
      const ids = selectedRows.map((row) => row.id);
      // Call the unified handlePublish with ids array and comments
      onBulkPublish(ids, bulkPublishComments);
    }
    closeBulkPublishModal();
  };

  const handleBulkDelete = () => {
    setIsBulkDeleteModalOpen(true);
  };

  const closeBulkDeleteModal = () => {
    setIsBulkDeleteModalOpen(false);
  };

  const confirmBulkDelete = () => {
    if (onBulkDelete) {
      const ids = selectedRows.map((row) => row.id);
      onBulkDelete(ids);
    }
    closeBulkDeleteModal();
  };

  const handleBulkDownload = () => {
    if (onBulkDownload) {
      const ids = selectedRows.map((row) => row.id);
      onBulkDownload(ids);
    }
  };

  const handleBulkMove = () => {
    if (onBulkMove) {
      onBulkMove();
    }
  };

  return (
    <div className='flex gap-4 mb-2'>
      <h5 className='file-management-heading'>Files Management</h5>
      {/* <div className="relative">
        <SearchRoundedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search by project name..."
          className="pl-10 flex-grow h-10 dark:text-white dark:border-[#FFFFFF26]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div> */}

      {/* Upload Progress */}
      {uploadProgress > 0 && (
        <div className='flex items-center gap-2 ml-auto bg-white dark:bg-[#1a1a1a] rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700'>
          <Spinner size='sm' color='gradient' />
          <span className='text-sm font-medium'>
            Uploading... {uploadProgress}%
          </span>
        </div>
      )}

      {/* Selection info and Bulk Actions */}
      {selectedRowsCount > 0 && !uploadProgress && (
        <div className='flex items-center gap-2 ml-auto mr-4'>
          <span className='text-sm font-medium text-muted-foreground'>
            {selectedRowsCount} {selectedRowsCount === 1 ? 'item' : 'items'}{' '}
            selected
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D] w-fit focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:ring-offset-0'
              >
                <MaterialIcon icon='checklist' size={20} />
                Bulk Actions
                <MaterialIcon icon='expand_more' size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56 p-1'>
              <DropdownMenuItem
                onClick={() => canPublishSelected && handleBulkPublish()}
                disabled={!canPublishSelected}
                className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              >
                <FileUpload
                  className='text-black dark:text-white mr-2 h-4 w-4'
                  style={{ fontSize: '16px' }}
                />
                <span className='text-black dark:text-white'>
                  Submit for Approval
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => canDownloadSelected && handleBulkDownload()}
                disabled={!canDownloadSelected}
                className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              >
                <DownloadIcon
                  className='text-black dark:text-white mr-2 h-4 w-4'
                  style={{ fontSize: '16px' }}
                />
                <span className='text-black dark:text-white'>Download</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => canMoveSelected && handleBulkMove()}
                disabled={!canMoveSelected}
                className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              >
                <MoveIcon
                  className='text-black dark:text-white mr-2 h-4 w-4'
                  style={{ fontSize: '16px' }}
                />
                <span className='text-black dark:text-white'>Move</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => canDeleteSelected && handleBulkDelete()}
                disabled={!canDeleteSelected}
                className={`text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
                  canDeleteSelected ? 'text-[#D75C5C]' : ''
                }`}
              >
                <MaterialIcon
                  icon='delete'
                  className='mr-2 h-4 w-4'
                  style={{ fontSize: '16px' }}
                />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div
        className={`flex ${
          selectedRowsCount > 0 || uploadProgress > 0 ? '' : 'ml-auto'
        } gap-4`}
      >
        {/* View Mode Toggle Button */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D] w-fit'
                variant='ghost'
                onClick={() =>
                  onViewModeChange(viewMode === 'flat' ? 'tree' : 'flat')
                }
              >
                {viewMode === 'flat' ? (
                  <>
                    <MaterialIcon icon='account_tree' />
                    Tree View
                  </>
                ) : (
                  <>
                    <MaterialIcon icon='view_list' />
                    Flat View
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Switch to {viewMode === 'flat' ? 'Tree' : 'Flat'} View</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* {isFolderSelected && selectedRows.length > 0 && (
          <>
            <Button
              className="card-bg header-text text-black bg-[#0000000D] dark:text-white dark:bg-[#FFFFFF0D] disabled:bg-[#D1D1D1] disabled:text-white dark:disabled:bg-[#D1D1D1] dark:disabled:text-black disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
              variant="ghost"
              disabled={!isFolderSelected}
              onClick={handleVersionHistory}
            >
              <HistoryRoundedIcon />
              Version History
            </Button>
            <Button
              className="card-bg header-text text-black bg-[#0000000D] dark:text-white dark:bg-[#FFFFFF0D] disabled:bg-[#D1D1D1] disabled:text-white dark:disabled:bg-[#D1D1D1] dark:disabled:text-black disabled:cursor-not-allowed transition-all duration-200 ease-in-out"
              variant="ghost"
              disabled={!enableButtons}
              onClick={handlePublishBtn}
            >
              <MaterialIcon icon="check" />
              Publish
            </Button>
          </>
        )} */}

        {/* Columns Dropdown */}
        {availableColumns.length > 0 && onColumnVisibilityChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D] w-fit focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:ring-offset-0'
              >
                <MaterialIcon icon='add_column_right' size={20} />
                Columns
                <MaterialIcon icon='expand_more' size={20} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              {availableColumns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className='capitalize'
                  checked={columnVisibility?.[column.id] !== false}
                  onCheckedChange={(checked) => {
                    onColumnVisibilityChange({
                      ...columnVisibility,
                      [column.id]: !!checked,
                    });
                  }}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {activePath.length > 0 && activeAllowedActions.upload && (
          <div className='relative'>
            <Button
              ref={uploadButtonRef}
              className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D] w-fit'
              variant='ghost'
              disabled={false}
              onClick={handleUpload}
            >
              <MaterialIcon icon='file_upload' />
              Upload File
            </Button>
          </div>
        )}
        {activeAllowedActions.newfolder && (
          <Button
            className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D]'
            variant='ghost'
            disabled={false}
            onClick={handleNewFolder}
          >
            <MaterialIcon icon='add' />
            New {entityName}
          </Button>
        )}
      </div>

      {/* New folder Modal Component */}
      <Modal
        isOpen={isNewFolderModalOpen}
        onClose={closeNewFolderModal}
        title={`New ${entityName}`}
      >
        {/* Input Component */}
        <Label className='text-base font-light leading-6 tracking-wide dark:text-white'>
          {entityName} Name
        </Label>
        <Input
          type='text'
          placeholder='Type here...'
          className='flex-grow h-[42px] dark:text-white dark:border-[#FFFFFF26] mb-6 mt-1'
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
        />
        {/* Modal Footer  */}
        <div className='flex justify-end'>
          <div className='flex justify-end space-x-4'>
            <Button
              className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D] dark:text-white'
              variant='secondary'
              onClick={closeNewFolderModal}
            >
              <MaterialIcon icon='close' size='sm' className='w-5 h-5' />
              Cancel
            </Button>
            <Button
              type='submit'
              className='px-4 py-2 text-white rounded-lg admin-btn'
              onClick={createNewFolder}
              disabled={!folderName}
            >
              <MaterialIcon icon='check' size='sm' className='w-5 h-5' />
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Submit for Approval Modal */}
      <Modal
        isOpen={isBulkPublishModalOpen}
        onClose={closeBulkPublishModal}
        title={`Submit ${selectedRowsCount} ${
          selectedRowsCount === 1 ? 'Item' : 'Items'
        } for Approval`}
      >
        <TextArea
          label='Comments (Optional)'
          id='bulk-publish-comments'
          placeholder='Add comments for this approval submission...'
          value={bulkPublishComments}
          onChange={(e) => setBulkPublishComments(e.target.value)}
        />
        <div className='flex justify-end'>
          <div className='flex justify-end space-x-4'>
            <Button
              className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D] dark:text-white'
              variant='secondary'
              onClick={closeBulkPublishModal}
            >
              <MaterialIcon icon='close' size='sm' className='w-5 h-5' />
              Cancel
            </Button>
            <Button
              type='submit'
              className='px-4 py-2 text-white rounded-lg admin-btn'
              onClick={confirmBulkPublish}
            >
              <MaterialIcon icon='approval' size='sm' className='w-5 h-5' />
              Submit All
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={closeBulkDeleteModal}
        title={`Delete ${selectedRowsCount} ${
          selectedRowsCount === 1 ? 'Item' : 'Items'
        }`}
      >
        <div className='text-sm text-muted-foreground mb-4'>
          Are you sure you want to delete the selected items? This action cannot
          be undone.
        </div>
        <div className='flex justify-end'>
          <div className='flex justify-end space-x-4'>
            <Button
              className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D] dark:text-white'
              variant='secondary'
              onClick={closeBulkDeleteModal}
            >
              <MaterialIcon icon='close' size='sm' className='w-5 h-5' />
              Cancel
            </Button>
            <Button
              type='submit'
              className='px-4 py-2 text-white rounded-lg bg-[#D75C5C] hover:bg-[#C54545]'
              onClick={confirmBulkDelete}
            >
              <MaterialIcon icon='delete' size='sm' className='w-5 h-5' />
              Delete All
            </Button>
          </div>
        </div>
      </Modal>

      {/* {isUploadDropdownOpen && (
        <div className="origin-top-right absolute right-[15%] top-[17%] mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-[#333333] ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button
              onClick={() => handleSelectOption("File")}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <FileIcon className="mr-2" />
              File
            </button>

            <button
              onClick={() => handleSelectOption("Folder")}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 w-full"
            >
              <FolderIcon className="mr-2" />
              Folder
            </button>
          </div>
        </div>
      )} */}
      <input
        ref={fileInputRef}
        type='file'
        onChange={handleFileChange}
        className='hidden'
      />
      <input
        ref={folderInputRef}
        type='file'
        onChange={handleFolderChange}
        className='hidden'
      />
    </div>
  );
};

export default FileManagementHeader;
