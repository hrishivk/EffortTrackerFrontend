import {z} from 'zod';
export const loginValidationSchema=z.object({
    email:z.string().email('Invalid email address').min(1, 'Email is required'),
    password: z.string().min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character")
})  
export const uservalidationSchema=z.object({
    fullName:z.string().min(1,"Full name is required").regex(/^[A-Za-z\s]+$/, "Full name must contain only letters"),
    email:z.string().min(1,'Email is required').email('Invalid email address'),
    password: z.string().min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
    role:z.enum(['USER','SP','AM','DEVLOPER'],{
    required_error: 'Role is required',
    invalid_type_error: 'Invalid role selected',
  }),
    jobTitle:z.string().min(1,"Job title is required"),
    employeeId:z.string().min(1,"Employee ID is required"),
    contactNumber:z.string().min(1,"Contact number is required"),
    dateOfBirth:z.string().min(1,"Date of birth is required"),
    bloodGroup:z.string().min(1,"Blood group is required"),
    department:z.string().min(1,"Department is required"),
    workSchedule:z.string().min(1,"Work schedule is required"),
    joiningDate:z.string().min(1,"Joining date is required"),
})
export const baseValidationSchema=z.object({
    fullName:z.string().min(1,"full name is required").regex(/^[A-Za-z\s]+$/, "Full name must contain only letters "),
    email:z.string().email('Invalid email address').min(1, 'Email is required'),
    role:z.enum(['USER','SP','AM','DEVLOPER'],{
    required_error: 'Role is required',
    invalid_type_error: 'Invalid role selected',
  }),
  projects:z.string().min(1,'Project required'), 

})
export const taskValidationSchema = z.object({
  project: z.string().min(1, "Project required"),
  description: z.string().min(10, "Description is required"),
  priority: z.enum(["High", "Medium", "Low"], {
    required_error: "Priority is required",
  }),
});

export const ProjectValidationSchema=z.object({
  name:z.string().min(1,"Project name is required"),
  category:z.string().min(1,"Category is required"),
  description:z.string().min(10,"Description is required"),
  domainId:z.string().min(1,"Domain is required"),
  startDate:z.string().min(1,"Start date is required"),
  endDate:z.string().min(1,"End date is required"),
})
export const DomainValidationSchema=z.object({
  name:z.string().min(1,"Domain name is required").regex(/^[A-Za-z\s]+$/, "Domain name must contain only letters "),
  description:z.string().min(10,"Desctiption is required")
})
export const taskWithDateValidationSchema = z.object({
  dueDate: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      date.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date <= today;
    }, {
      message: " Kindly select a valid date",
    }),
});

export type taskWithDateValidationSchema=z.infer<typeof taskWithDateValidationSchema>
export type taskValidationSchema=z.infer<typeof taskValidationSchema>
export type ProjectValidationSchema=z.infer<typeof ProjectValidationSchema>
export type DomainValidationSchema=z.infer<typeof DomainValidationSchema>
export type loginValidationSchema=z.infer<typeof loginValidationSchema>
export type uservalidationSchema=z.infer<typeof uservalidationSchema>
export type baseValidationSchema=z.infer<typeof baseValidationSchema>