export type taskList = {
    id?: number |undefined;
  userId: string | number | null |undefined 
  project: string;
  description: string;
  priority: string;
  status?:string
  start_time?:string
  end_time?:string
  isLocked?:boolean
  totalTime?:string
};
