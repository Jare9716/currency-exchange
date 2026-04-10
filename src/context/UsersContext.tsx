"use client";

import React, { createContext, useEffect, useRef, useState } from "react";
import { User } from "@/domain/User";

const initialUsers: User[] = [
    {
        id: "1",
        name: "Jane Doe",
        email: "Jane@Doe.com",
        cc: "44509984",
        phone: "3167897678",
        status: "Activo",
        isClintonListed: false,
    },
    {
        id: "2",
        name: "John Smith",
        email: "John@Smith.com",
        cc: "44509985",
        phone: "3167897679",
        status: "Activo",
        isClintonListed: false,
    },
    {
        id: "3",
        name: "Emily Johnson",
        email: "Emily@Johnson.com",
        cc: "44509986",
        phone: "3167897680",
        status: "Reportado",
        isClintonListed: true,
    },
    {
        id: "4",
        name: "David Martinez",
        email: "David@Martinez.com",
        cc: "44509989",
        phone: "3167897683",
        status: "Reportado",
        isClintonListed: false,
    },
];

type UsersContextType = {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
};

export const UsersContext = createContext<UsersContextType | null>(null);

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        try {
        const storedUsers = localStorage.getItem("users");

        if (storedUsers) {
            const parsedUsers = JSON.parse(storedUsers);

            if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
            setUsers(parsedUsers);
            } else {
            localStorage.setItem("users", JSON.stringify(initialUsers));
            setUsers(initialUsers);
            }
        } else {
            localStorage.setItem("users", JSON.stringify(initialUsers));
            setUsers(initialUsers);
        }
        } catch (error) {
        console.error("Error loading users from localStorage:", error);
        localStorage.setItem("users", JSON.stringify(initialUsers));
        setUsers(initialUsers);
        } finally {
        setIsHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!isHydrated) return;
        localStorage.setItem("users", JSON.stringify(users));
    }, [users, isHydrated]);

    if (!isHydrated) return null;

    return (
        <UsersContext.Provider value={{ users, setUsers }}>
        {children}
        </UsersContext.Provider>
    );    
};