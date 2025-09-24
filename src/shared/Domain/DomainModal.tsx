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

import { DomainValidationSchema } from "../../utils/validation/Validation";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { addDomain, fetchExistDomains } from "../../core/actions/spAction";
import type { ProjectModalProps } from "../Project/types";
import type { Domain } from "./types";

const DomainModal: React.FC<ProjectModalProps> = ({ visible, onClose }) => {
  const { showSnackbar } = useSnackbar();
  const [formData, setData] = useState<{ [key: string]: string | number }>({
    name: "",
    description: "",
  });
  const [domain, setDomain] = useState<Domain[]>([]);

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
  const listAllDomains = useCallback(async () => {
    try {
      const response = await fetchExistDomains();
      setDomain(response.data);
    } catch (error) {
      console.log(error);
    }
  }, []);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    let result = DomainValidationSchema.safeParse(formData);
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
        await addDomain(formData);
        showSnackbar({
          message: "Domain Created Successfully",
          severity: "success",
        });
        await listAllDomains();
        onClose();
      } catch (error:any) {
        console.log(error)
         showSnackbar({
          message: "Domain with this name already exists.",
          severity: "error",
         });
      }
    }
  };
  useEffect(() => {
    if (visible) {
      listAllDomains();
    }
  }, [visible, listAllDomains]);

  return (
    <CModal visible={visible} onClose={onClose} size="lg" className="mt-34">
      <CModalBody>
        <CForm>
          <div className="w-full ml-20 mt-2 mb-8 text-3xl font-bold">
            Create Domain
          </div>
          <div className="mb-3 px-20 text-lg">
            <CFormLabel htmlFor="projectName">Domain Name</CFormLabel>
            <CFormInput
              id="projectName"
              name="name"
              placeholder="Enter project name"
              style={{ backgroundColor: "#f2ebf5", padding: "14px" }}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3 px-20 text-lg">
            <CFormLabel htmlFor="description"> Description</CFormLabel>
            <CFormTextarea
              id="description"
              rows={4}
              placeholder="Enter project description"
              name="description"
              onChange={handleChange}
              style={{ backgroundColor: "#f2ebf5", padding: "14px" }}
            />
          </div>
          {domain.length > 0 && (
  <>
    <div className="mb-3 px-20 text-lg">
      <h4 className="text-lg font-semibold mb-3">Existing Domain</h4>
    </div>

    <div className="mt-6 px-10 mr-8">
      <div className="max-h-80 overflow-y-auto pr-2">
        <ul className="space-y-3">
          {domain.map((item, index) => (
            <li
              key={index}
              className="bg-[#f9f1fc] p-3 rounded-md shadow-sm"
            >
              <div className="font-bold text-base">{item.name}</div>
              <div className="text-sm text-gray-700">
                {item.description}
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
          className="bg-[#F0EBF2] text-black px-6 py-2 text-lg rounded-md"
          onClick={onClose}
          style={{ borderRadius: "8px" }}
        >
          Cancel
        </button>
        <button
          className="bg-[#AD21DB] text-white px-6 py-2 text-lg rounded-md"
          onClick={handleClick}
          style={{ borderRadius: "8px" }}
        >
          Add Domain
        </button>
      </CModalFooter>
    </CModal>
  );
};

export default DomainModal;
