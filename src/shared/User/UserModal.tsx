import React, { useCallback, useEffect, useState } from "react";
import {
  CModal,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
} from "@coreui/react";
import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import {
  baseValidationSchema,
  uservalidationSchema,
} from "../../utils/validation/Validation";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { adduser } from "../../core/actions/action";
import { edituser, fetchExistProjects } from "../../core/actions/spAction";
import { useAppSelector } from "../../store/configureStore";
import type { UserModalProps } from "./types";
import type { project } from "../Project/types";
import type { UserData } from "../../core/types";
import { Eye, EyeOff } from "lucide-react";
const UserModal: React.FC<UserModalProps> = ({
  visible,
  onClose,
  onUpdate,
  data,
}) => {
  const { showSnackbar } = useSnackbar();
  const roleOptions = ["USER", "DEVLOPER"];
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const [formData, setFormData] = useState<UserData>({
    fullName: "",
    email: "",
    password: "",
    role: "",
    projects: "",
    manager_id: user?.id,
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      setFormData({
        id: data.id || "",
        fullName: data.fullName || "",
        email: data.email || "",
        password: data.pas,
        role: data.role || "",
        projects: data.projects || "",
        manager_id: data.manager_id || user?.id || "",
      });
    }
  }, []);
  const [project, setProject] = useState<project[]>([]);

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | SelectChangeEvent<string>
) => {
    const { name, value } = e.target;
    const transformMap: { [key: string]: (val: string) => string | number } = {
      roles: (val) => val.toUpperCase(),
      email: (val) => val.trim(),
      fullName: (val) => val.trim(),
      password: (val) => val.trim(),
      projects: (val) => val.trim(),
    };
    const transformer = transformMap[name];
    const transformedValue = transformer ? transformer(value) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: transformedValue,
    }));
  };

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const schema = data ? baseValidationSchema : uservalidationSchema;
  
    const result = schema.safeParse(formData);
     console.log(result.success)
    if (!result.success) {
      const errorMessage: { [key: string]: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errorMessage[err.path[0] as string] = err.message;
        }
      });
      const firstErrorMessage = Object.values(errorMessage)[0];
      showSnackbar({ message: firstErrorMessage, severity: "error" });
      return;
    }
    try {
      const payload = { ...formData };
      const response = data ? await edituser(payload) : await adduser(payload);
      console.log(response);
      if (response.success) {
        showSnackbar({
          message: data
            ? "User Edited Successfully"
            : "User Created Successfully",
          severity: "success",
        });
        onClose();
        onUpdate();
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        (data ? "User edit failed" : "User creation failed");

      showSnackbar({
        message: errorMessage,
        severity: "error",
      });
    }
  };

  const listAllData = useCallback(async () => {
    try {
      const projectResponse = await fetchExistProjects();
      setProject(projectResponse.data);
    } catch (error) {}
  }, []);

  useEffect(() => {
    if (visible) {
      listAllData();
    }
  }, [visible, listAllData]);

  return (
    <CModal visible={visible} onClose={onClose} size="lg" className="mt-34">
      <CModalBody>
        <CForm>
          <div className="w-full ml-20 mt-2 mb-8 text-3xl font-bold">
            {data ? "Edit User" : "Add User"}
          </div>
          <div className="mb-3 px-20 text-lg ">
            <CFormLabel htmlFor="fullname">Full Name</CFormLabel>
            <CFormInput
              id="fullname"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
              style={{ backgroundColor: "#f2ebf5", padding: "14px" }}
            />
          </div>

          <div className="mb-3 px-20  text-lg">
            <CFormLabel htmlFor="email">Email</CFormLabel>
            <CFormInput
              id="email"
              type="email"
              name="email"
              value={formData.email}
              placeholder="Enter email address"
              onChange={handleChange}
              style={{ backgroundColor: "#f2ebf5", padding: "14px" }}
            />
          </div>
          {!data && (
            <div className="mb-3 px-20  text-lg">
              <CFormLabel htmlFor="password">Password</CFormLabel>
              <CFormInput
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                onChange={handleChange}
                style={{ backgroundColor: "#f2ebf5", padding: "14px" }}
              />
              <button
                type="button"
                className="absolute right-28 top-[57%]  transform -translate-y-1/2 text-gray-600"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          {!data && (
            <div className="mb-3 px-20 text-lg">
                 <CFormLabel>Role</CFormLabel>
              <FormControl fullWidth variant="outlined" sx={{ minWidth: 200 }}>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={formData.role || ""}
                  onChange={handleChange}
                  label="Roles"
                  sx={{
                    backgroundColor: "#f2ebf5",
                    borderRadius: "8px",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ced4da",
                    },
                  }}
                >
                  <MenuItem value=""></MenuItem>
                  {role === "SP" ? (
                    <MenuItem value="AM">AM</MenuItem>
                  ) : (
                    roleOptions.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </div>
          )}

          <div className="mb-3 px-20 text-lg">
            <CFormLabel>Projects</CFormLabel>
            <div className="max-h-60 overflow-y-auto border rounded p-3 bg-white shadow-sm">
              <div className="d-flex flex-wrap gap-3">
                {project.map((project, index) => (
                  <div
                    key={index}
                    className="form-check d-flex align-items-center gap-2"
                  >
                    <input
                      className="form-check-input"
                      name="projects"
                      type="checkbox"
                      checked={formData.projects.includes(project.id)}
                      value={project.id}
                      onChange={handleChange}
                      id={`project-${index}`}
                    />
                    <label
                      className="form-check-label mb-0"
                      htmlFor={`project-${index}`}
                    >
                      {project.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter className="px-6 pb-4 mr-20 border-0 ">
        <button
          style={{ borderRadius: "8px" }}
          onClick={onClose}
          className="bg-[#F0EBF2] text-black px-6 py-2 text-lg rounded-md"
        >
          Cancel
        </button>
        <button
          style={{ borderRadius: "8px" }}
          className="bg-[#AD21DB] text-white px-6 py-2 text-lg rounded-md"
          onClick={handleClick}
        >
          {data ? "Edit User" : "Add User"}
        </button>
      </CModalFooter>
    </CModal>
  );
};

export default UserModal;
