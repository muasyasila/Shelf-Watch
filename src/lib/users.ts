// Mock user database (in a real app, this would be a real database)
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export const mockUsers: User[] = [
  {
    id: "1",
    email: "demo@shelfwatch.com",
    name: "Curtis Sila",
  },
  {
    id: "2",
    email: "user@example.com",
    name: "Demo User",
  },
];


export const checkPassword = (email: string, password: string): boolean => {
  // Demo credentials: any email + password "demo123"
  if (password === "demo123") {
    return mockUsers.some(user => user.email === email);
  }
  return false;
};

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(user => user.email === email);
};