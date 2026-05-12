import { create } from "zustand";

interface User {
  id: number;
  username: string;
  role: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  status?: string;
  teacher?: { id: number; teacherNo: string; subject: string };
  student?: { id: number; studentNo: string; name: string; classId: number; className: string | null; photoUrl: string | null };
  parent?: { id: number; studentId: number; studentName: string | null };
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  refreshToken: localStorage.getItem("refreshToken"),
  user: loadUser(),
  setAuth: (token, refreshToken, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, refreshToken, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({ token: null, refreshToken: null, user: null });
  },
}));
