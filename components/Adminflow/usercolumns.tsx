"use client";

import { ColumnDef } from "@tanstack/react-table";

export type User = {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
};

export const usercolumns: ColumnDef<User>[] = [
  {
    accessorKey: "username",
    id: "username",
    header: "Username",
  },
  {
    accessorKey: "email",
    header: "Email",
    id: "email",
  },
  {
    accessorKey: "is_admin",
    header: "Role",
    id: "is_admin",
  },
];
