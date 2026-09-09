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
    contactNumber:z.string()
      .min(1,"Contact number is required")
      .regex(/^\d{10}$/, "Contact number must be exactly 10 digits")
      .refine((val) => !/^(\d)\1{9}$/.test(val), {
        message: "Contact number cannot have all same digits",
      }),
    dateOfBirth:z.string().min(1,"Date of birth is required"),
    bloodGroup:z.string().min(1,"Blood group is required"),
    department:z.string().min(1,"Department is required"),
    workSchedule:z.string().min(1,"Work schedule is required"),
    joiningDate:z.string()
      .min(1,"Joining date is required")
      .refine((val) => {
        const d = new Date(val);
        if (isNaN(d.getTime())) return false;
        d.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return d <= today;
      }, { message: "Joining date cannot be in the future" }),
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
  domainId:z.string().min(1,"Department is required"),
  startDate:z.string().min(1,"Start date is required"),
  endDate:z.string().min(1,"End date is required"),
})
export const DomainValidationSchema=z.object({
  name:z.string().min(1,"Department name is required").regex(/^[A-Za-z\s]+$/, "Department name must contain only letters "),
  description:z.string().min(10,"Desctiption is required")
})
export const leaveRequestValidationSchema = z.object({
  leaveType: z.string().min(1, "Leave type is required"),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().optional(),
  contact: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Contact number must be exactly 10 digits",
    })
    .refine((val) => !val || !/^(\d)\1{9}$/.test(val), {
      message: "Contact number cannot have all same digits",
    }),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
}).refine(
  (data) => {
    if (!data.toDate) return true;
    return new Date(data.toDate) >= new Date(data.fromDate);
  },
  { message: "To date cannot be before From date", path: ["toDate"] },
);

export type leaveRequestValidationSchema = z.infer<typeof leaveRequestValidationSchema>;

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

/**
 * Editing an existing user. Only what the Edit User modal exposes: no password
 * (that is its own tab) and no create-only profile fields, so an old record
 * missing them can still be saved.
 */
export const editUserValidationSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .regex(/^[A-Za-z\s]+$/, "Full name must contain only letters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  role: z.enum(["USER", "SP", "AM", "DEVLOPER"], {
    required_error: "Role is required",
    invalid_type_error: "Invalid role selected",
  }),
  contactNumber: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Phone number must be exactly 10 digits",
    })
    .refine((val) => !val || !/^(\d){9}$/.test(val), {
      message: "Phone number cannot have all same digits",
    }),
  jobTitle: z.string().optional(),
  employeeId: z.string().optional(),
  bloodGroup: z.string().optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine((val) => !val || new Date(val) <= new Date(), {
      message: "Date of birth cannot be in the future",
    }),
  joiningDate: z
    .string()
    .optional()
    .refine((val) => !val || new Date(val) <= new Date(), {
      message: "Joining date cannot be in the future",
    }),
});

/** New password for a user, set by their manager. Mirrors the login rules. */
export const userPasswordValidationSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[@$!%*?&]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Confirm the new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type taskWithDateValidationSchema=z.infer<typeof taskWithDateValidationSchema>
export type taskValidationSchema=z.infer<typeof taskValidationSchema>
export type ProjectValidationSchema=z.infer<typeof ProjectValidationSchema>
export type DomainValidationSchema=z.infer<typeof DomainValidationSchema>
export type loginValidationSchema=z.infer<typeof loginValidationSchema>
export type uservalidationSchema=z.infer<typeof uservalidationSchema>
export type baseValidationSchema=z.infer<typeof baseValidationSchema>
export type editUserValidationSchema=z.infer<typeof editUserValidationSchema>
export type userPasswordValidationSchema=z.infer<typeof userPasswordValidationSchema>
