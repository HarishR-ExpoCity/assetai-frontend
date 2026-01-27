'use client';

import { ColumnDef } from '@tanstack/react-table';

export type Projects = {
  ID: string;
  'Project Name': string;
  'Total Files': number;
  'Total READY': number;
  'Total PENDING': number;
  'Total IN_PROGRESS': number;
  'Total ERROR': number;
  'Total SKIP': number;
};

export const columns: ColumnDef<Projects>[] = [
  {
    accessorKey: 'Project Name',
    header: 'Project Name',
    size: 700,
  },
  {
    accessorKey: 'Total Files',
    header: 'Total Files',
  },
  {
    accessorKey: 'Total APPROVED',
    header: 'Approved',
    cell: ({ row }) => {
      const value = row.getValue('Total APPROVED') as number;
      return (
        <span style={{ color: '#009966' }}>{value?.toLocaleString()}</span>
      );
    },
  },
  {
    accessorKey: 'Total PENDING',
    header: 'Pending',
    cell: ({ row }) => {
      const value = row.getValue('Total PENDING') as number;
      return (
        <span style={{ color: '#E17100' }}>{value?.toLocaleString()}</span>
      );
    },
  },
  {
    accessorKey: 'Total REJECTED',
    header: 'Rejected',
    cell: ({ row }) => {
      const value = row.getValue('Total REJECTED') as number;
      return (
        <span style={{ color: '#E7000B' }}>{value?.toLocaleString()}</span>
      );
    },
  },
  {
    accessorKey: 'Total DRAFT',
    header: 'Draft',
    cell: ({ row }) => {
      const value = row.getValue('Total DRAFT') as number;
      return (
        <span style={{ color: '#155DFC' }}>{value?.toLocaleString()}</span>
      );
    },
  },
];
