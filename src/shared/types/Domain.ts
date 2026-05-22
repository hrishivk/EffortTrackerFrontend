
export interface Domain {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | number | null;
  creator?: { id: string | number; fullName: string } | null;
  assignedUsers?: { id: string | number; fullName: string }[];
}

