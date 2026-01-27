import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import FileManagementHeader from './FileManagementHeader';
import { format } from 'date-fns';
import { DataTable } from '@/components/table/data-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { VisibilityState } from '@tanstack/react-table';
import { FileData, filemanagementcolumns } from './filemanagementcolumns';
import { useAccessToken } from '@/hooks/useAccessToken';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import Toast, { useToast } from '../toast';
import {
  EditRounded as EditIcon,
  DeleteRounded as DeleteIcon,
  InfoRounded as DetailsIcon,
  VisibilityRounded as PreviewIcon,
  FileDownloadRounded as DownloadIcon,
  CheckRounded as CheckRoundedIcon,
  CloseRounded as CloseRoundedIcon,
  FileUploadRounded as FileUpload,
  MoreVertRounded as MoreVertical,
  HistoryRounded as History,
  DriveFileMoveRounded as MoveIcon,
} from '@mui/icons-material';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import TextArea from '@/components/ui/TextArea';
import {
  versionHistory,
  versionhistorycolumns,
} from '@/components/FileManagement/versionhistorycolumns';
import { FilePreview } from '@/components/FileManagement/FilePreview';
import MoveModal from '@/components/FileManagement/MoveModal';

type SortingState = Array<{
  id: string; // Column ID (e.g., 'name', 'age', etc.)
  desc: boolean; // Boolean indicating if sorting is descending (true) or ascending (false)
}>;

// Extended FileData interface for tree view
export interface TreeFileData extends FileData {
  depth?: number;
  hasChildren?: boolean;
  expanded?: boolean;
  children?: TreeFileData[];
  parentPath?: string;
  isLoading?: boolean;
  isLoadingPlaceholder?: boolean;
}

