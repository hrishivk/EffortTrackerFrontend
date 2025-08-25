import React, { useCallback, useEffect, useState } from "react";
import bg from "../../assets/img/bg.png.png";
import RXLogo from "../../assets/img/RX.svg"
import { loginValidationSchema } from "../../utils/validation/Validation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/configureStore";
import { Eye, EyeOff } from "lucide-react";
import { useSnackbar } from "../../contexts/SnackbarContext";
import { login } from "../../core/actions/action";
import { useNavigate } from "react-router-dom";
import type { LoginResponse } from "./types";
const UserLogin: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [role, setRole] = useState<string>("");
  const [formData, setData] = useState<{ [key: string]: string | number }>({
    email: "",
    password: "",
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const result = loginValidationSchema.safeParse(formData);

    if (!result.success) {
      const errorMessages: { [key: string]: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errorMessages[err.path[0] as string] = err.message;
        }
      });
      const firstErrorMessage = Object.values(errorMessages)[0];
      showSnackbar({ message: firstErrorMessage, severity: "error" });
    } else {
      try {
        const response = await dispatch(login(formData));

        if (login.fulfilled.match(response)) {
          const payload = response.payload as LoginResponse;
          const role = payload.data?.data?.user?.role;
          console.log(response)
          if (role) {
            setRole(role);
            showSnackbar({ message: "Login success", severity: "success" });
          } else {
            showSnackbar({ message: "Role not found", severity: "warning" });
          }
        } else if (login.rejected.match(response)) {
          const errorMessage = response.payload as string;
          showSnackbar({
            message: errorMessage || "Login failed",
            severity: "error",
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  };
  const redirectRolePage = useCallback(() => {
    const roleGroups: { [path: string]: string[] } = {
      "/Sp/dashboard": ["SP"],
      "/Am/dashboard": ["AM"],
      "/*/dashboard": ["USER", "DEVLOPER"],
    };
    const roleRedirects: Record<string, string> = Object.fromEntries(
      Object.entries(roleGroups).flatMap(([path, roles]) =>
        roles.map((role) => [role, path])
      )
    );
    if (role) {
      const redirectPath = roleRedirects[role];
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      } else {
        console.warn("No redirect path for role:", role);
      }
    }
  }, [role, navigate]);
  useEffect(() => {
    if (role) {
      redirectRolePage();
    }
  },[role]);
  return (
    <div
      className="w-full h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="container px-4 md:px-8">
        <div className="flex justify-center mb-6">
          <div className="w-18 h-18   bg-white rounded-full shadow-lg flex items-center justify-center">
            <img src={RXLogo} className="w-14 h-14 object-contain" />
          </div>
        </div>
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg p-6  max-w-2xl   sm:p-8 backdrop-blur-sm bg-opacity-90 mx-auto relative ">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-[#333333] font-medium mb-8 sm:mb-12 text-center">
            Sign-in
          </h2>
          <form className="space-y-4">
            <div>
              <label className="text-sm sm:text-base md:text-lg block mb-1 font-normal text-[#666666]">
              Email
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-3 font-medium sm:px-4 py-3 sm:py-4 border rounded-xl text-md sm:text-base"
                placeholder="Enter your email"
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <label className="text-sm sm:text-base md:text-lg block mb-1 font-normal text-[#666666]">
               Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="w-full px-3 font-medium sm:px-4 py-3 sm:py-4 border rounded-xl pr-12 text-sm sm:text-base"
                placeholder="Enter your password"
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-4 top-[70%]  transform -translate-y-1/2 text-gray-600"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full text-base cursor-pointer sm:text-lg font-medium px-4 py-3 sm:py-4 bg-[#AE22DC] text-white rounded-4xl mt-4 hover:bg-[#bb3ce6] transition"
              onClick={handleClick}
            >
              Log in
            </button>
          </form>

          <p className="mt-6 text-sm sm:text-base text-[#333333] text-center">
            By continuing, you agree to the{" "}
            <a href="#" className="underline hover:text-gray-600">
              Terms of Use
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-gray-600">
              Privacy Policy
            </a>
            .
          </p>

          <div className="text-right mt-6 sm:mt-8 mr-2 sm:mr-4">
            <a
              href="#"
              className="text-sm sm:text-base text-gray-700 hover:underline hover:text-gray-600"
            >
              Forgot password?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
