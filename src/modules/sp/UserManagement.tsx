import React from "react";
import TableList from "../../shared/Table/Table";

const UserManagement: React.FC = () => {
  return (
    <div className="container py-4 px-2 sm:px-6 md:px-8">
      <TableList/>
      <p className="text-center text-[#825294] text-lg mt-4">
        ©2025 RhythmRx Effort Tracker. All rights reserved.
      </p>
    </div>
  );
};

export default UserManagement;
