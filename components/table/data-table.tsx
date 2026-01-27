'use client';
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  memo,
} from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
  getSortedRowModel,
  OnChangeFn,
  getPaginationRowModel,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MaterialIcon } from '@/components/ui/MaterialIcon';
import { Pagination } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
// import Tooltip from "@/components/ui/tooltip";
import Image from 'next/image';
import { addBasePath } from 'next/dist/client/add-base-path';

// Utility function to get file type icon based on file extension
const getFileTypeIcon = (
  fileName: string
): { src?: string; alt: string; useDefault: boolean } => {
  if (!fileName || typeof fileName !== 'string') {
    return { useDefault: true, alt: 'file' };
  }

  // Handle files with no extension
  const parts = fileName.toLowerCase().split('.');
  if (parts.length < 2) {
    return { useDefault: true, alt: 'file' };
  }

  const extension = parts.pop();

  const fileTypeMap: Record<string, { src: string; alt: string }> = {
    // Primary file types with specific icons
    pdf: { src: addBasePath('/icons/pdf.svg'), alt: 'PDF file' },
    dwg: { src: addBasePath('/icons/dwg.svg'), alt: 'DWG file' },
    mht: { src: addBasePath('/icons/mht.svg'), alt: 'MHT file' },
    mhtml: { src: addBasePath('/icons/mht.svg'), alt: 'MHTML file' },

    // Excel files
    xls: { src: addBasePath('/icons/xls.svg'), alt: 'Excel file' },
    xlsx: { src: addBasePath('/icons/xls.svg'), alt: 'Excel file' },
    xlsm: { src: addBasePath('/icons/xls.svg'), alt: 'Excel file' },
    xlsb: { src: addBasePath('/icons/xls.svg'), alt: 'Excel file' },
    csv: { src: addBasePath('/icons/xls.svg'), alt: 'CSV file' },

    // Microsoft Office files
    doc: { src: addBasePath('/icons/docx.svg'), alt: 'Word document' },
    docx: { src: addBasePath('/icons/docx.svg'), alt: 'Word document' },
    docm: { src: addBasePath('/icons/docx.svg'), alt: 'Word document' },
    // PowerPoint files will use DescriptionIcon since no specific pptx.svg exists

    // Note: All other file types will use the DescriptionIcon
    // This includes txt, rtf, xml, json, and any unknown extensions
  };

  const iconInfo = fileTypeMap[extension || ''];
  if (iconInfo) {
    return { src: iconInfo.src, alt: iconInfo.alt, useDefault: false };
  }

  // For unknown file types, use DescriptionIcon
  return {
    useDefault: true,
    alt: `${extension?.toUpperCase() || 'Unknown'} file`,
  };
};

