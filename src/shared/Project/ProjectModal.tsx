import React, { useCallback, useEffect, useState } from "react";
import {
  CModal,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
} from "@coreui/react";
import type { project, ProjectModalProps } from "./types";
import { useSnackbar } from "../../contexts/SnackbarContext";
import type { Domain } from "../Domain/types";
import {
  addProject,
  fetchExistDomains,
  fetchExistProjects,
} from "../../core/actions/spAction";
import { ProjectValidationSchema } from "../../utils/validation/Validation";

const ProjectModal: React.FC<ProjectModalProps> = ({ visible, onClose }) => {
  const { showSnackbar } = useSnackbar();
  const [formData, setData] = useState<{ [key: string]: string | number }>({
    domain: "",
    name: "",
    description: "",
  });
  const [domain, setDomain] = useState<Domain[]>([]);
  const [project, setProject] = useState<project[]>([]);
  const listAllData = useCallback(async () => {
    try {
      const response = await fetchExistDomains();
      const projectResponse = await fetchExistProjects();
      setDomain(response.data);
      setProject(projectResponse.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let result = ProjectValidationSchema.safeParse(formData);
    if (!result.success) {
      const errorMessage: { [key: string]: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errorMessage[err.path[0] as string] = err.message;
        }
      });
      const firstErrorMessage = Object.values(errorMessage)[0];
      showSnackbar({ message: firstErrorMessage, severity: "error" });
    } else {
      try {
        const response = await addProject(formData);
        console.log(response);
        if (
          response.success &&
          response.message == "Project created successfull"
        ) {
          onClose();
          showSnackbar({
            message: "Project Created Successfully",
            severity: "success",
          });
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error.message;

        showSnackbar({
          message: errorMessage,
          severity: "error",
        });
      }
    }
  };
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  useEffect(() => {
    if (visible) {
      listAllData();
    }
  }, [visible, listAllData]);

  return (
    <CModal visible={visible} onClose={onClose} size="lg"  alignment="center" >
      <CModalBody>
        <CForm>
          <div className="w-full ml-20 mt-2 mb-8 text-3xl font-bold">
            Add project
          </div>
          <div className="mb-3 px-20 text-lg">
            <CFormLabel htmlFor="domain">Domain</CFormLabel>
            <select
              id="domain"
              name="domain"
              className="form-select text-base rounded px-3 py-3 w-full"
              onChange={handleChange}
              style={{
                backgroundColor: "#f2ebf5",
                border: "1px solid #ced4da",
                padding: "14px",
              }}
            >
              <option value="">Select Domain</option>
              {domain.map((item, index) => (
                <option key={index} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3 px-20 text-lg">
            <CFormLabel htmlFor="projectName">Project Name</CFormLabel>
            <CFormInput
              id="projectName"
              name="name"
              placeholder="Enter project name"
              style={{ backgroundColor: "#f2ebf5", padding: "14px" }}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3 px-20 text-lg">
            <CFormLabel htmlFor="description">Project Description</CFormLabel>
            <CFormTextarea
              id="description"
              rows={4}
              placeholder="Enter project description"
              name="description"
              onChange={handleChange}
              style={{ backgroundColor: "#f2ebf5", padding: "14px" }}
            />
          </div>
          {project.length > 0 && (
            <>
              <div className="mb-3 px-20 text-lg">
                <h4 className="text-lg font-semibold mb-3">
                  Existing Demo Projects
                </h4>
              </div>

              <div className="mt-6 px-10 mr-8">
                {/* Scrollable container */}
                <div className="max-h-80 overflow-y-auto pr-2">
                  <ul className="space-y-3">
                    {project.map((project, index) => (
                      <li
                        key={index}
                        className="bg-[#f9f1fc] p-3 rounded-md shadow-sm"
                      >
                        <div className="font-bold text-base">
                          {project.name}
                        </div>
                        <div className="text-sm text-gray-700">
                          {project.description}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </CForm>
      </CModalBody>
      <CModalFooter className="px-6 pb-4 mr-20 border-0">
        <button
          style={{ borderRadius: "8px" }}
          className="bg-[#F0EBF2] text-black px-20 py-2 text-lg rounded-md hover:bg-[#e0dbe8] transition-colors duration-200"
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          style={{ borderRadius: "8px" }}
          className="bg-[#AD21DB] text-white px-18 py-2 rounded-lg hover:bg-[#911bb9] transition-colors duration-200"
          onClick={handleClick}
        >
          Add Project
        </button>
      </CModalFooter>
    </CModal>
  );
};

export default ProjectModal;
