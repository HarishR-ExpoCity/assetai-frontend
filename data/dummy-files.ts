/**
 * Dummy data for file management table
 */

export type FileStatus = 'completed' | 'processing' | 'failed' | 'pending';

export type UploadedFile = {
  id: string;
  fileName: string;
  status: FileStatus;
  size: number;
  uploadedAt: string;
};

export const dummyFiles: UploadedFile[] = [
  {
    id: '1',
    fileName: 'Annual_Report_2024.pdf',
    status: 'completed',
    size: 2456789,
    uploadedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    fileName: 'Financial_Statement_Q4.docx',
    status: 'completed',
    size: 1234567,
    uploadedAt: '2024-01-14T14:22:00Z',
  },
  {
    id: '3',
    fileName: 'Project_Proposal.pdf',
    status: 'processing',
    size: 3456789,
    uploadedAt: '2024-01-15T11:45:00Z',
  },
  {
    id: '4',
    fileName: 'Meeting_Notes_Jan.txt',
    status: 'completed',
    size: 45678,
    uploadedAt: '2024-01-13T09:15:00Z',
  },
  {
    id: '5',
    fileName: 'Product_Specs_v2.pdf',
    status: 'failed',
    size: 5678901,
    uploadedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: '6',
    fileName: 'Team_Photo.jpg',
    status: 'completed',
    size: 2345678,
    uploadedAt: '2024-01-12T16:30:00Z',
  },
  {
    id: '7',
    fileName: 'Contract_Draft.docx',
    status: 'pending',
    size: 890123,
    uploadedAt: '2024-01-15T12:00:00Z',
  },
  {
    id: '8',
    fileName: 'Inventory_List.pdf',
    status: 'completed',
    size: 1567890,
    uploadedAt: '2024-01-11T11:20:00Z',
  },
];
