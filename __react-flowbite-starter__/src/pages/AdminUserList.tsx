// src/pages/AdminUserList.tsx
import React, { useEffect, useState } from 'react';
import httpClient from '../utils/httpClient'; // ודא ייבוא תקין
import { useAuth } from '../context/UserContext';
import { Table, Spinner, Alert, Button, Tooltip, Dropdown, Modal, Label, TextInput, Textarea } from 'flowbite-react';

// ממשק המשתמש מה-API (עם הוספת שדות שם)
interface ApiUser {
    _id: string;
    email: string;
    isAdmin: boolean;
    firstName?: string; // הוספנו - שם פרטי (אופציונלי)
    lastName?: string;  // הוספנו - שם משפחה (אופציונלי)
}

// --- הקומפוננטה ---
const AdminUserList: React.FC = () => {
    // --- State קיים ---
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser } = useAuth();

    // --- פונקציות API ---
    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        console.log("AdminUserList: Fetching users...");
        try {
            // ודא שה-API בנתיב /users מחזיר את השדות firstName ו-lastName
            const response = await httpClient.get<ApiUser[]>('/users');
            console.log("AdminUserList: Users fetched:", response.data);
            setUsers(response.data);
        } catch (err: any) {
            console.error("AdminUserList: Error fetching users:", err);
            setError(err.response?.data?.message || 'Failed to fetch users. Are you logged in as admin?');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleAdmin = async (targetUserId: string) => {
        if (currentUser && targetUserId === currentUser.id) {
            alert("Admins cannot change their own admin status.");
            return;
        }
        console.log(`Toggling admin status for user: ${targetUserId}`);
        setError(null);
        try {
            await httpClient.put(`/users/${targetUserId}/toggle-admin`);
            fetchUsers(); // רענון הרשימה
        } catch (err: any) {
            console.error("Error toggling admin status:", err);
            setError(err.response?.data?.message || 'Failed to toggle admin status.');
        }
    };

    const handleDeleteUser = async (targetUserId: string, userDisplayName: string) => {
        if (currentUser && targetUserId === currentUser.id) {
            alert("Admins cannot delete themselves.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete user "${userDisplayName}"? This action cannot be undone and will delete their tasks.`)) {
            console.log(`Attempting to delete user: ${targetUserId}`);
            setError(null);
            try {
                await httpClient.delete(`/users/${targetUserId}`);
                console.log(`User ${targetUserId} deleted successfully.`);
                fetchUsers(); // רענון הרשימה
            } catch (err: any) {
                console.error("Error deleting user:", err);
                setError(err.response?.data?.message || 'Failed to delete user.');
            }
        } else {
            console.log("User deletion cancelled.");
        }
    };

    // טעינת המשתמשים בטעינה ראשונית
    useEffect(() => {
        fetchUsers();
    }, []);

    // --- פונקציית עזר להצגת שם המשתמש ---
    const getUserDisplayName = (user: ApiUser): string => {
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        // החזר שם מלא אם קיים, אחרת החזר אימייל
        return fullName || user.email;
    };


    // --- טיפול במצבי טעינה ושגיאה ---
    if (isLoading) {
        return (<div className="p-10 text-center"><Spinner aria-label="Loading users..." size="xl" /></div>);
    }
    if (error) {
        return (
            <Alert color="failure" className="m-4">
                <span className="font-medium">Error!</span> {error}
                <Button color="failure" size="xs" onClick={fetchUsers} className="inline-block ml-2">Try Again</Button>
            </Alert>
        );
    }

    // --- JSX עם הטבלה המעודכנת ---
    return (
        <div className="max-w-4xl p-4 mx-auto">
            <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>

            <div className="overflow-x-auto shadow-md sm:rounded-lg">
                <Table hoverable>
                    <Table.Head>
                        {/* שינוי: כותרת עמודת שם */}
                        <Table.HeadCell>Name</Table.HeadCell>
                        <Table.HeadCell>Email</Table.HeadCell>
                        <Table.HeadCell>Admin Status</Table.HeadCell>
                        {/* הסרנו את עמודת User ID */}
                        {/* <Table.HeadCell>User ID</Table.HeadCell> */}
                        <Table.HeadCell>Actions</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y dark:divide-gray-700">
                        {users.map((user) => {
                            const displayName = getUserDisplayName(user); // קבל שם לתצוגה
                            return (
                                <Table.Row key={user._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                    {/* שינוי: הצגת שם מלא (או אימייל כגיבוי) */}
                                    <Table.Cell className="font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        {displayName}
                                    </Table.Cell>
                                    {/* הוספנו הצגה של האימייל בעמודה נפרדת */}
                                    <Table.Cell className="text-sm text-gray-600 dark:text-gray-400">
                                        {user.email}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {user.isAdmin ?
                                            <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300">Admin</span> :
                                            <span className="px-2 py-1 text-xs font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">Regular</span>
                                        }
                                    </Table.Cell>
                                    {/* הסרנו את התא של ה-User ID */}
                                    {/*
                                    <Table.Cell className="text-xs text-gray-500 dark:text-gray-400">
                                        {user._id}
                                    </Table.Cell>
                                    */}
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            {/* כפתור שינוי סטטוס אדמין */}
                                            <Button
                                                size="xs"
                                                color={user.isAdmin ? "warning" : "success"}
                                                disabled={currentUser?.id === user._id}
                                                onClick={() => handleToggleAdmin(user._id)}
                                                title={currentUser?.id === user._id ? "Cannot change own status" : (user.isAdmin ? "Revoke Admin" : "Make Admin")}
                                            >
                                                {user.isAdmin ? "Revoke Admin" : "Make Admin"}
                                            </Button>

                                            {/* כפתור מחיקה (משתמש בשם לתצוגה בהודעת האישור) */}
                                            {currentUser?.id === user._id ? (
                                                <Tooltip content="Cannot delete yourself">
                                                    <span className="inline-block cursor-not-allowed">
                                                        <Button size="xs" color="failure" disabled> Delete </Button>
                                                    </span>
                                                </Tooltip>
                                            ) : (
                                                <Button
                                                    size="xs"
                                                    color="failure"
                                                    // שימוש בשם לתצוגה בהודעת האישור ובכותרת הכפתור
                                                    onClick={() => handleDeleteUser(user._id, displayName)}
                                                    title={`Delete user ${displayName}`}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
                {users.length === 0 && !isLoading && (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUserList;