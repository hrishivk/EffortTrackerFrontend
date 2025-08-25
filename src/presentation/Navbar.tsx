import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiBell, FiMenu, FiX } from "react-icons/fi";
import logo from "../assets/img/RX.svg";
import { useAppSelector, type AppDispatch } from "../store/configureStore";
import { useDispatch } from "react-redux";
import { reset } from "../reducers/authSlice";
import { authLogout } from "../core/actions/action";
import { motion } from "framer-motion";
const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector((state) => state.user);
  const role = user?.role;
  const id = user?.id;
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  useEffect(() => setProfileMenuOpen(false), [location]);
  const handleLogout = async () => {
    const response = await authLogout(id as string);
    if (response.success) {
      await dispatch(reset());
      window.location.href = "/";
    }
  };
  const renderLinks = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const getLinkClass = (path: string) => {
      const baseClass =
        "transition-all duration-200 font-medium text-base px-2";
      const activeClass = "text-[#AD21DB] border-b-2 border-[#AD21DB]";
      const inactiveClass = "text-black hover:text-blue-600";
      return `${baseClass} ${
        currentPath === path ? activeClass : inactiveClass
      }`;
    };

    return (
      <>
        {role === "AM" && (
          <>
            <Link to="/Am/Dashboard" className={getLinkClass("/Am/Dashboard")}>
              Dashboard
            </Link>
            <Link to="/taskList" className={getLinkClass("/taskList")}>
              Task List
            </Link>
            <Link
              to="/Am/TeamManagement"
              className={getLinkClass("/Am/TeamManagement")}
            >
              Team Management
            </Link>
          </>
        )}
        {role === "SP" && (
          <>
            <Link to="/Sp/dashboard" className={getLinkClass("/Sp/dashboard")}>
              Dashboard
            </Link>
            <Link
              to="/Sp/userMangement"
              className={getLinkClass("/Sp/userMangement")}
            >
              User Management
            </Link>
          </>
        )}
        {(role === "USER" || role === "DEVLOPER") && (
          <>
            <Link to="/*/dashboard" className={getLinkClass("/*/dashboard")}>
              Dashboard
            </Link>
            <Link to="/taskList" className={getLinkClass("/taskList")}>
              Task List
            </Link>
          </>
        )}
      </>
    );
  };

  const ProfileImage = (
    <img
      src={user?.image || "/default-avatar.png"}
      alt="Profile"
      className="w-9 h-9 rounded-full object-cover cursor-pointer"
      onClick={() => setProfileMenuOpen((prev) => !prev)}
    />
  );

  const ProfileDropdown = (
    <>
   
      <div className="absolute right-0 mt-4 w-80 bg-white border border-gray-100 rounded-xl shadow-2xl ring-1 ring-black/5 z-50 text-sm transition-all duration-300 ease-out animate-fadeSlideDown">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-4 border-b">
          <img
            src={user?.image || "/default-avatar.png"}
            alt="Avatar"
            className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-[#AD21DB]"
          />
          <div className="flex flex-col justify-center">
            <p className="text-base font-semibold text-gray-900">
              {user?.fullName
                ? user.fullName.charAt(0).toUpperCase() +
                  user.fullName.slice(1).toLowerCase()
                : "User"}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-gray-100">
          {[
            {
              label: "Show Profile",
              icon: (
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5.121 17.804A4.002 4.002 0 018 16h8a4 4 0 013.879 2.804M12 12a4 4 0 100-8 4 4 0 000 8z"
                  />
                </svg>
              ),
              onClick: () => (window.location.href = `/profile/${user?.id}`),
            },
          ].map(({ label, icon, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex items-center gap-3 px-6 py-4 text-gray-700 font-medium group transition-transform duration-150   hover:bg-gray-50 rounded"
            >
              <span className="group-hover:scale-110 transition-transform">{icon}</span>
              <span>{label}</span>
            </button>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-4 text-red-600 font-semibold transition-transform duration-150  hover:bg-red-50 rounded"
          >
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  
  );

  return (
    <div className="w-full bg-white shadow relative z-50">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="logo" className="object-contain h-8" />
          <span className="font-bold text-lg sm:text-xl">
            RhythmRx Effort Tracker
          </span>
        </div>

        <div className="md:hidden">
          <button className="text-black" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-10 text-base text-black text-md font-bold">
          {renderLinks()}
          <div className="relative">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
              className="rounded-full p-2 hover: cursor-pointer"
            >
              <FiBell size={20} />
            </motion.div>
            <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">
              {3}
            </div>
          </div>
          <div className="relative" ref={profileRef}>
            {ProfileImage}
            {profileMenuOpen && ProfileDropdown}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
            onClick={() => setMenuOpen(false)}
          ></div>

          <div className="md:hidden fixed top-16 left-4 right-4 z-50 rounded-xl shadow-xl bg-white p-6 space-y-6 transform animate-slideDown">
            {/* {renderLinks(true)} */}

            <hr className="border-gray-200" />

            <div className="flex items-center justify-between">
              <button className="rounded-full bg-gray-100 p-3 hover:bg-gray-200 transition duration-200">
                <FiBell size={20} />
              </button>

              <div className="relative" ref={profileRef}>
                {ProfileImage}
                {profileMenuOpen && ProfileDropdown}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
