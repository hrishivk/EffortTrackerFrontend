export type LoginResponse = {
  status: number;
  data: {
    success: boolean;
    message: string;
    data: LoginData;
  };
};
export type LoginData = {
  token: {
    accessToken: string;
    refreshToken: string;
  };
  user: User;
};

export type User = {
  id: number;
  role: string;
  email: string;
  fullName: string;
  image: string;
};

