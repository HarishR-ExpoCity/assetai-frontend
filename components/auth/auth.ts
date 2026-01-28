// Simple local authentication - no backend auth required
// Hardcoded credentials for local/offline deployment

export const LOCAL_USERS = [
  {
    username: 'admin@assetai.com',
    password: 'Password@AssetAI',
    is_admin: true,
    email: 'admin@assetai.com',
  },
];

export const authConfig = {
  userKey: 'auth_user',
};

export interface User {
  id: string;
  username: string;
  email?: string;
  is_admin?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export const getStoredAuth = (): AuthState => {
  if (typeof window === 'undefined') {
    return { isAuthenticated: false, user: null };
  }

  const userStr = sessionStorage.getItem(authConfig.userKey);

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return { isAuthenticated: true, user };
    } catch {
      return { isAuthenticated: false, user: null };
    }
  }

  return { isAuthenticated: false, user: null };
};

export const setStoredAuth = (user: User): void => {
  sessionStorage.setItem(authConfig.userKey, JSON.stringify(user));
};

export const clearStoredAuth = (): void => {
  sessionStorage.removeItem(authConfig.userKey);
};

// Validate credentials against hardcoded users
export const validateCredentials = (
  username: string,
  password: string,
): User | null => {
  const foundUser = LOCAL_USERS.find(
    (u) => u.username === username && u.password === password,
  );

  if (foundUser) {
    return {
      id: `local-${foundUser.username}`,
      username: foundUser.username,
      email: foundUser.email,
      is_admin: foundUser.is_admin,
    };
  }

  return null;
};
