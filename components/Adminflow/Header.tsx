import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DeleteRounded as DeleteIcon,
  // EditRounded as EditIcon,
  // SyncRounded as SyncIcon,
  MoreHorizRounded as MoreHorizontal,
  AddRounded as AddIcon,
} from "@mui/icons-material";
import { User } from "./usercolumns";
import { Documents } from "./documentcolumns";

interface HeaderProps {
  activeTab: "users" | "documents";
  uploadProgress?: number;
  onBulkAction: (action: string) => void;
  onAddUser: () => void;
  onAddFile: () => void;
  selectedRows?: User[] | Documents[] | [];
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  uploadProgress,
  onBulkAction,
  onAddUser,
  onAddFile,
  selectedRows,
}) => {
  const getBulkActions = () => {
    if (activeTab === "users") {
      return [
        {
          label: "Delete",
          icon: <DeleteIcon className="w-4 h-4 mr-2" />,
          action: "delete",
          disabled: selectedRows && selectedRows.length > 0 ? false : true,
        },
        // {
        //   label: "Change Role",
        //   icon: <EditIcon className="w-4 h-4 mr-2" />,
        //   action: "changeRole",
        //   disabled: selectedRows && selectedRows.length > 0 ? false : true,
        // },
      ];
    }
    return [
      {
        label: "Delete",
        icon: <DeleteIcon className="w-4 h-4 mr-2" />,
        action: "delete",
        disabled: selectedRows && selectedRows.length > 0 ? false : true,
      },
      // {
      //   label: "SharePoint Resync",
      //   icon: <SyncIcon className="w-4 h-4 mr-2" />,
      //   action: "sharePointResync",
      //   disabled: selectedRows && selectedRows.length > 0 ? false : true,
      // },
      // {
      //   label: "Vector Resync",
      //   icon: <SyncIcon className="w-4 h-4 mr-2" />,
      //   action: "vectorResync",
      //   disabled: selectedRows && selectedRows.length > 0 ? false : true,
      // },
    ];
  };

  return (
    <div className="flex items-center ml-auto">
      <div className="flex items-center mr-4">
        {uploadProgress !== undefined && (
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-sm text-muted-foreground">Uploading...</span>
            <Progress value={uploadProgress} className="w-[100px]" />
            <span className="text-sm text-muted-foreground">
              {uploadProgress}%
            </span>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="rounded-lg border border-[#0000000D] text-sm font-semibold leading-5 text-left bg-white text-black shadow-none hover:bg-gray-300 hover:text-inherit">
              <MoreHorizontal className="w-4 h-4" />
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {getBulkActions().map((action) => (
              <DropdownMenuItem
                key={action.action}
                onClick={() => onBulkAction(action.action)}
                className="gap-2"
                disabled={action.disabled}
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button
        onClick={activeTab === "users" ? onAddUser : onAddFile}
        className="text-sm font-semibold leading-5 text-left bg-white hover:bg-transparent text-black rounded-lg add-user-file"
      >
        <AddIcon className="w-4 h-4" />
        {activeTab === "users" ? "Add User" : "Add File"}
      </Button>
    </div>
  );
};

export default Header;
