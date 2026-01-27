'use client';

import { ColumnDef } from '@tanstack/react-table';

export type versionHistory = {
  id: string;
  lastModifiedDateTime: string;
  lastModifiedBy: LastModifiedBy;
  size: number;
  comment: string;
  approvalStatus: string;
};

export interface LastModifiedBy {
  user: User;
}

export interface User {
  displayName: string;
  email: string;
}

export const versionhistorycolumns: ColumnDef<versionHistory>[] = [
  {
    accessorKey: 'id',
    header: 'No.',
    id: 'id', // should match the accessorKey to get badge style
    size: 50,
  },
  {
    accessorKey: 'lastModifiedDateTime',
    header: 'Modified',
    id: 'lastModifiedDateTime',
    size: 250,
    cell: ({ row }) => {
      const modifiedAt = row.original.lastModifiedDateTime;
      const modifiedBy = row.original.lastModifiedBy?.user?.displayName;

      return (
        <div className='flex flex-col'>
          <span>{modifiedAt}</span>
          {modifiedBy && <span>by {modifiedBy}</span>}
        </div>
      );
    },
  },
  {
    accessorKey: 'size',
    header: 'Size',
    id: 'size',
  },
];
