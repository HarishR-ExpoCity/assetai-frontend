"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "./Header";
import { DataTable } from "@/components/table/data-table";
import { usercolumns, User } from "./usercolumns";
import { Documents, documentcolumns } from "./documentcolumns";
import { Button } from "@/components/ui/button";
import {
  EditRounded as EditIcon,
  DeleteRounded as DeleteIcon,
  VisibilityRounded as ViewIcon,
  CheckRounded as CheckRoundedIcon,
  InfoRounded as InfoIcon,
  LinkRounded as LinkIcon,
} from "@mui/icons-material";
import { Input } from "@/components/ui/input";
import Modal from "@/components/ui/Modal";
import { Label } from "@/components/ui/label";
import { useForm, SubmitHandler } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Toast, { useToast } from "../toast";
import { useAccessToken } from "@/hooks/useAccessToken";

type FormValues = {
  id?: string;
  username: string;
  email: string;
  is_admin: boolean;
};

type SortingState = Array<{
  id: string; // Column ID (e.g., 'name', 'age', etc.)
  desc: boolean; // Boolean indicating if sorting is descending (true) or ascending (false)
}>;

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<"users" | "documents">("users");
  // const [uploadProgress, setUploadProgress] = useState<number>(10);
  const [userData, setUserData] = useState<User[]>([]);
  const [docData, setDocData] = useState<Documents[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState<boolean>(false);
  const [isEditActive, setIsEditActive] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedRows, setSelectedRows] = useState<User[] | Documents[]>([]);
  const [resetSelection, setResetSelection] = useState<boolean>(false);
  const [fileUrl, setFileUrl] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [currentDocument, setCurrentDocument] = useState<Documents | null>(
    null
  );
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(50);

  const { toast, showToast, hideToast } = useToast();

  const [sorting, setSorting] = useState<SortingState>([]);

  const [searchBy, setSearchBy] = useState<string[]>([]); // Track columns being searched
  const [searchValue, setSearchValue] = useState<string[]>([]); // Track values for each search key

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    mode: "onChange", // This will trigger validation on change
    defaultValues: {
      username: "",
      email: "",
      is_admin: false,
    },
  });

  const username = watch("username");
  const email = watch("email");
  const is_admin = watch("is_admin");

  const router = useRouter();

  const { accessToken, getAccessToken, idToken } = useAccessToken();

  useEffect(() => {
    if (accessToken == null) {
      getAccessToken();
    }
  }, [accessToken, getAccessToken]);

  const apiCall = useCallback(
    async <T,>(
      endpoint: string,
      method: string,
      body?: any,
      queryParams?: Record<any, any>,
      customHeaders?: Record<string, string>,
      successMessage?: string
    ): Promise<{ data?: T; error?: string; }> => {
      if (accessToken == null) {
        return { error: "No access token available" };
      }

      setIsLoading(true);
      try {
        let url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}${endpoint}`;

        if (queryParams) {
          const searchParams = new URLSearchParams(queryParams);
          url += `?${searchParams.toString()}`;
        }

        const headers = new Headers({
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${idToken}`,
          Authorization2: `${accessToken}`,
        });

        if (customHeaders) {
          Object.entries(customHeaders).forEach(([key, value]) => {
            headers.append(key, value);
          });
        }

        const requestOptions: RequestInit = {
          method,
          headers,
        };

        if (body) {
          requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);

        const data = await response.json();

        if (response.status === 400) {
          showToast(`An error occurred: ${data.detail}`, "Error", "error");
          return { error: data.detail };
        } else if (response.status === 401) {
          showToast(data.detail, "Error", "error");
          await getAccessToken(); // Attempt to refresh the token
          return { error: data.detail };
        } else if (!response.ok) {
          const errorMessage = `Failed to ${method.toLowerCase()} ${url
            .split("/")
            .pop()}: ${data.detail}`;
          showToast(errorMessage, "Error", "error");
          throw new Error(errorMessage);
        }
        showToast(
          successMessage || `Operation successful`,
          "Success",
          "success"
        );
        return { data };
      } catch (error: any) {
        showToast(
          "An error occurred while processing the request. Try again later",
          "Error",
          "error"
        );
        return { error: error.message };
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, getAccessToken]
  );

  const fetchData = useCallback(
    async (
      limit: number = 50,
      offset: number = 0,
      sortby?: string,
      sortorder?: string,
      searchBy?: string[],
      searchValue?: string[]
    ) => {
      if (isLoading) return;

      if (accessToken == null) {
        return { error: "No access token available" };
      }
      setIsLoading(true);
      try {
        const endpoint = activeTab === "users" ? "/list-users" : "/files/";
        let url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}${endpoint}`;

        const queryParams = new URLSearchParams({
          ...(activeTab === "documents" && {
            limit: limit.toString(),
            offset: offset.toString(),
          }),
          ...(sortby && { sortby }), // Add sortBy if provided
          ...(sortorder && { sortorder }), // Add sortOrder if provided
          ...(searchBy &&
            searchBy.length > 0 && { searchby: searchBy.join(",") }), // Add searchBy if provided
          ...(searchValue &&
            searchValue.length > 0 && { searchvalue: searchValue.join(",") }), // Add searchValue if provided
        });

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
        const response = await fetch(url, {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }
        const data = await response.json();
        if (activeTab === "users") {
          setUserData(data);
        } else {
          setDocData(data.items);
          setTotalFiles(data.total_items);
        }
      } catch (error) {
        console.error(`Failed to fetch ${activeTab} data:`, error);
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTab, accessToken]
  );

  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, fetchData]);

  useEffect(() => {
    if (searchBy.length > 0 && searchValue.length > 0) {
      const sortby = sorting.length > 0 ? sorting[0].id : "";
      const sortorder =
        sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "";
      fetchData(pageSize, offset, sortby, sortorder, searchBy, searchValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchBy, searchValue, sorting]);

  useEffect(() => {
    handleSort(sorting);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  const handleBulkAction = async (action: string) => {
    if (action == "delete" && activeTab == "users") {
      const delete_ids = selectedRows.map((row) => row.id);
      const { error } = await apiCall(
        "/bulk-delete-users",
        "DELETE",
        delete_ids,
        undefined,
        undefined,
        "Users deleted successfully"
      );
      if (!error) {
        fetchData();
      }
    } else if (action == "delete" && activeTab == "documents") {
      const delete_ids = selectedRows.map((row) => row.id);
      const { error } = await apiCall(
        "/files/bulk",
        "POST",
        delete_ids,
        undefined,
        undefined,
        "Files deleted successfully"
      );
      if (!error) {
        fetchData();
      }
    }
  };

  const handleAddUser = () => {
    setIsEditActive(false);
    setCurrentUser(null);
    reset({
      username: "",
      email: "",
      is_admin: false,
    });
    setIsUserModalOpen(true);
  };

  const handleAddFile = () => {
    setIsAddFileModalOpen(true);
  };

  const handleRowSelectionChange = useCallback(
    (selectedRows: User[] | Documents[]) => {
      setSelectedRows(selectedRows);
    },
    []
  );

  const handleEdit = (user: User) => {
    setIsEditActive(true);
    setCurrentUser(user);
    reset({
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
    });
    setIsUserModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSharepointSync = async (row: Documents) => {
    // if (!currentDocument) return;
    const queryParams = { file_id: row.id, source: "SHAREPOINT" };
    const { error } = await apiCall(
      `/files/sync`,
      "POST",
      null,
      queryParams,
      undefined,
      "File synced successfully"
    );
    if (!error) {
      fetchData();
    }
  };

  const handleView = (row: User | Documents) => {
    setCurrentDocument(row as Documents);
    setIsViewModalOpen(true);
  };

  const getRowId = (row: User | Documents) => {
    return row.id?.toString();
  };

  const userActions = (row: User) => (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleEdit(row)}
        className="dark:bg-[#FFFFFF0D] bg-[#0000000D] h-[1.5rem] text-xs font-semibold leading-[18px] tracking-[0.005em] dark:text-white text-[#222222] rounded-lg border-transparent"
      >
        <EditIcon className="h-4 w-4 text-white" />
        <span>Edit</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDelete(row)}
        className="bg-[#D75C5C] h-[1.5rem] text-white"
      >
        <DeleteIcon className="h-4 w-4" />
      </Button>
    </>
  );

  const projectActions = (row: Documents) => (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleSharepointSync(row)}
        className="dark:bg-[#FFFFFF0D] bg-[#0000000D] h-[1.5rem] text-[10px] font-semibold leading-[18px] tracking-[0.005em] dark:text-white text-[#222222] rounded-lg border-transparent"
      >
        <span>Sharepoint</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => console.log("Vector action", row)}
        className="dark:bg-[#FFFFFF0D] bg-[#0000000D] h-[1.5rem] text-[10px] font-semibold leading-[18px] tracking-[0.005em] dark:text-white text-[#222222] rounded-lg border-transparent"
      >
        <span>Vector</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleView(row)}
        className="dark:bg-[#FFFFFF0D] bg-[#0000000D] h-[1.5rem] dark:text-white text-[#222222]"
      >
        <ViewIcon className="h-3 w-3" />
      </Button>
    </>
  );

  const handleCloseModal = () => {
    setIsUserModalOpen(false);
    setCurrentUser(null);
    reset();
  };

  const onSubmit: SubmitHandler<FormValues> = async (userdata) => {
    if (isEditActive && currentUser) {
      const { error } = await apiCall(
        `/update-user/${currentUser.id}`,
        "PUT",
        userdata,
        undefined,
        undefined,
        "User data updated successfully"
      );
      if (!error) {
        fetchData();
      }
      handleCloseModal();
    } else {
      const { error } = await apiCall(
        "/create-user",
        "POST",
        userdata,
        undefined,
        undefined,
        "User created successfully"
      );
      if (!error) {
        fetchData();
      }
      handleCloseModal();
    }
  };

  const isFormValid = () => {
    return isValid && username && email;
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "users" | "documents");
    setSelectedRows([]);
    setResetSelection((prev) => !prev);
  };

  const convertFromBytes = (bytes: number): string => {
    if (bytes < 0) {
      throw new Error("File size cannot be negative");
    }
    const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const handleVectorViewClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (currentDocument?.file_full_path) {
      const encodedPath = encodeURIComponent(currentDocument.file_full_path);
      const newPath = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/documents?path=${encodedPath}`;
      router.push(newPath);
    }
  };

  const handleRoleChange = (value: string) => {
    setValue("is_admin", value === "admin");
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;
    const { error } = await apiCall(
      `/delete-user/${currentUser.id}`,
      "DELETE",
      undefined,
      undefined,
      undefined,
      "User deleted successfully"
    );
    if (!error) {
      fetchData();
    }
    setIsDeleteModalOpen(false);
  };

  const handleAddFileSync = async () => {
    const { error } = await apiCall(
      "/files/",
      "POST",
      { path: fileUrl },
      undefined,
      undefined,
      "File added successfully"
    );
    if (!error) {
      setFileUrl("");
      fetchData();
    }
    setIsAddFileModalOpen(false);
  };

  const handleCancelAddFile = () => {
    setIsAddFileModalOpen(false);
    setFileUrl("");
  };

  const handlePageChange = (page: number) => {
    setOffset(page);
    fetchData(pageSize, page);
  };

  const handlePageSizeChange = (pagesize: number) => {
    setPageSize(pagesize);
    fetchData(pagesize, offset);
  };

  const handleSearch = async (columnId: string, searchTerm: string) => {
    setSearchBy((prev) => {
      const index = prev.indexOf(columnId);
      if (index === -1) {
        return [...prev, columnId];
      }
      return prev;
    });

    setSearchValue((prev) => {
      const index = prev.indexOf(searchTerm);
      if (index === -1) {
        return [...prev, searchTerm];
      } else {
        const updated = [...prev];
        updated[index] = searchTerm;
        return updated;
      }
    });
  };

  const handleSort = async (sortData: SortingState) => {
    const sortBy = sortData.length > 0 ? sortData[0].id : "";
    const sortOrder =
      sortData.length > 0 ? (sortData[0].desc ? "desc" : "asc") : "";
    fetchData(pageSize, offset, sortBy, sortOrder, searchBy, searchValue);
  };

  return (
    <>
      <div className="flex mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              User Management
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              Document Management
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Header
          activeTab={activeTab}
          // uploadProgress={uploadProgress}
          onBulkAction={handleBulkAction}
          onAddUser={handleAddUser}
          onAddFile={handleAddFile}
          selectedRows={selectedRows}
        />
      </div>

      {activeTab === "users" ? (
        <DataTable
          columns={usercolumns}
          data={userData}
          tableHeadVariant="alternate"
          tableCellVariant="alternate"
          enableRowSelection={true}
          onRowSelectionChange={handleRowSelectionChange}
          getRowId={getRowId}
          getActions={userActions}
          badgeColumns={["is_admin"]}
          resetSelection={resetSelection}
          enablePagination={true}
          totalItems={userData.length}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSize={pageSize}
          currentPage={offset}
          sorting={sorting}
          setSorting={setSorting}
          isDataLoading={isLoading}
        />
      ) : (
        <DataTable
          columns={documentcolumns}
          data={docData}
          tableHeadVariant="alternate"
          tableCellVariant="alternate"
          enableRowSelection={true}
          onRowSelectionChange={handleRowSelectionChange}
          getRowId={getRowId}
          getActions={projectActions}
          badgeColumns={["file_status", "vector_status"]}
          resetSelection={resetSelection}
          enablePagination={true}
          totalItems={totalFiles}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSize={pageSize}
          currentPage={offset}
          enableColumnFilters={true}
          filterableColumns={[
            // "project_name",
            // "file_name",
            "file_status",
            "vector_status",
            "file_full_path",
          ]}
          onSearch={handleSearch}
          sorting={sorting}
          setSorting={setSorting}
          isDataLoading={isLoading}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          title={toast.title}
        />
      )}

      {/* Add/Edit User Modal Component */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={handleCloseModal}
        title={isEditActive ? "Edit User" : "Add User"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* firstname */}
          <div>
            <Label
              htmlFor="username"
              className="text-base font-normal text-input-hard leading-6 tracking-[0.015em] text-left"
            >
              Username
            </Label>
            <Input
              id="username"
              placeholder="Type here..."
              {...register("username", { required: "Username is required" })}
              className="h-12 mt-2 bg-[#0000000D] rounded-lg border dark:border-[#FFFFFF40] dark:text-white dark:placeholder-[#FFFFFF40] border-[#00000040] placeholder:text-[#00000040] text-base font-medium leading-6 tracking-[0.005em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {!username && !errors.username && (
              <p className="text-xs dark:text-[#FFFFFF73] text-[#00000040] mt-2 font-light">
                Enter the username
              </p>
            )}
            {errors.username && (
              <p className="text-red-500 text-xs mt-2">
                {errors.username.message}
              </p>
            )}
          </div>
          {/* last name */}
          {/* <div>
            <Label
              htmlFor="lastName"
              className="text-base font-normal text-input-hard leading-6 tracking-[0.015em] text-left"
            >
              Last Name
            </Label>
            <Input
              id="lastName"
              placeholder="Type here..."
              {...register("lastName", { required: "Last name is required" })}
              className="h-12 mt-2 bg-[#0000000D] rounded-lg border dark:border-[#FFFFFF40] dark:text-white dark:placeholder-[#FFFFFF40] border-[#00000040] placeholder:text-[#00000040] text-base font-medium leading-6 tracking-[0.005em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {!lastName && !errors.lastName && (
              <p className="text-xs dark:text-[#FFFFFF73] text-[#00000040] mt-2 font-light">
                Enter the user's last name
              </p>
            )}
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-2">
                {errors.lastName.message}
              </p>
            )}
          </div> */}
          {/* email */}
          <div>
            <Label
              htmlFor="email"
              className="text-base font-normal text-input-hard leading-6 tracking-[0.015em] text-left"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Type here..."
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="h-12 mt-2 bg-[#0000000D] rounded-lg border dark:border-[#FFFFFF40] dark:text-white dark:placeholder-[#FFFFFF40] border-[#00000040] placeholder:text-[#00000040] text-base font-medium leading-6 tracking-[0.005em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {!email && !errors.email && (
              <p className="text-xs dark:text-[#FFFFFF73] text-[#00000040] mt-2 font-light">
                Enter the user&apos;s email
              </p>
            )}
            {errors.email && (
              <p className="text-red-500 text-xs mt-2">
                {errors.email.message}
              </p>
            )}
          </div>
          {/* role */}
          <div>
            <Label className="text-base font-normal text-input-hard leading-6 tracking-[0.015em] text-left">
              Role
            </Label>
            <RadioGroup
              value={is_admin ? "admin" : "user"}
              onValueChange={handleRoleChange}
              className="flex gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user">User</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin">Admin</Label>
              </div>
            </RadioGroup>
          </div>
          {/* Modal Footer  */}
          <div className="pt-[1.5rem] border-t border-t-[#0000000D] flex justify-end">
            <div className="flex justify-end space-x-4">
              <Button
                className="card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D]"
                variant="secondary"
                onClick={handleCloseModal}
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 text-white rounded-lg admin-btn"
                // onClick={handleCloseModal}
                disabled={!isFormValid()}
              >
                {isEditActive ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal Component */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
      >
        <div className="mb-6 flex items-center">
          <InfoIcon className="h-12 w-12 text-[#D75C5C]" />
          <span className="ml-3 text-center">
            Are you sure you want to delete this user?{" "}
          </span>
        </div>
        {/* Modal Footer  */}
        <div className="pt-[1.5rem] border-t border-t-[#0000000D] flex justify-end">
          <div className="flex justify-end space-x-4">
            <Button
              className="card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D]"
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Close
              <ViewIcon className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 text-white rounded-lg bg-[#D75C5C]"
              onClick={() => handleDeleteUser()}
            // disabled={!comments}
            >
              <CheckRoundedIcon className="w-5 h-5" />
              Confirm
              <ViewIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add File Modal Component */}
      <Modal
        isOpen={isAddFileModalOpen}
        onClose={() => setIsAddFileModalOpen(false)}
        title="Add File"
      >
        {/* Input Component */}
        <Label className="text-base font-normal leading-6 tracking-wide dark:text-white">
          URL
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <LinkIcon className="h-5 w-5 dark:text-white text-black" />
          </div>
          <Input
            type="text"
            placeholder="Paste URL here..."
            className="flex-grow h-[3rem] pl-10 dark:text-white dark:border-[#FFFFFF26] mb-4 mt-2 dark:bg-[#FFFFFF0D] bg-[#0000000D]"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
          />
        </div>
        {/* Modal Footer  */}
        <div className="pt-[1.5rem] border-t border-t-[#0000000D] flex justify-end">
          <div className="flex justify-end space-x-4">
            <Button
              className="card-bg header-text dark:bg-slate-400 dark:bg-[#FFFFFF0D]"
              variant="secondary"
              onClick={handleCancelAddFile}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-4 py-2 text-white rounded-lg admin-btn"
              onClick={handleAddFileSync}
            // disabled={!comments}
            >
              Sync
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Document Modal Component */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Asset Management Guidelines - Details"
      >
        {currentDocument && (
          <div className="text-base font-light leading-6 tracking-[0.005em] dark:text-white text-black ">
            <div>Size: {convertFromBytes(currentDocument?.size)}</div>
            <div>
              Updated At:{" "}
              {format(currentDocument?.updated_at, "dd MMM yyyy, hh:mm a")}
            </div>
            <div>Sharepoint Status: {currentDocument?.file_status}</div>
            <div>Vector Status: {currentDocument?.vector_status}</div>
            <div>Vector Error: {currentDocument?.vector_error}</div>
            <div>
              Vector View:
              <a
                href="#"
                onClick={handleVectorViewClick}
                target="_blank"
                rel="noopener noreferrer"
              >
                {" "}
                Click to View
              </a>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
