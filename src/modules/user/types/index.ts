export type taskList = {
    id?: number |undefined;
  created_by?: string | number | null |undefined 
  assigned_to?: string | number | null |undefined 
  project: string;
  description: string;
  priority: string;
  status?:string
  start_time?:string
  end_time?:string
  isLocked?:boolean
  totalTime?:string

};
