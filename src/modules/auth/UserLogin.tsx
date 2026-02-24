import React, { useCallback, useEffect, useState } from "react";
import bg from "../../assets/img/bg.png.png";
import RXLogo from "../../assets/img/logo2.png.png";
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
          console.log(response);
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
      "/user/dashboard": ["USER", "DEVLOPER"],
    };
    const roleRedirects: Record<string, string> = Object.fromEntries(
      Object.entries(roleGroups).flatMap(([path, roles]) =>
        roles.map((role) => [role, path]),
      ),
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
  }, [role]);
  return (
    <div
      className="w-full h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl px-4 sm:px-6 mx-auto">
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="w-14 h-14 sm:w-18 sm:h-18 bg-white rounded-full shadow-lg flex items-center justify-center">
            <img
              src={RXLogo}
              className="w-9 h-9 sm:w-12 sm:h-12 object-contain"
            />
          </div>
        </div>

        <div className="w-full bg-white/95 rounded-2xl sm:rounded-3xl shadow-lg py-6 sm:py-8 px-5 sm:px-10 md:px-14 relative">
          <h2 className="text-xl sm:text-2xl md:text-3xl text-[#333333] font-medium mb-6 sm:mb-8 text-center">
            Sign-in
          </h2>
          <form className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-xs sm:text-sm block mb-1 sm:mb-1.5 font-normal text-[#666666]">
                Email
              </label>
              <input
                type="email"
                name="email"
                className="w-full px-3 py-2 sm:py-2.5 font-medium text-xs sm:text-sm border border-black rounded-lg bg-transparent outline-none focus:border-[#AE22DC] transition-colors"
                placeholder="Enter your email"
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <label className="text-xs sm:text-sm block mb-1 sm:mb-1.5 font-normal text-[#666666]">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="w-full px-3 py-2 sm:py-2.5 pr-10 font-medium text-xs sm:text-sm border border-black rounded-lg bg-transparent outline-none focus:border-[#AE22DC] transition-colors"
                placeholder="Enter your password"
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 bottom-2 sm:bottom-2.5 text-gray-500"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full text-sm sm:text-base md:text-lg cursor-pointer font-medium px-4 py-3 bg-[#AE22DC] text-white mt-4 hover:bg-[#bb3ce6] shadow-md"
              style={{ borderRadius: 50 }}
              onClick={handleClick}
            >
              Log in
            </button>
          </form>

          <p className="mt-4 sm:mt-6 text-[10px] sm:text-xs md:text-sm text-[#333333] text-center">
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

          <div className="text-right mt-4 sm:mt-6">
            <a
              href="#"
              className="text-xs sm:text-sm text-gray-700 hover:underline hover:text-gray-600"
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
