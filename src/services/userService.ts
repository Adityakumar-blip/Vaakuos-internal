
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'user';
    is_active: boolean;
    phone?: string;
    createdAt: string;
}

const STORAGE_KEY = 'aura_users';

const MOCK_USERS: User[] = [
    { id: '11', name: 'Rocky', email: 'rocky@example.com', role: 'admin', is_active: true, createdAt: new Date().toISOString() },
    { id: '22', name: 'Raj', email: 'raj@example.com', role: 'manager', is_active: true, createdAt: new Date().toISOString() },
    { id: '33', name: 'Ravi', email: 'ravi@example.com', role: 'user', is_active: true, createdAt: new Date().toISOString() },
    { id: '44', name: 'Bob Johnson', email: 'bob@example.com', role: 'user', is_active: true, createdAt: new Date().toISOString() },
    { id: '55', name: 'Jane Smith', email: 'jane@example.com', role: 'manager', is_active: true, createdAt: new Date().toISOString() },
    { id: '66', name: 'John Doe', email: 'john@example.com', role: 'admin', is_active: true, createdAt: new Date().toISOString() },
];

export const userService = {
    getUsers: (): User[] => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) {
                // Initialize with mock data
                localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_USERS));
                return MOCK_USERS;
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading users:', error);
            return MOCK_USERS;
        }
    },

    getUserById: (id: string): User | undefined => {
        const users = userService.getUsers();
        return users.find(u => u.id === id);
    },

    createUser: (userData: Omit<User, 'id' | 'createdAt'>): User => {
        const users = userService.getUsers();
        const newUser: User = {
            ...userData,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        return newUser;
    },

    updateUser: (id: string, userData: Partial<User>): User | null => {
        const users = userService.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index === -1) return null;

        users[index] = { ...users[index], ...userData };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        return users[index];
    },

    deleteUser: (id: string): boolean => {
        const users = userService.getUsers();
        const filtered = users.filter(u => u.id !== id);
        if (filtered.length === users.length) return false;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    },

    deleteUsers: (ids: string[]): boolean => {
        const users = userService.getUsers();
        const filtered = users.filter(u => !ids.includes(u.id));
        if (filtered.length === users.length) return false;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
};