// Memoized Table Row Component for better performance
const MemoizedTableRow = memo(
  ({ row, children }: any) => {
    return (
      <TableRow data-state={row.getIsSelected() && 'selected'}>
        {children}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if selection state or data changes
    return (
      prevProps.row.getIsSelected() === nextProps.row.getIsSelected() &&
      prevProps.row.original === nextProps.row.original
    );
  }
);
MemoizedTableRow.displayName = 'MemoizedTableRow';

// Component for rendering file type icons
const FileTypeIcon: React.FC<{ fileName: string }> = ({ fileName }) => {
  const [hasError, setHasError] = useState(false);
  const fileIcon = getFileTypeIcon(fileName);

  // Use DescriptionIcon for unknown file types or when custom icon fails
  if (fileIcon.useDefault || hasError) {
    return (
      <MaterialIcon
        icon='description'
        size={20}
        className='mr-2 flex-shrink-0'
        style={{ color: '#7975FF' }}
        aria-hidden='true'
      />
    );
  }

  // Use custom SVG icons for known file types
  return (
    <Image
      src={fileIcon.src!}
      alt={fileIcon.alt}
      width={20}
      height={20}
      className='mr-2 flex-shrink-0'
      aria-hidden='true'
      onError={() => {
        // If custom icon fails to load, fallback to DescriptionIcon
        setHasError(true);
      }}
    />
  );
};

// Function to render badge based on any value
const renderBadge = (value: string, columnId: string) => {
  if (typeof value === 'boolean') {
    if (columnId === 'is_admin') {
      return (
        <Badge
          className={`dark:text-[#FFFFFFD9] ${
            value ? 'bg-[#A866E680]' : 'bg-[#1F85FF80]'
          } text-[#000000D9]`}
        >
          {value ? 'Admin' : 'User'}
        </Badge>
      );
    }
  }
  switch (value.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'ready':
      return (
        <Badge className='approved-badge'>
          {value === 'Approved' && (
            <MaterialIcon icon='check' className='mr-1' size={16} />
          )}
          {value}
        </Badge>
      );
    case 'deleted':
    case 'error':
    case 'rejected':
      return (
        <Badge className='badge-red'>
          <MaterialIcon icon='close' className='mr-1' size={16} />
          {value}
        </Badge>
      );
    case 'pending':
      return (
        <Badge className='badge-pending'>
          <MaterialIcon icon='more_horiz' className='mr-1' size={16} />
          {value}
        </Badge>
      );
    case 'draft':
      return (
        <Badge className='badge-blue'>
          <MaterialIcon icon='edit' className='mr-1' size={16} />
          {value}
        </Badge>
      );
    case 'modified':
      return <Badge className='badge-violet'>{value}</Badge>;
    case 'in_progress':
      return (
        <Badge className='dark:text-[#FFFFFFD9] bg-[#A866E680] text-[#000000D9]'>
          {value}
        </Badge>
      );
    case 'new':
      return (
        <Badge className='dark:text-[#FFFFFFD9] bg-[#02C9D880] text-[#000000D9]'>
          {value}
        </Badge>
      );
    case 'delete':
      return <Badge className='badge-red'>{value}</Badge>;
    case 'add':
      return <Badge className='badge-violet'>{value}</Badge>;
    case 'publish':
      return <Badge className='badge-blue'>{value}</Badge>;
    case 'update':
      return (
        <Badge className='dark:text-[#FFFFFFD9] bg-[#02C9D880] text-[#000000D9]'>
          {value}
        </Badge>
      );
    case 'rename':
      return (
        <Badge className='dark:text-[#FFFFFFD9] dark:bg-[#FFFFFF40] bg-[#0000000D] text-[#000000D9]'>
          {value}
        </Badge>
      );
    default:
      return (
        <Badge className='dark:text-[#FFFFFFD9] bg-[#A866E680] text-[#000000D9]'>
          {value}
        </Badge>
      );
  }
};

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]; // Correct usage of TData here
  data: TData[]; // Ensure TData is being used in the data
  tableHeadVariant?: 'default' | 'alternate';
  tableCellVariant?: 'default' | 'alternate';
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  getRowId?: (row: TData) => string; // getRowId now uses TData
  getActions?: (row: TData) => React.ReactNode; // Dynamic actions
  badgeColumns?: string[]; // List of column keys that should render badges
  handleColumnClick?: (id: any, row: any) => void;
  resetSelection?: boolean;
  enablePagination?: boolean;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
  currentPage?: number;
  enableColumnFilters?: boolean; // New prop to control column filtering
  filterableColumns?: string[]; // New prop to specify which columns should have filters
  onSearch?: (columnId: string, searchTerm: string) => Promise<void>;
  sorting?: Array<{ id: string; desc: boolean }>;
  setSorting?: React.Dispatch<
    React.SetStateAction<Array<{ id: string; desc: boolean }>>
  >;
  isDataLoading: boolean;
  isTreeView?: boolean; // New prop for tree view mode
  onToggleFolder?: (folderId: string, folderPath: string) => void; // New prop for folder expansion
  loadingFolders?: Set<string>; // New prop for tracking loading folders
  activeFolderId?: string; // Active folder ID in tree view for highlighting parent row
  activeFolderPath?: string; // Active folder path in tree view for highlighting child rows
  columnVisibility?: VisibilityState; // Column visibility state from parent
  onColumnVisibilityChange?: (visibility: VisibilityState) => void; // Callback for visibility changes
}

