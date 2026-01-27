'use client';

import { ColumnDef } from '@tanstack/react-table';

export interface FileData {
  approvalStatus: string;
  operation: string;
  comments: string;
  childCount: number;
  created: string;
  createdBy: string;
  id: string;
  isFile: boolean;
  isFolder: boolean;
  modified: string;
  modifiedBy: string;
  name: string;
  parentReference: {
    driveId: string;
    driveType: string;
    id: string;
    name: string;
    path: string;
    siteId: string;
  };
  size: any;
  webUrl: string;
  path: string;
  allowed_actions: {
    rename: boolean;
    delete: boolean;
    newfolder: boolean;
    upload: boolean;
    publish: boolean;
    reject: boolean;
    view: boolean;
    preview: boolean;
    download: boolean;
    versions: boolean;
    children: boolean;
    move: boolean;
  };
}

export const filemanagementcolumns: ColumnDef<FileData>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    id: 'name', // should match the accessorKey to get badge style
    size: 800,
  },
  {
    id: 'status',
    header: 'Status',
    size: 200,
  },
  {
    accessorKey: 'modified',
    header: 'Modified',
    id: 'modified',
    size: 250,
    cell: ({ row }) => {
      const modifiedAt = row.original.modified;
      const modifiedBy = row.original.modifiedBy;

      return (
        <div className='flex flex-col'>
          <span>{modifiedAt}</span>
          {modifiedBy && <span>by {modifiedBy}</span>}
        </div>
      );
    },
  },
  // {
  //   accessorKey: "created",
  //   header: "Created At",
  //   id: "created",
  // },
  // {
  //   accessorKey: "createdBy",
  //   header: "Created By",
  //   id: "createdBy",
  // },
];
