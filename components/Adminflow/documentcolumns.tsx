"use client";

import { ColumnDef } from "@tanstack/react-table";

export type Documents = {
  id: number;
  pathid: string;
  path: string;
  file_name: string;
  file_full_path: string;
  file_type: string;
  project_name: string;
  size: number;
  file_status: string;
  file_source: string;
  vector_status: string;
  vector_error: string;
  created_at: string;
  updated_at: string;
};

export const documentcolumns: ColumnDef<Documents>[] = [
  // {
  //   accessorKey: "project_name",
  //   header: "Project Name",
  //   id: "project_name",
  //   size: 150,
  // },
  // {
  //   accessorKey: "file_name",
  //   header: "File Name",
  //   id: "file_name",
  //   size: 150,
  // },
  {
    accessorKey: "file_full_path",
    header: "File Path",
    id: "file_full_path",
    size: 850,
  },
  {
    accessorKey: "size",
    header: "Size",
    id: "size",
    size: 80,
  },
  {
    accessorKey: "file_status",
    header: "Sharepoint",
    id: "file_status",
    size: 50,
  },
  {
    accessorKey: "vector_status",
    header: "Vector",
    id: "vector_status",
    size: 100,
  },
];