export function DataTable<TData, TValue>({
  columns,
  data,
  tableHeadVariant,
  tableCellVariant,
  enableRowSelection = false,
  onRowSelectionChange,
  getRowId,
  getActions,
  badgeColumns = [],
  handleColumnClick,
  resetSelection,
  enablePagination = false,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSize,
  currentPage,
  enableColumnFilters = false, // Default to false
  filterableColumns = [], // Default to empty array
  onSearch,
  sorting,
  setSorting,
  isDataLoading,
  isTreeView = false,
  onToggleFolder,
  loadingFolders,
  activeFolderId,
  activeFolderPath,
  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});

  // Use controlled visibility if provided, otherwise use internal state
  const columnVisibility =
    controlledColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility =
    onColumnVisibilityChange ?? setInternalColumnVisibility;

  // Optimize row selection with batch updates
  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = useCallback(
    (updaterOrValue) => {
      // Use React 18's automatic batching or manual batching for older versions
      setRowSelection((old) => {
        const newState =
          typeof updaterOrValue === 'function'
            ? updaterOrValue(old)
            : updaterOrValue;
        return newState;
      });
    },
    []
  );

  useEffect(() => {
    setRowSelection({});
  }, [resetSelection]);

  // Reset selection when data changes (e.g., navigating to a different folder)
  useEffect(() => {
    setRowSelection({});
  }, [data]);

  const convertFromBytes = (
    bytes: number | string | null | undefined
  ): string => {
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

  const handleSearchKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>, columnId: string) => {
      if (event.key === 'Enter') {
        const value = (event.target as HTMLInputElement).value;
        onSearch?.(columnId, value);
      }
    },
    [onSearch]
  );

  // Memoize columns to prevent recreation on every render
  const tableColumns = useMemo(() => {
    const baseColumns = enableRowSelection
      ? [
          {
            id: 'select',
            header: ({ table }: any) => (
              <div className='flex items-center justify-center w-full'>
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(checked) =>
                    table.toggleAllPageRowsSelected(!!checked)
                  }
                  aria-label='Select all'
                />
              </div>
            ),
            cell: ({ row }: any) => (
              <div className='flex items-center justify-center w-full'>
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(checked) => row.toggleSelected(!!checked)}
                  aria-label='Select row'
                />
              </div>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 30,
          },
        ]
      : [];

    const dynamicColumns = getActions
      ? [
          {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: any) => {
              // Don't show actions for loading placeholders
              if (row.original.isLoadingPlaceholder) {
                return null;
              }
              return (
                <div className='flex items-center justify-center gap-2 w-full'>
                  {getActions(row.original)}
                </div>
              );
            },
            size: 120,
          },
        ]
      : [];

    const processedColumns = columns.map((column) => {
      // Check if the column's id is in the badgeColumns list
      const isBadgeColumn = badgeColumns.includes(column.id as string);
      const isFilterable =
        enableColumnFilters && filterableColumns.includes(column.id as string);
      // Handle click for "name" column specifically
      if (column.id === 'name') {
        return {
          ...column,
          cell: ({ row }: any) => {
            const value = row.getValue(column.id as string) as string;
            const isFile = row.original.isFile;
            const isFolder = row.original.isFolder;
            const depth = row.original.depth || 0;
            const hasChildren = row.original.hasChildren;
            const isExpanded = row.original.expanded;
            const allowedActions = row.original.allowed_actions || {};
            const canAccessChildren =
              isFolder && allowedActions.children === true;
            const isLoading =
              row.original.isLoading ||
              (loadingFolders && loadingFolders.has(row.original.id));
            const isLoadingPlaceholder = row.original.isLoadingPlaceholder;

            // Special rendering for loading placeholder
            if (isLoadingPlaceholder) {
              return (
                <div
                  className='flex items-center dark:text-gray-500 text-gray-400 text-xs italic'
                  style={{
                    paddingLeft: isTreeView ? `${depth * 24}px` : '0',
                  }}
                >
                  <Spinner size='sm' className='mr-2 h-3 w-3' />
                  Loading...
                </div>
              );
            }

            return (
              <div
                className='flex items-center dark:text-white text-xs font-semibold tracking-[0.005em] text-[#222222]'
                style={{ paddingLeft: isTreeView ? `${depth * 24}px` : '0' }}
              >
                {/* Expand/Collapse button for folders in tree view */}
                {isTreeView && !isFile && hasChildren ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Only allow toggle if folder has children permission
                      if (onToggleFolder && !isLoading && canAccessChildren) {
                        onToggleFolder(row.original.id, row.original.path);
                      }
                    }}
                    className={`mr-1 rounded transition-colors flex items-center justify-center h-7 w-7 ${
                      !isLoading && canAccessChildren
                        ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                        : !canAccessChildren
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                    }`}
                    aria-label={
                      !canAccessChildren
                        ? 'Access denied'
                        : isLoading
                        ? 'Loading...'
                        : isExpanded
                        ? 'Collapse folder'
                        : 'Expand folder'
                    }
                    disabled={isLoading || !canAccessChildren}
                  >
                    {isLoading ? (
                      <div className='flex items-center justify-center h-5 w-5'>
                        <Spinner size='sm' />
                      </div>
                    ) : isExpanded ? (
                      <MaterialIcon
                        icon='expand_more'
                        size={20}
                        className='dark:text-white text-gray-600'
                      />
                    ) : (
                      <MaterialIcon
                        icon='chevron_right'
                        size={20}
                        className='dark:text-white text-gray-600'
                      />
                    )}
                  </button>
                ) : isTreeView ? (
                  <div className='w-7 mr-1' />
                ) : null}

                {/* File/Folder content */}
                <div
                  onClick={() =>
                    handleColumnClick && handleColumnClick(column.id, row)
                  }
                  className={`flex items-center flex-1 ${
                    isFolder && !canAccessChildren
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  }`}
                >
                  {isFile ? (
                    <FileTypeIcon fileName={value} />
                  ) : isExpanded && isTreeView ? (
                    <MaterialIcon
                      icon='folder_open'
                      size={20}
                      style={{
                        color: canAccessChildren ? '#0047FF' : '#808080',
                        opacity: isLoading ? 0.5 : canAccessChildren ? 1 : 0.6,
                      }}
                      className='dark:text-white mr-2 flex-shrink-0 transition-opacity duration-200'
                      aria-hidden='true'
                      title={!canAccessChildren ? 'Access denied' : undefined}
                    />
                  ) : (
                    <MaterialIcon
                      icon='folder'
                      size={20}
                      style={{
                        color: canAccessChildren ? '#0863FF' : '#808080',
                        opacity: isLoading ? 0.5 : canAccessChildren ? 1 : 0.6,
                      }}
                      className='dark:text-white mr-2 flex-shrink-0 transition-opacity duration-200'
                      aria-hidden='true'
                      title={!canAccessChildren ? 'Access denied' : undefined}
                    />
                  )}
                  <span className={isLoading ? 'opacity-50' : ''}>{value}</span>
                </div>
              </div>
            );
          },
        };
      }
      // if (column.id === "file_name") {
      //   return {
      //     ...column,
      //     cell: ({ row }: any) => {
      //       const value = row.getValue(column.id as string) as string;
      //       return (
      //         <Tooltip content={row.original.file_full_path}>
      //           <span className="whitespace-pre-wrap">{value}</span>
      //         </Tooltip>
      //       );
      //     },
      //   };
      // }
      if (column.id === 'file_full_path') {
        return {
          ...column,
          cell: ({ row }: any) => {
            const value = row.getValue(column.id as string) as string;
            const url = `https://expocitydubai.sharepoint.com/sites/AssetInformationLibrary/${value}`;
            return (
              <a
                href={url}
                target='_blank' // Open the link in a new tab
                rel='noopener noreferrer' // Security best practice for opening links
                className='text-blue-500 underline'
              >
                {value}
              </a>
            );
          },
        };
      }
      if (isBadgeColumn) {
        return {
          ...column,
          cell: ({ row }: any) => {
            const value = row.getValue(column.id);
            return renderBadge(value, column.id as string); // Render badge for dynamic columns
          },
        };
      }
      if (column.id === 'size') {
        return {
          ...column,
          cell: ({ row }: any) => {
            const value = row.getValue(column.id);
            if (typeof value === 'string' && value.includes(' ')) {
              return <div>{value}</div>;
            }
            return <div>{convertFromBytes(value)}</div>;
          },
        };
      }
      // Handle combined status column (operation + approvalStatus)
      if (column.id === 'status') {
        return {
          ...column,
          cell: ({ row }: any) => {
            const operation = row.original.operation;
            const approvalStatus = row.original.approvalStatus;
            return (
              <div className='flex items-center gap-2'>
                {operation && renderBadge(operation, 'operation')}
                {approvalStatus &&
                  renderBadge(approvalStatus, 'approvalStatus')}
              </div>
            );
          },
        };
      }
      const baseColumn = {
        ...column,
        enableSorting: true,
        enableColumnFilter: isFilterable,
      };
      // Add size property to set column width
      if (column.size) {
        baseColumn.size = column.size;
      }
      // If no badge rendering is needed, just return the column as is
      return baseColumn;
    });

    // Insert actions column after name column instead of at end
    const allColumns: any[] = [...processedColumns];
    const nameIndex = allColumns.findIndex(
      (col: any) => col.id === 'name' || col.accessorKey === 'name'
    );
    if (nameIndex !== -1 && dynamicColumns.length > 0) {
      allColumns.splice(nameIndex + 1, 0, ...dynamicColumns);
    } else if (dynamicColumns.length > 0) {
      allColumns.push(...dynamicColumns);
    }

    return [...baseColumns, ...allColumns];
  }, [
    columns,
    enableRowSelection,
    getActions,
    badgeColumns,
    handleColumnClick,
    enableColumnFilters,
    filterableColumns,
    isTreeView,
    onToggleFolder,
    loadingFolders,
  ]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: setSorting
      ? (newSorting) => setSorting(newSorting)
      : undefined,
    onColumnFiltersChange: setColumnFilters,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
    },
    onColumnVisibilityChange: setColumnVisibility as any,
    enableSorting: true,
    enableMultiSort: false,
    enableColumnFilters,
    manualPagination: true,
    // Performance optimizations
    enableRowSelection: true,
    getRowCanExpand: undefined, // Disable if not needed
    autoResetAll: false, // Prevent automatic resets on data changes
    pageCount:
      enablePagination && totalItems && pageSize
        ? Math.ceil(totalItems / pageSize)
        : undefined,
    getRowId:
      getRowId ||
      ((row: any) => {
        // Try to get a unique identifier from the row data
        const id =
          row.original?.id || row.original?.file_id || row.original?.chat_id;
        // If no unique identifier is found, generate a unique key
        return id
          ? id.toString()
          : `row-${Math.random().toString(36).substr(2, 9)}`;
      }),
  });
  const prevSelectedRows = useRef<TData[]>([]);
  useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);

      // Compare the new selection with the previous one
      if (
        JSON.stringify(selectedRows) !==
        JSON.stringify(prevSelectedRows.current)
      ) {
        onRowSelectionChange(selectedRows);
        prevSelectedRows.current = selectedRows;
      }
    }
  }, [rowSelection, onRowSelectionChange, table]);

  return (
    <div
      className='contact-table dark:border-[#FFFFFF26] overflow-y-auto overflow-x-hidden'
      style={{ scrollbarWidth: 'thin', maxHeight: 'calc(100vh - 200px)' }}
    >
      <Table style={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHeader sticky>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    variant={tableHeadVariant}
                    style={{
                      width: header.column.columnDef.size
                        ? `${header.column.columnDef.size}px`
                        : 'auto',
                      minWidth: header.column.columnDef.size
                        ? `${header.column.columnDef.size}px`
                        : '100px',
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className='space-y-2'>
                        <div
                          className={`flex items-center gap-2 mt-2 mb-2 ${
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none'
                              : ''
                          }`}
                          onClick={() => {
                            const isSortedDesc =
                              header.column.getIsSorted() === 'desc';
                            const newSorting = [
                              {
                                id: header.id,
                                desc: !isSortedDesc,
                              },
                            ];
                            if (setSorting) setSorting(newSorting);
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <MaterialIcon
                              icon='swap_vert'
                              size={16}
                              className={`ml-auto ${
                                header.column.getIsSorted() === 'asc'
                                  ? 'rotate-180'
                                  : ''
                              }`}
                            />
                          )}
                        </div>
                        {enableColumnFilters &&
                          filterableColumns.includes(header.id) && (
                            <div>
                              <Input
                                placeholder={`Search`}
                                value={
                                  (header.column.getFilterValue() as string) ??
                                  ''
                                }
                                onChange={(e) =>
                                  header.column.setFilterValue(e.target.value)
                                }
                                onKeyDown={(e) =>
                                  handleSearchKeyPress(e, header.id)
                                }
                                className='mb-4 text-xs'
                              />
                            </div>
                          )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isDataLoading ? (
            <TableRow>
              <TableCell
                colSpan={tableColumns.length}
                className='h-24 text-center'
                variant={tableCellVariant}
              >
                <div className='flex items-center justify-center'>
                  <Spinner size='md' color='primary' className='mr-2' />
                  <span>Loading data...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              // Determine if this row is the active parent folder or a child of it
              const rowData = row.original as any;

              // Check if this is the active parent folder
              const isActiveParentFolder =
                isTreeView &&
                activeFolderId &&
                rowData.id === activeFolderId &&
                !rowData.isFile &&
                !rowData.isLoadingPlaceholder;

              // Check if this is a child of the active folder
              const isChildOfActiveFolder =
                isTreeView &&
                activeFolderPath &&
                rowData.parentPath === activeFolderPath &&
                !rowData.isLoadingPlaceholder;

              // Determine row highlight style
              const getRowHighlightClass = () => {
                if (isActiveParentFolder)
                  return 'bg-[#D6EBFF] dark:bg-[#D6EBFF40]';
                if (isChildOfActiveFolder)
                  return 'bg-[#EDF7FF] dark:bg-[#EDF7FF26]';
                return undefined;
              };

              return (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={getRowHighlightClass()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      variant={tableCellVariant}
                      align={
                        cell.column.id === 'file_status' ||
                        cell.column.id === 'vector_status'
                          ? 'center'
                          : 'left'
                      }
                      style={{
                        width: cell.column.columnDef.size
                          ? `${cell.column.columnDef.size}px`
                          : 'auto',
                        minWidth: cell.column.columnDef.size
                          ? `${cell.column.columnDef.size}px`
                          : '100px',
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell
                colSpan={tableColumns.length}
                className='h-24 text-center'
                variant={tableCellVariant}
              >
                No results found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {enablePagination &&
        totalItems !== undefined &&
        pageSize !== undefined &&
        currentPage !== undefined &&
        onPageChange &&
        onPageSizeChange && (
          <Pagination
            currentPage={currentPage + 1}
            totalPages={table.getPageCount()}
            pageSize={pageSize}
            totalItems={totalItems}
            // onPageChange={(page) => table.setPageIndex(page - 1)}
            onPageChange={(page) => onPageChange(page - 1)}
            onPageSizeChange={(newPageSize) => onPageSizeChange(newPageSize)}
          />
        )}
    </div>
  );
}
