import { getInitials } from "./utils";

type Props = {
  name: string;
  size: number;
  fontSize: number;
};

const InitialsAvatar = ({ name, size, fontSize }: Props) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: "#7c3aed",
      color: "#fff",
      fontSize,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {getInitials(name)}
  </div>
);

export default InitialsAvatar;