const FileManagement = () => {
  const [fileData, setFileData] = useState<FileData[]>([]);
  const [viewMode, setViewMode] = useState<'flat' | 'tree'>('flat');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [folderContentsCache, setFolderContentsCache] = useState<
    Map<string, TreeFileData[]>
  >(new Map());
  const [loadingFolders, setLoadingFolders] = useState<Set<string>>(new Set());

  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const [uploadProgress, setUploadProgress] = React.useState(0);
  // const [isUploading, setIsUploading] = React.useState(false);
  // const [error, setError] = React.useState<string | undefined>();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [isPathTruncated, setIsPathTruncated] = useState(false);
  const [selectedRow, setSelectedRow] = useState<FileData | null>(null);
  const [isRename, setIsRename] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [oldName, setOldName] = useState('');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const [comments, setComments] = useState<string>('');
  const [isDelete, setIsDelete] = useState(false);
  const [fileExtension, setFileExtension] = useState('');
  const [isFile, setIsFile] = useState<boolean>(false);
  const [id, setId] = useState(''); // to store file or folder id -> rename, delete, publish.
  const [isVersionHistoryModalOpen, setIsVersionHistoryModalOpen] =
    useState<boolean>(false);
  const [versionHistoryData, setVersionHistoryData] = useState<
    versionHistory[]
  >([]);
  const [isVersionHistoryDataLoading, setIsVersionHistoryDataLoading] =
    useState<boolean>(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [selectedRows, setSelectedRows] = useState<FileData[]>([]);
  const [rootAllowedActions, setRootAllowedActions] = useState<{
    newfolder?: boolean;
    upload?: boolean;
  }>({});
  // Track the active/focused path in tree view (for breadcrumb display)
  const [treeViewActivePath, setTreeViewActivePath] = useState<string[]>([]);
  // Track the active folder's ID in tree view (for operations like new folder)
  const [treeViewActivePathId, setTreeViewActivePathId] = useState<string>('');
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  // Move modal state
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [itemsToMove, setItemsToMove] = useState<FileData[]>([]);
  const [isMoveLoading, setIsMoveLoading] = useState(false);

  // const [currentPathId, setCurrentPathId] = React.useState<string>("");

  const { accessToken, getAccessToken, idToken } = useAccessToken();

  const pathRef = useRef<HTMLDivElement>(null);

  const { toast, showToast, hideToast } = useToast();

  const pathid = localStorage.getItem('currentpathid') ?? '';

  useEffect(() => {
    if (accessToken == null) {
      getAccessToken();
    }
  }, [accessToken, getAccessToken, idToken]);

  // useEffect(() => {
  //   handleSort(sorting);
  // }, [sorting]);

  // const handleSort = async (sortData: SortingState) => {
  //   const sortBy = sortData.length > 0 ? sortData[0].id : "";
  //   const sortOrder =
  //     sortData.length > 0 ? (sortData[0].desc ? "desc" : "asc") : "";
  //   fetchFileData(sortBy, sortOrder);
  // };

  useEffect(() => {
    fetchFileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, idToken]);

  const manipulateVersionHistoryData = (fileData: versionHistory[]) => {
    return fileData.map((file) => ({
      ...file,
      lastModifiedDateTime: format(
        file.lastModifiedDateTime,
        'dd MMM yyyy, hh:mm a'
      ),
    }));
  };

  useEffect(() => {
    async function fetchVersionHistoryData() {
      try {
        const result = await getVersionHistoryData();
        if (result) {
          const data = manipulateVersionHistoryData(result);
          setVersionHistoryData(data);
          setIsVersionHistoryDataLoading(false);
        } else {
          console.error('Failed to fetch version history data');
        }
      } catch (error) {
        console.error('Error fetching version history data:', error);
      }
    }

    if (isVersionHistoryModalOpen) {
      fetchVersionHistoryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, selectedRow, isVersionHistoryModalOpen]);

  async function getVersionHistoryData(): Promise<
    versionHistory[] | undefined
  > {
    if (accessToken === null) {
      console.error('Access token is null');
      return undefined;
    }
    try {
      let url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/versions`;
      const queryParams = new URLSearchParams({
        ...(selectedRow && { pathid: selectedRow.id }),
      });

      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      setIsVersionHistoryDataLoading(true);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          Authorization2: `${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.items;
    } catch (error) {
      console.error('Error fetching version history:', error);
      setIsVersionHistoryDataLoading(false);
      return undefined;
    }
  }

  useEffect(() => {
    const checkPathOverflow = () => {
      if (pathRef.current) {
        setIsPathTruncated(
          pathRef.current.scrollWidth > pathRef.current.clientWidth
        );
      }
    };

    checkPathOverflow();
    window.addEventListener('resize', checkPathOverflow);

    return () => {
      window.removeEventListener('resize', checkPathOverflow);
    };
  }, [selectedPath]);

  const manipulateFileData = useCallback((fileData: FileData[]): FileData[] => {
    return fileData.map((file) => ({
      ...file,
      created: format(file.created, 'dd MMM yyyy, hh:mm a'),
      modified: format(file.modified, 'dd MMM yyyy, hh:mm a'),
      size: convertFromBytes(file.size),
    }));
  }, []);

  const fetchFileData = useCallback(
    async (path?: string, isSubfolder: boolean = false) => {
      if (accessToken !== null) {
        try {
          let url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/list`;

          const pathToFetch =
            path || localStorage.getItem('currentpath') || '/';
          const queryParams = new URLSearchParams({
            path: pathToFetch,
          });

          if (queryParams.toString()) {
            url += `?${queryParams.toString()}`;
          }
          // Only set global loading for main data fetch, not subfolder expansion
          if (!isSubfolder) {
            setIsDataLoading(true);
          }
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${idToken}`,
              Authorization2: `${accessToken}`,
              Accept: 'application/json',
            },
          });

          const data = await response.json();

          if (response.status == 400) {
            showToast(`An error occurred: ${data.message}`, 'Error', 'error');
            throw new Error(data.message);
          } else if (response.status == 401) {
            showToast(data.message, 'Error', 'error');
            await getAccessToken(); // Attempt to refresh the token
            throw new Error(data.message);
          } else if (response.status == 500) {
            showToast(`${data.message}`, 'Error', 'error');
            throw new Error(`${data.message}`);
          } else if (!response.ok) {
            const errorMessage = `Failed to GET ${url.split('/').pop()}: ${
              data.message
            }`;
            showToast(errorMessage, 'Error', 'error');
            throw new Error(errorMessage);
          } else if (response.ok) {
            if (!isSubfolder) {
              const pathArray = data.current_path
                ? data.current_path.split('/').filter(Boolean)
                : [];
              setSelectedPath(pathArray);
              // Also update tree view active path to keep them in sync
              setTreeViewActivePath(pathArray);
              localStorage.setItem('currentpathid', data.current_pathid);
              localStorage.setItem('currentpath', data.current_path);
              // Store root allowed_actions if available
              if (data.allowed_actions) {
                setRootAllowedActions(data.allowed_actions);
              }
              const updatedData = manipulateFileData(data.items);
              setFileData(updatedData);
              setIsDataLoading(false);
            } else {
              // Return data for subfolder caching, including allowed_actions
              const updatedData = manipulateFileData(data.items);
              return {
                items: updatedData,
                allowed_actions: data.allowed_actions,
              };
            }
            // showToast(`Fetch file data successful`, "Success", "success");
          }
          return { data };
        } catch (error) {
          // Only reset global loading for main data fetch
          if (!isSubfolder) {
            setIsDataLoading(false);
          }
          console.error('Failed to fetch file list:', error);
        }
      }
    },
    [accessToken, idToken, getAccessToken, showToast, manipulateFileData]
  );

  // Helper function to refresh data based on current view mode
  // This ensures tree view cache is updated when in tree view, or flat view data when in flat view
  const refreshCurrentView = useCallback(async () => {
    if (viewMode === 'tree') {
      // In tree view, refresh root data and all expanded folders in parallel for better performance
      const cachedPaths = Array.from(folderContentsCache.keys());

      try {
        // Execute root fetch and all cached folder fetches in parallel
        const [, ...subfolderResults] = await Promise.all([
          fetchFileData(),
          ...cachedPaths.map((folderPath) => fetchFileData(folderPath, true)),
        ]);

        // Update cache with subfolder results
        if (cachedPaths.length > 0) {
          const newCache = new Map<string, TreeFileData[]>();

          cachedPaths.forEach((folderPath, index) => {
            const subfolderResult = subfolderResults[index];
            if (subfolderResult && 'items' in subfolderResult) {
              newCache.set(folderPath, subfolderResult.items as TreeFileData[]);
            }
          });

          setFolderContentsCache(newCache);
        }
      } catch (error) {
        console.error('Error refreshing tree view data:', error);
        // Fallback: at minimum refresh root data
        fetchFileData();
      }
    } else {
      // In flat view, refresh the main data
      fetchFileData();
    }
  }, [viewMode, folderContentsCache, fetchFileData]);

  // Handle view mode changes between flat and tree view
  const handleViewModeChange = useCallback(
    (mode: 'flat' | 'tree') => {
      if (mode === 'flat' && viewMode === 'tree') {
        // Switching from Tree View to Flat View
        // Navigate to the tree view's active path (the currently expanded/focused folder)
        if (treeViewActivePath.length > 0) {
          const pathToNavigate = '/' + treeViewActivePath.join('/');
          localStorage.setItem('currentpath', pathToNavigate);
          fetchFileData(pathToNavigate);
        }
        // Clear tree view state when switching to flat view
        setExpandedFolders(new Set());
        setFolderContentsCache(new Map());
        setTreeViewActivePathId('');
      } else if (mode === 'tree' && viewMode === 'flat') {
        // Switching from Flat View to Tree View
        // Sync tree view active path with the current flat view path
        setTreeViewActivePath(selectedPath);
        // Reset tree view specific state
        setTreeViewActivePathId('');
      }
      setViewMode(mode);
    },
    [viewMode, treeViewActivePath, selectedPath, fetchFileData]
  );

  // Helper function to find a folder item by ID in fileData or cached contents
  const findFolderById = useCallback(
    (folderId: string): FileData | undefined => {
      // First check root fileData
      const rootItem = fileData.find((item) => item.id === folderId);
      if (rootItem) return rootItem;

      // Then check all cached folder contents
      for (const cachedItems of folderContentsCache.values()) {
        const cachedItem = cachedItems.find((item) => item.id === folderId);
        if (cachedItem) return cachedItem;
      }

      return undefined;
    },
    [fileData, folderContentsCache]
  );

  // Helper function to find all nested folder IDs under a given path
  const findNestedFolderIds = useCallback(
    (parentPath: string): string[] => {
      const nestedIds: string[] = [];

      // Check all cached folder contents for folders under this path
      for (const [cachedPath, items] of folderContentsCache.entries()) {
        // If the cached path starts with parent path, it's a nested folder's contents
        if (
          cachedPath.startsWith(parentPath + '/') ||
          cachedPath === parentPath
        ) {
          // Add all folder IDs from this cache entry
          items.forEach((item) => {
            if (!item.isFile && item.id) {
              nestedIds.push(item.id);
            }
          });
        }
      }

      return nestedIds;
    },
    [folderContentsCache]
  );

  // Tree view helper functions
  const toggleFolderExpansion = useCallback(
    async (folderId: string, folderPath: string) => {
      const newExpanded = new Set(expandedFolders);

      if (newExpanded.has(folderId)) {
        // Collapse folder - also collapse all nested folders
        newExpanded.delete(folderId);

        // Find and remove all nested folder IDs from expanded set
        const nestedIds = findNestedFolderIds(folderPath);
        nestedIds.forEach((id) => newExpanded.delete(id));

        // Reset active path to the parent of the collapsed folder
        // This ensures breadcrumb reflects what's visible
        const pathParts = folderPath.split('/').filter(Boolean);
        if (pathParts.length > 1) {
          // Set active path to the parent folder
          const parentPathParts = pathParts.slice(0, -1);
          setTreeViewActivePath(parentPathParts);
          // Find the parent folder's ID using the collapsed folder's parentReference
          const parentFolderId = findFolderById(folderId)?.parentReference?.id;
          if (parentFolderId) {
            setTreeViewActivePathId(parentFolderId);
            // Update allowed actions for parent folder
            const parentItem = findFolderById(parentFolderId);
            if (parentItem?.allowed_actions) {
              setRootAllowedActions({
                newfolder: parentItem.allowed_actions.newfolder,
                upload: parentItem.allowed_actions.upload,
              });
            }
          }
        } else {
          // Collapsing a root-level folder - reset to root
          setTreeViewActivePath([]);
          setTreeViewActivePathId('');
        }
      } else {
        // Expand folder - fetch contents if not cached
        newExpanded.add(folderId);

        // Update the active path and ID in tree view to the expanded folder
        const pathParts = folderPath.split('/').filter(Boolean);
        setTreeViewActivePath(pathParts);
        setTreeViewActivePathId(folderId);

        // Immediately set allowed actions from the folder item being expanded
        // This ensures buttons appear right away without waiting for API
        const folderItem = findFolderById(folderId);
        if (folderItem?.allowed_actions) {
          setRootAllowedActions({
            newfolder: folderItem.allowed_actions.newfolder,
            upload: folderItem.allowed_actions.upload,
          });
        }

        if (!folderContentsCache.has(folderPath)) {
          try {
            // Add folder to loading state
            setLoadingFolders((prev) => new Set(prev).add(folderId));
            const subfolderResult = await fetchFileData(folderPath, true);
            if (subfolderResult && 'items' in subfolderResult) {
              setFolderContentsCache((prev) => {
                const newCache = new Map(prev);
                newCache.set(
                  folderPath,
                  subfolderResult.items as TreeFileData[]
                );
                return newCache;
              });
            }
          } catch (error) {
            console.error('Error fetching subfolder contents:', error);
            newExpanded.delete(folderId); // Remove from expanded if fetch failed
          } finally {
            // Remove folder from loading state
            setLoadingFolders((prev) => {
              const newSet = new Set(prev);
              newSet.delete(folderId);
              return newSet;
            });
          }
        }
      }

      setExpandedFolders(newExpanded);
    },
    [
      expandedFolders,
      folderContentsCache,
      fetchFileData,
      findFolderById,
      findNestedFolderIds,
    ]
  );

  // Build tree structure for display
  const buildTreeData = useCallback(
    (
      items: FileData[],
      parentPath: string = '',
      depth: number = 0
    ): TreeFileData[] => {
      return items.map((item) => {
        const treeItem: TreeFileData = {
          ...item,
          depth,
          hasChildren: !item.isFile && (item.childCount > 0 || item.isFolder),
          expanded: expandedFolders.has(item.id),
          parentPath,
          isLoading: loadingFolders.has(item.id),
        };

        // If folder is expanded and we have cached contents, add children
        if (
          treeItem.expanded &&
          !item.isFile &&
          folderContentsCache.has(item.path)
        ) {
          const children = folderContentsCache.get(item.path) || [];
          treeItem.children = buildTreeData(children, item.path, depth + 1);
        } else if (treeItem.expanded && !item.isFile && treeItem.isLoading) {
          // Show a loading placeholder while fetching
          treeItem.children = [
            {
              ...item,
              id: `${item.id}-loading`,
              name: 'Loading...',
              isFile: true,
              depth: depth + 1,
              isLoadingPlaceholder: true,
            } as TreeFileData,
          ];
        }

        return treeItem;
      });
    },
    [expandedFolders, folderContentsCache, loadingFolders]
  );

  // Flatten tree for table display
  const flattenTree = useCallback((nodes: TreeFileData[]): TreeFileData[] => {
    const result: TreeFileData[] = [];

    const traverse = (node: TreeFileData) => {
      result.push(node);
      if (node.expanded && node.children) {
        node.children.forEach(traverse);
      }
    };

    nodes.forEach(traverse);
    return result;
  }, []);

  // Prepare display data based on view mode
  const displayData = useMemo(() => {
    if (viewMode === 'flat') {
      return fileData;
    }

    // Build and flatten tree structure
    const treeNodes = buildTreeData(fileData);
    return flattenTree(treeNodes);
  }, [fileData, viewMode, buildTreeData, flattenTree]);

  const convertFromBytes = (
    bytes: number | string | null | undefined
  ): string => {
    // Force conversion to number
    const numBytes = Number(bytes);
    if (isNaN(numBytes) || numBytes < 0) {
      console.error('Invalid input for file size:', bytes);
      return 'Invalid size';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    let size = numBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  // const handleRowSelectionChange = (selectedRows: any) => {
  //   if (selectedRows.length > 0) {
  //     setSelectedRows(selectedRows);

  //     // Check if any selected row has an "unknown" approval status
  //     // const hasUnknownStatus = selectedRows.some(
  //     //   (row: any) => row.approvalStatus.toLowerCase() === "unknown"
  //     // );

  //     // Check if all selected items are files or all are folders
  //     const allFiles = selectedRows.every((row: any) => row.isFile);

  //     setIsFolderSelected(allFiles);
  //     // setEnablePublishButton(!hasUnknownStatus);
  //     setEnablePublishButton(allFiles);
  //   } else {
  //     setIsFolderSelected(false);
  //     setEnablePublishButton(false);
  //   }
  // };

  // const getRowId = (row: any) => {
  //   // Return a unique identifier for the row
  //   return row.id?.toString() || "";
  // };

  const handleColumnClick = (col: any, row: any) => {
    if (col === 'name') {
      const isFile = row.original.isFile;
      const isFolder = row.original.isFolder;
      const allowedActions = row.original.allowed_actions || {};

      // For files, check if preview or download is allowed
      if (isFile) {
        // Check if preview is allowed and true
        if (allowedActions.preview === true) {
          // Open preview in sheet
          setPreviewFile(row.original);
          setIsPreviewOpen(true);
        } else if (allowedActions.download === true) {
          // If preview is not allowed but download is, open in new tab
          window.open(row.original.webUrl, '_blank');
        }
        // If neither preview nor download is allowed, do nothing
      }
      // For folders, check if children permission is true
      else if (isFolder) {
        // Only allow folder navigation if children permission is true and not pending
        if (
          allowedActions.children === true &&
          row.original.approvalStatus !== 'Pending'
        ) {
          // In tree view, just expand/collapse; in flat view, navigate
          if (viewMode === 'tree') {
            toggleFolderExpansion(row.original.id, row.original.path);
          } else {
            localStorage.setItem('currentpath', row.original.path);
            setSelectedRows([]); // Clear selection when navigating
            fetchFileData();
          }
        }
        // If children permission is false or folder is pending, folder click is disabled (do nothing)
      }
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
  };

  const handlePreviewModal = (row: FileData): void => {
    setPreviewFile(row);
    setIsPreviewOpen(true);
  };

  // Unified download function for both single and bulk operations
  const handleDownload = async (
    itemIds?: string[],
    fileName?: string
  ): Promise<void> => {
    if (!accessToken || !idToken) {
      return;
    }

    const downloadIds = itemIds || [];

    if (downloadIds.length === 0) {
      return;
    }

    // Determine if this is bulk download (more than 1 item)
    const isBulkDownload = downloadIds.length > 1;

    try {
      // Use the download API endpoint - same endpoint for single and bulk
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
          },
          body: JSON.stringify(downloadIds), // Send array of IDs directly
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download file(s)');
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Check content-type to determine file type
      const contentType = response.headers.get('Content-Type') || '';
      const isZipResponse =
        contentType.includes('zip') || blob.type.includes('zip');

      // Create a temporary download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Determine filename based on response type and request type
      if (isBulkDownload || isZipResponse) {
        // For bulk downloads or if backend returns zip, use .zip extension
        link.download = `files-${new Date().getTime()}.zip`;
      } else {
        // For single file, use the provided filename
        link.download = fileName || `download-${new Date().getTime()}`;
      }

      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (isBulkDownload) {
        showToast('Files downloaded successfully', 'success');
      }
    } catch (err) {
      console.error('Error downloading file(s):', err);
      if (isBulkDownload) {
        showToast('Failed to download files', 'error');
      }
    }
  };
  // File upload function with progress tracking
  const uploadFile = async (
    file: File,
    onProgress: (progress: number) => void,
    targetPathId?: string
  ) => {
    let url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/upload`;

    // Use provided targetPathId or fall back to pathid from localStorage
    const uploadPathId = targetPathId || pathid;
    const queryParams = new URLSearchParams({
      ...(uploadPathId && { pathid: uploadPathId }),
    });
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (accessToken != null) {
      try {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // const percentComplete = (event.loaded / event.total) * 100;
            onProgress(99);
          }
        };

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              onProgress(100);
              resolve();
            } else if (xhr.status == 400) {
              showToast(
                `An error occurred while uploading the file`,
                'Error',
                'error'
              );
              reject(new Error('An error occurred while uploading the file'));
            } else if (xhr.status == 401) {
              showToast('Token Expired', 'Error', 'error');
              // await getAccessToken(); // Attempt to refresh the token
              reject(new Error('Token Expired'));
            } else if (xhr.status == 500) {
              showToast('Something went wrong', 'Error', 'error');
              reject(new Error('Something went wrong'));
            } else {
              reject(new Error(`HTTP error! status: ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.open('POST', url);
          xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
          xhr.setRequestHeader('Authorization2', `${accessToken}`);
          xhr.send(formData);
        });
      } catch (error) {
        console.error('Upload failed:', error);
        throw error;
      }
    }
  };

  const handleFileUpload = async (files: FileList) => {
    // Determine the target path ID based on view mode
    const targetPathId =
      viewMode === 'tree' && treeViewActivePathId
        ? treeViewActivePathId
        : pathid;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(30);
      try {
        await uploadFile(
          file,
          (progress) => {
            console.log(`Upload progress for ${file.name}: ${progress}%`);
            setUploadProgress(progress);
          },
          targetPathId
        );
        setUploadProgress(0);

        // Refresh data based on view mode
        if (viewMode === 'tree' && treeViewActivePathId) {
          // In tree view, refresh the expanded folder's contents
          const activeFolderPath = '/' + treeViewActivePath.join('/');
          const subfolderResult = await fetchFileData(activeFolderPath, true);
          if (subfolderResult && 'items' in subfolderResult) {
            setFolderContentsCache((prev) => {
              const newCache = new Map(prev);
              newCache.set(
                activeFolderPath,
                subfolderResult.items as TreeFileData[]
              );
              return newCache;
            });
          }
        } else {
          // In flat view, refresh the current view
          fetchFileData();
        }
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }
  };

  const handlePathClick = (index: number) => {
    const newPath = '/' + selectedPath?.slice(0, index + 1).join('/');
    localStorage.setItem('currentpath', newPath);
    setSelectedRows([]); // Clear selection when navigating via breadcrumb
    fetchFileData();
  };

  const handleHomeClick = () => {
    localStorage.setItem('currentpath', '/');
    setSelectedRows([]); // Clear selection when navigating home
    fetchFileData();
  };

  // Tree view breadcrumb navigation handlers
  const handleTreeViewPathClick = useCallback(
    (index: number) => {
      // Get the path up to the clicked index
      const newActivePath = treeViewActivePath.slice(0, index + 1);
      const newPath = '/' + newActivePath.join('/');

      // Update the active path for breadcrumb display
      setTreeViewActivePath(newActivePath);
      // Reset the active path ID since we're navigating to a different location
      setTreeViewActivePathId('');

      // Reset tree view state and fetch data for the new path
      // This effectively "navigates" to that folder in tree view
      // rootAllowedActions will be updated by fetchFileData() when API responds
      setExpandedFolders(new Set());
      setFolderContentsCache(new Map());

      // Update localStorage and fetch new data
      localStorage.setItem('currentpath', newPath);
      setSelectedRows([]); // Clear selection when navigating via breadcrumb
      fetchFileData();
    },
    [treeViewActivePath, fetchFileData]
  );

  const handleTreeViewHomeClick = useCallback(() => {
    // Reset to root - collapse all folders and clear active path
    setTreeViewActivePath([]);
    setTreeViewActivePathId('');
    setExpandedFolders(new Set());
    setFolderContentsCache(new Map());

    // Navigate to root
    // rootAllowedActions will be updated by fetchFileData() when API responds
    localStorage.setItem('currentpath', '/');
    setSelectedRows([]); // Clear selection when navigating home
    fetchFileData();
  }, [fetchFileData]);

  const handlePublishBtn = (row: FileData): void => {
    setIsPublishModalOpen(true);
    setSelectedRow(row);
  };

  const closePublishModal = (): void => {
    setIsPublishModalOpen(false);
    setComments('');
    setSelectedRow(null);
  };

  const handleCommentsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    setComments(e.target.value);
  };

  // Unified publish function for both single and bulk operations
  const handlePublish = async (ids?: string[], publishComments?: string) => {
    // If no ids provided, use selectedRow for single publish
    const itemIds = ids || (selectedRow?.id ? [selectedRow.id] : []);
    const commentsToSend =
      publishComments !== undefined ? publishComments : comments;

    if (accessToken !== null && itemIds.length > 0) {
      try {
        let url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/publish`;
        const queryParams = new URLSearchParams({
          ...(commentsToSend && { comment: commentsToSend }),
        });

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
          },
          body: JSON.stringify(itemIds),
        });

        const data = await response.json();

        if (response.status == 400) {
          showToast(`An error occurred: ${data.message}`, 'Error', 'error');
          throw new Error('Error Occurred while publishing');
        } else if (response.status == 401) {
          showToast(data.message, 'Error', 'error');
          await getAccessToken(); // Attempt to refresh the token
          throw new Error('Token Expired');
        } else if (response.status == 500) {
          showToast(`${data.message}`, 'Error', 'error');
          throw new Error(`${data.message}`);
        } else if (!response.ok) {
          const errorMessage = `Failed to submit for approval: ${data.message}`;
          showToast(errorMessage, 'Error', 'error');
          throw new Error(errorMessage);
        } else if (response.ok) {
          const message =
            itemIds.length > 1
              ? `Successfully submitted ${itemIds.length} item(s) for approval`
              : `Submit for approval successful`;
          showToast(message, 'Success', 'success');

          // Clear selection for bulk operations
          if (ids) {
            setSelectedRows([]);
          }

          // Refresh data based on current view mode
          await refreshCurrentView();
        }
        return { data };
      } catch (error) {
        console.error('Submit for approval error:', error);
        const errorMessage =
          itemIds.length > 1
            ? 'Failed to submit selected items for approval'
            : 'Failed to submit for approval';
        showToast(errorMessage, 'Error', 'error');
      } finally {
        // Close modal for single publish
        if (!ids) {
          closePublishModal();
        }
      }
    }
  };

  const handleNewFolder = async (foldername: string) => {
    if (accessToken !== null) {
      try {
        let url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/newfolder`;
        // Use treeViewActivePathId for tree view, otherwise use pathid from localStorage
        const targetPathId =
          viewMode === 'tree' && treeViewActivePathId
            ? treeViewActivePathId
            : pathid;
        const queryParams = new URLSearchParams({
          ...(foldername && { folder: foldername }),
          pathid: targetPathId,
        });

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
          },
          // body: JSON.stringify(pathIds),
        });
        const data = await response.json();

        if (response.status == 400) {
          showToast(`An error occurred: ${data.message}`, 'Error', 'error');
          return { error: data.message };
        } else if (response.status == 401) {
          showToast(data.message, 'Error', 'error');
          await getAccessToken(); // Attempt to refresh the token
          return { error: data.message };
        } else if (response.status == 500) {
          showToast(`${data.message}`, 'Error', 'error');
          throw new Error(`${data.message}`);
        } else if (!response.ok) {
          const errorMessage = `Failed to POST ${url.split('/').pop()}: ${
            data.message
          }`;
          showToast(errorMessage, 'Error', 'error');
          throw new Error(errorMessage);
        } else if (response.ok) {
          showToast(`Folder successfully created`, 'Success', 'success');
          // Refresh data based on view mode
          if (viewMode === 'tree' && treeViewActivePathId) {
            // In tree view, refresh the expanded folder's contents
            const activeFolderPath = '/' + treeViewActivePath.join('/');
            const subfolderResult = await fetchFileData(activeFolderPath, true);
            if (subfolderResult && 'items' in subfolderResult) {
              setFolderContentsCache((prev) => {
                const newCache = new Map(prev);
                newCache.set(
                  activeFolderPath,
                  subfolderResult.items as TreeFileData[]
                );
                return newCache;
              });
            }
          } else {
            // In flat view, refresh the current view
            fetchFileData();
          }
        }
        return { data };
      } catch (error) {
        console.error('newfolder error:', error);
      }
    }
  };

  const renderPath = (isTreeView: boolean = false) => {
    // Use treeViewActivePath for tree view, selectedPath for flat view
    const currentPath = isTreeView ? treeViewActivePath : selectedPath;
    const onHomeClick = isTreeView ? handleTreeViewHomeClick : handleHomeClick;
    const onPathClick = isTreeView ? handleTreeViewPathClick : handlePathClick;

    return (
      <div
        className='mb-4 flex items-center flex-wrap overflow-hidden'
        ref={pathRef}
      >
        <button
          onClick={onHomeClick}
          className={`text-xs font-semibold leading-5 text-left mr-2 hover:underline ${
            currentPath?.length === 0
              ? 'dark:text-white text-[#222222]'
              : 'dark:text-[#FFFFFF73] text-[#00000073]'
          }`}
        >
          Asset Information Library
        </button>
        {currentPath?.map((folder: any, index: any) => (
          <React.Fragment key={index}>
            <span className='text-xs font-semibold leading-5 text-left dark:text-white text-[#222222] mr-2'>
              /
            </span>
            <button
              onClick={() => onPathClick(index)}
              className={`text-xs font-semibold leading-5 text-left mr-2 hover:underline ${
                index === currentPath.length - 1
                  ? 'dark:text-white text-[#222222]'
                  : 'dark:text-[#FFFFFF73] text-[#00000073]'
              }`}
            >
              {folder}
            </button>
          </React.Fragment>
        ))}
        {isPathTruncated && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='text-gray-600 cursor-help'>...</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{currentPath.join(' / ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };

  const handleRenameModal = (row: FileData): void => {
    setId(row.id);
    setIsFile(row.isFile);
    const lastDotIndex = row.name.lastIndexOf('.');
    setOldName(row.name);
    setNewName(
      lastDotIndex !== -1 ? row.name.slice(0, lastDotIndex) : row.name
    ); //initial value to input box
    if (lastDotIndex !== -1) {
      setFileExtension(row.name.substring(lastDotIndex));
    } else {
      setFileExtension('');
    }
    setIsRename(true);
  };

  const closeRenameModal = (): void => {
    setIsRename(false);
    setNewName('');
    setOldName('');
    setId('');
    setIsFile(false);
    setFileExtension('');
  };

  const handleRename = async () => {
    // do api call here
    if (accessToken !== null) {
      try {
        let url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/rename`;
        const queryParams = new URLSearchParams({
          ...(id && { pathid: id }),
          type: isFile ? 'file' : 'folder',
          new_name: newName,
        });

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
          },
          // body: JSON.stringify(pathIds),
        });
        const data = await response.json();

        if (response.status == 400) {
          showToast(`An error occurred: ${data.message}`, 'Error', 'error');
          return { error: data.message };
        } else if (response.status == 401) {
          showToast(data.message, 'Error', 'error');
          await getAccessToken(); // Attempt to refresh the token
          return { error: data.message };
        } else if (response.status == 500) {
          showToast(`${data.message}`, 'Error', 'error');
          throw new Error(`${data.message}`);
        } else if (!response.ok) {
          const errorMessage = `Failed to POST ${url.split('/').pop()}: ${
            data.message
          }`;
          showToast(errorMessage, 'Error', 'error');
          throw new Error(errorMessage);
        } else if (response.ok) {
          showToast(
            `${isFile ? 'File' : 'Folder'} successfully renamed`,
            'Success',
            'success'
          );
          // Refresh data based on current view mode
          await refreshCurrentView();
          closeRenameModal();
        }
        return { data };
      } catch (error) {
        console.error('rename error:', error);
      }
    }
    closeRenameModal();
  };

  const handleDeleteModal = (row: FileData): void => {
    setOldName(row.name);
    setId(row.id);
    setIsFile(row.isFile);
    setIsDelete(true);
  };

  const closeDeleteModal = (): void => {
    setIsDelete(false);
    setOldName('');
    setId('');
    setIsFile(false);
  };

  // Unified delete function for both single and bulk operations
  const handleDelete = async (itemIds?: string[]) => {
    // Determine if this is bulk delete or single delete
    const isBulkDelete = itemIds && itemIds.length > 0;

    // For single delete, use the id from state
    const deleteIds = isBulkDelete ? itemIds : id ? [id] : [];

    if (accessToken !== null && deleteIds.length > 0) {
      try {
        const url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/delete`;

        // Always send IDs in body as an array (same as publish endpoint)
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
          },
          body: JSON.stringify(deleteIds), // Send array of IDs directly
        });

        const data = await response.json();

        if (response.status == 400) {
          showToast(`An error occurred: ${data.message}`, 'Error', 'error');
          return { error: data.message };
        } else if (response.status == 401) {
          showToast(data.message, 'Error', 'error');
          await getAccessToken(); // Attempt to refresh the token
          return { error: data.message };
        } else if (response.status == 500) {
          showToast(`${data.message}`, 'Error', 'error');
          throw new Error(`${data.message}`);
        } else if (!response.ok) {
          const errorMessage = `Failed to Delete ${url.split('/').pop()}: ${
            data.message
          }`;
          showToast(errorMessage, 'Error', 'error');
          throw new Error(errorMessage);
        } else if (response.ok) {
          const message = isBulkDelete
            ? `Successfully deleted ${deleteIds.length} item(s)`
            : `Item successfully deleted`;
          showToast(message, 'Success', 'success');

          // Clear selection for bulk delete
          if (isBulkDelete) {
            setSelectedRows([]);
          }

          // Refresh data based on current view mode
          await refreshCurrentView();

          // Close modal for single delete
          if (!isBulkDelete) {
            closeDeleteModal();
          }
        }
        return { data };
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    // Close modal for single delete even on failure
    if (!itemIds) {
      closeDeleteModal();
    }
  };

  const handleViewModal = (row: FileData): void => {
    setIsViewModalOpen(true);
    setSelectedRow(row);
  };

  const closeViewModal = (): void => {
    setIsViewModalOpen(false);
    setSelectedRow(null);
  };

  const handleVersionHistory = (row: FileData): void => {
    setIsVersionHistoryModalOpen(true);
    setId(row.id);
    setSelectedRow(row);
  };

  const closeVersionHistoryModal = (): void => {
    setIsVersionHistoryModalOpen(false);
    setSelectedRow(null);
  };

  // Move modal handlers
  const handleMoveModal = (items: FileData[]): void => {
    setItemsToMove(items);
    setIsMoveModalOpen(true);
  };

  const closeMoveModal = (): void => {
    setIsMoveModalOpen(false);
    setItemsToMove([]);
    setIsMoveLoading(false);
  };

  // Handle move API call
  const handleMove = async (destinationPathId: string) => {
    if (accessToken === null || itemsToMove.length === 0) {
      return;
    }

    const itemIds = itemsToMove.map((item) => item.id);

    setIsMoveLoading(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/move?destination_pathid=${destinationPathId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
          Authorization2: `${accessToken}`,
        },
        body: JSON.stringify(itemIds),
      });

      const data = await response.json();

      if (response.status === 400) {
        showToast(`An error occurred: ${data.message}`, 'Error', 'error');
        throw new Error(data.message);
      } else if (response.status === 401) {
        showToast(data.message, 'Error', 'error');
        await getAccessToken();
        throw new Error(data.message);
      } else if (response.status === 500) {
        showToast(`${data.message}`, 'Error', 'error');
        throw new Error(data.message);
      } else if (!response.ok) {
        const errorMessage = `Failed to move items: ${data.message}`;
        showToast(errorMessage, 'Error', 'error');
        throw new Error(errorMessage);
      } else if (response.ok) {
        const message =
          itemIds.length > 1
            ? `Successfully moved ${itemIds.length} items`
            : `Successfully moved "${itemsToMove[0].name}"`;
        showToast(message, 'Success', 'success');

        // Clear selection
        setSelectedRows([]);

        // Close modal
        closeMoveModal();

        // Refresh data based on current view mode
        await refreshCurrentView();
      }
    } catch (error) {
      console.error('Move error:', error);
    } finally {
      setIsMoveLoading(false);
    }
  };

  const fileActions = (row: FileData) => {
    const actions = row.allowed_actions || {};

    return (
      <>
        {/* Submit for Approval button - only show if publish is allowed */}
        {actions.publish && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handlePublishBtn(row)}
                  className='rounded-lg h-6 w-6 p-4'
                >
                  <FileUpload fontSize='small' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Submit for Approval</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Preview button - only show if preview is allowed and it's a file */}
        {actions.preview && row.isFile && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handlePreviewModal(row)}
                  className='rounded-lg h-6 w-6 p-4'
                >
                  <PreviewIcon sx={{ fontSize: '15px' }} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Preview</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Dropdown menu - always show, items are enabled/disabled based on permissions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='rounded-lg h-4 w-4 p-4 focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:ring-offset-0'
            >
              <MoreVertical className='h-4 w-4' style={{ fontSize: '20px' }} />
              <span className='sr-only'>Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-48 p-1' align='end'>
            {/* Details */}
            <DropdownMenuItem
              className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              onClick={() => actions.view && handleViewModal(row)}
              disabled={!actions.view}
            >
              <DetailsIcon
                className='text-black dark:text-white mr-2 h-4 w-4'
                style={{ fontSize: '16px' }}
              />
              <span className='text-black dark:text-white'>Details</span>
            </DropdownMenuItem>

            {/* Download */}
            <DropdownMenuItem
              className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              onClick={() =>
                actions.download && handleDownload([row.id], row.name)
              }
              disabled={!actions.download}
            >
              <DownloadIcon
                className='text-black dark:text-white mr-2 h-4 w-4'
                style={{ fontSize: '16px' }}
              />
              <span className='text-black dark:text-white'>Download</span>
            </DropdownMenuItem>

            {/* Version History - only show for files */}
            {!row.isFolder && (
              <DropdownMenuItem
                className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                onClick={() => actions.versions && handleVersionHistory(row)}
                disabled={!actions.versions}
              >
                <History
                  className='text-black dark:text-white mr-2 h-4 w-4'
                  style={{ fontSize: '16px' }}
                />
                <span className='text-black dark:text-white'>
                  Version History
                </span>
              </DropdownMenuItem>
            )}

            {/* Rename */}
            <DropdownMenuItem
              className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              onClick={() => actions.rename && handleRenameModal(row)}
              disabled={!actions.rename}
            >
              <EditIcon
                className='text-black dark:text-white mr-2 h-4 w-4'
                style={{ fontSize: '16px' }}
              />
              <span className='text-black dark:text-white'>Rename</span>
            </DropdownMenuItem>

            {/* Move */}
            <DropdownMenuItem
              className='text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
              onClick={() => actions.move && handleMoveModal([row])}
              disabled={!actions.move}
            >
              <MoveIcon
                className='text-black dark:text-white mr-2 h-4 w-4'
                style={{ fontSize: '16px' }}
              />
              <span className='text-black dark:text-white'>Move</span>
            </DropdownMenuItem>

            {/* Delete */}
            <DropdownMenuItem
              onClick={() => actions.delete && handleDeleteModal(row)}
              disabled={!actions.delete}
              className={`text-sm leading-5 flex items-center cursor-pointer select-none rounded-sm px-2 py-1.5 outline-none transition-colors focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
                actions.delete ? 'text-[#D75C5C]' : ''
              }`}
            >
              <DeleteIcon
                className='mr-2 h-4 w-4'
                style={{ fontSize: '16px' }}
              />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };

  return (
    <div className='h-[calc(100vh-105px)] flex flex-col'>
      <div className='px-4 sticky top-0 left-0 right-0 z-30'>
        <FileManagementHeader
          handleFileUpload={handleFileUpload}
          handleCreateNewFolder={handleNewFolder}
          selectedPath={selectedPath}
          treeViewActivePath={treeViewActivePath}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          availableColumns={[
            { id: 'status', label: 'Status' },
            { id: 'modified', label: 'Modified' },
          ]}
          selectedRowsCount={selectedRows.length}
          selectedRows={selectedRows}
          onBulkPublish={handlePublish}
          onBulkDelete={(ids: string[]) => handleDelete(ids)}
          onBulkDownload={(ids: string[]) => {
            // If only 1 file selected, pass the filename for proper single file download
            if (ids.length === 1) {
              const selectedFile = selectedRows.find(
                (row) => row.id === ids[0]
              );
              handleDownload(ids, selectedFile?.name);
            } else {
              handleDownload(ids);
            }
          }}
          onBulkMove={() => handleMoveModal(selectedRows)}
          uploadProgress={uploadProgress}
          rootAllowedActions={rootAllowedActions}
        />
        {viewMode === 'flat' ? renderPath(false) : renderPath(true)}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
            title={toast.title}
          />
        )}
      </div>
      <div className='flex-1 overflow-auto no-scrollbar px-4 pb-4'>
        <DataTable
          columns={filemanagementcolumns}
          data={displayData}
          tableHeadVariant='alternate'
          tableCellVariant='alternate'
          getActions={fileActions}
          enableRowSelection={true}
          onRowSelectionChange={setSelectedRows}
          getRowId={(row) => row.id}
          badgeColumns={['approvalStatus', 'operation']}
          handleColumnClick={handleColumnClick}
          sorting={sorting}
          setSorting={setSorting}
          isDataLoading={isDataLoading}
          isTreeView={viewMode === 'tree'}
          onToggleFolder={toggleFolderExpansion}
          loadingFolders={loadingFolders}
          activeFolderId={treeViewActivePathId || undefined}
          activeFolderPath={
            treeViewActivePath.length > 0
              ? '/' + treeViewActivePath.join('/')
              : undefined
          }
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
        />
      </div>

      {/* rename modal */}
      <Modal isOpen={isRename} onClose={closeRenameModal} title='Rename'>
        <div>
          <div className='mb-2'>
            <Label className='font-light text-base leading-6 tracking-[0.5%] text-[#000000D9] dark:text-[#FFFFFFD9]'>
              Are you sure to rename &quot;<strong>{oldName}</strong>&quot; ?
            </Label>
          </div>
          <div className='flex items-center'>
            <Input
              type='text'
              placeholder='Type here...'
              className='flex-grow h-[3rem] dark:text-white dark:border-[#FFFFFF26] mb-4'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            {fileExtension && (
              <span className='ml-2 text-[#000000D9] dark:text-[#FFFFFFD9] font-light text-base leading-6 tracking-[0.5%] self-center'>
                {fileExtension}
              </span>
            )}
          </div>
        </div>
        {/* Modal Footer  */}
        <div className='pt-2 flex justify-end'>
          <div className='flex justify-end space-x-4'>
            <Button
              className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D]'
              variant='secondary'
              onClick={closeRenameModal}
            >
              <CloseRoundedIcon fontSize='small' className='w-5 h-5' />
              Cancel
            </Button>
            <Button
              type='submit'
              className='px-4 py-2 text-white rounded-lg admin-btn'
              onClick={handleRename}
              disabled={!newName}
            >
              <CheckRoundedIcon fontSize='small' className='w-5 h-5' />
              Rename
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Details modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        title={`View ${
          selectedRow?.isFolder ? 'Folder Details' : 'File Details'
        }`}
      >
        {/* modal body */}
        <div className='space-y-4'>
          {/* <h2 className="font-medium text-base leading-6 tracking-[0.5%] text-[#000000]">
            {selectedRow?.isFolder ? "Folder Details" : "File Details"}
          </h2> */}

          <Table className='overflow-y-scroll h-[30vh] '>
            <TableBody className='border border-solid border-[#FFFFFF26]'>
              <TableRow>
                <TableCell className='font-medium'>Name</TableCell>
                <TableCell>{selectedRow?.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Created...</TableCell>
                <TableCell>{selectedRow?.created}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Created By</TableCell>
                <TableCell>{selectedRow?.createdBy}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Size</TableCell>
                <TableCell>{selectedRow?.size}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Path</TableCell>
                <TableCell>{selectedRow?.path}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className='font-medium'>Comments</TableCell>
                <TableCell>{selectedRow?.comments}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {/* Modal Footer  */}
        <div className='pt-[1.5rem] border-t border-t-[#0000000D] flex justify-end'>
          <div className='flex justify-end space-x-4'>
            <Button
              className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D]'
              variant='secondary'
              onClick={closeViewModal}
            >
              <CloseRoundedIcon
                style={{ fontSize: '20px' }}
                className='w-5 h-5'
                onClick={closeViewModal}
              />
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Submit for Approval Modal Component */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={closePublishModal}
        title='Submit for Approval'
      >
        {/* TextArea Component */}
        <TextArea
          label='Comments'
          value={comments}
          onChange={handleCommentsChange}
          placeholder='Enter your comments here...'
          id='comments'
        />
        {/* Modal Footer  */}
        <div className='flex justify-end'>
          <div className='flex justify-end space-x-4'>
            <Button
              className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D]'
              variant='secondary'
              onClick={closePublishModal}
            >
              <CloseRoundedIcon className='w-5 h-5' sx={{ fontSize: 20 }} />
              Cancel
            </Button>
            <Button
              type='submit'
              className='px-4 py-2 text-white rounded-lg admin-btn'
              onClick={() => handlePublish()}
              disabled={!comments}
            >
              <CheckRoundedIcon className='w-5 h-5' sx={{ fontSize: 20 }} />
              Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Version History Modal Component */}
      <Modal
        isOpen={isVersionHistoryModalOpen}
        onClose={closeVersionHistoryModal}
        title='Version History'
        width='w-[50vw] h-[50vh]'
      >
        <DataTable
          columns={versionhistorycolumns}
          data={versionHistoryData}
          tableHeadVariant='alternate'
          tableCellVariant='alternate'
          isDataLoading={isVersionHistoryDataLoading}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDelete} onClose={closeDeleteModal} title='Delete'>
        <div>
          <div className='mb-2'>
            <Label className='font-light text-base leading-6 tracking-[0.5%] text-[#000000D9] dark:text-[#FFFFFFD9]'>
              Are you sure you want to delete &quot;<strong>{oldName}</strong>
              &quot; ?
            </Label>
          </div>
        </div>
        {/* Modal Footer */}
        <div className='pt-[1rem] flex justify-end'>
          <div className='flex justify-end space-x-4'>
            <Button
              className='card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D]'
              variant='secondary'
              onClick={closeDeleteModal}
            >
              <CloseRoundedIcon fontSize='small' className='w-5 h-5' />
              Cancel
            </Button>
            <Button
              type='submit'
              className='px-4 py-2 text-white rounded-lg bg-[#D75C5C] hover:bg-[#D75C5C]/90'
              onClick={() => handleDelete()}
            >
              <DeleteIcon fontSize='small' className='w-5 h-5' />
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move Modal */}
      <MoveModal
        isOpen={isMoveModalOpen}
        onClose={closeMoveModal}
        onConfirm={handleMove}
        itemsToMove={itemsToMove}
        isLoading={isMoveLoading}
      />

      {/* File Preview Sheet */}
      <FilePreview
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={closePreview}
      />
    </div>
  );
};

export default FileManagement;
