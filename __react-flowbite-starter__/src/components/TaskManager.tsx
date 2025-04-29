// src/components/TaskManager.tsx
import React, { useEffect, useState, useCallback } from 'react';
import httpClient from '../utils/httpClient';
import { useAuth } from '../context/UserContext';
import { Button, Card, Label, TextInput, Textarea, Dropdown, Spinner, Alert, Tooltip, Select, Table, Modal } from 'flowbite-react'; // הוספנו Modal
import { FaStar, FaTimes, FaTable, FaListAlt } from "react-icons/fa";
// אופציונלי: אם רוצים אייקון במודאל המחיקה
// import { HiOutlineExclamationCircle } from 'react-icons/hi';
import debounce from 'lodash.debounce';

// --- ממשקים ---
type TaskStatus = "pending" | "todo" | "in-progress" | "done";
type FilterTaskStatus = TaskStatus | 'all';
const taskStatuses: TaskStatus[] = ["pending", "todo", "in-progress", "done"];
type ViewMode = 'card' | 'table';

interface Task {
    _id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    createdAt: string;
    isFavorite: boolean;
    dueDate?: string | Date | null;
    userId?: {
        _id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        username?: string;
    } | string;
}

interface SelectUser {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    username?: string;
}

interface CurrentUser {
    _id?: string;
    id?: string; // Handle both potential ID fields
    email?: string;
    isAdmin?: boolean;
    firstName?: string;
    lastName?: string;
    username?: string;
}

interface Filters {
    status: FilterTaskStatus;
    searchTerm: string;
    isFavorite: 'all' | 'true' | 'false';
    assignee: string;
}

const initialFilters: Filters = {
    status: 'all',
    searchTerm: '',
    isFavorite: 'all',
    assignee: '',
};


// --- הקומפוננטה ---
export default function TaskManager() {
    // --- State ---
    const [tasks, setTasks] = useState<Task[]>([]);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState<string>("");
    const [editTaskId, setEditTaskId] = useState<string | null>(null);
    const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const { user: currentUser } = useAuth() as { user: CurrentUser | null };
    const [allUsers, setAllUsers] = useState<SelectUser[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
    const [selectedUserIdForNewTask, setSelectedUserIdForNewTask] = useState<string>("");
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    // State for Delete Confirmation Modal
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);
    const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
    const [taskToDeleteTitle, setTaskToDeleteTitle] = useState<string | null>(null); // Optional: for display


    // --- פונקציית עזר להצגת שם משתמש ---
    const getUserDisplayName = (user: SelectUser | CurrentUser | Task['userId'] | null | undefined): string => {
        if (!user) return 'Unknown';
        if (typeof user === 'string') {
            const foundUser = allUsers.find(u => u._id === user);
            if (foundUser) { user = foundUser; }
            else { return `ID: ${user.substring(0, 6)}...`; }
        }
        if (typeof user !== 'object' || user === null) return 'Invalid User Data';
        const firstName = 'firstName' in user ? user.firstName || '' : '';
        const lastName = 'lastName' in user ? user.lastName || '' : '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName) return fullName;
        if ('email' in user && user.email) return user.email;
        if ('username' in user && user.username) return user.username;
        const userId = user._id || ('id' in user ? user.id : undefined);
        if (userId) return `User (${userId.substring(0,4)}...)`;
        return 'Unknown';
    };


    // --- פונקציית עזר לקבלת שם משויך (מחזירה רק מחרוזת) ---
    const getAssigneeName = (task: Task): string => {
        const currentUserId = currentUser?._id || currentUser?.id;
        if (!task.userId || (currentUserId && task.userId === currentUserId)) {
             return currentUser ? getUserDisplayName(currentUser) : 'Self';
        }
        if (typeof task.userId === 'object' && task.userId !== null) {
            if (!task.userId._id && !task.userId.email) return 'Invalid Assignee Data';
            return getUserDisplayName(task.userId);
        } else if (typeof task.userId === 'string') {
            const assignedUser = allUsers.find(u => u._id === task.userId);
            return assignedUser ? getUserDisplayName(assignedUser) : `ID: ${task.userId.substring(0, 6)}...`;
        }
        return 'Unknown';
    };


    // --- פונקציות API ---
    const fetchUserTasks = useCallback(async (currentFilters: Filters) => {
        setIsLoadingTasks(true);
        setFetchError(null);
        try {
            const params = new URLSearchParams();
            if (currentFilters.status && currentFilters.status !== 'all') params.append('status', currentFilters.status);
            if (currentFilters.searchTerm) params.append('searchTerm', currentFilters.searchTerm.trim());
            if (currentFilters.isFavorite && currentFilters.isFavorite !== 'all') params.append('isFavorite', currentFilters.isFavorite);
            if (currentUser?.isAdmin && currentFilters.assignee) params.append('assignee', currentFilters.assignee);
            const queryString = params.toString();
            const url = `/tasks${queryString ? `?${queryString}` : ''}`;
            const res = await httpClient.get<Task[]>(url);
            if (Array.isArray(res.data)) { setTasks(res.data); }
            else { throw new Error("Invalid task data format received from API"); }
        } catch (err: any) {
            console.error("Error fetching user tasks:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to fetch tasks.';
            setFetchError(errorMsg); setTasks([]);
        } finally { setIsLoadingTasks(false); }
    }, [currentUser?.isAdmin]);

    const debouncedFetchTasks = useCallback(debounce(fetchUserTasks, 500), [fetchUserTasks]);

    const fetchAllUsersForAdmin = async () => {
        if (!currentUser?.isAdmin) return;
        setIsLoadingUsers(true);
        try {
            const res = await httpClient.get<SelectUser[]>('/users');
            if (Array.isArray(res.data)) { setAllUsers(res.data); }
            else { console.error("Received non-array data for users:", res.data); throw new Error("Invalid user data format received from API"); }
            setSelectedUserIdForNewTask("");
        } catch (err: any) { console.error("Error fetching users for admin:", err); setAllUsers([]); }
        finally { setIsLoadingUsers(false); }
    };

    // --- פונקציות טיפול בפעולות ---
    const handleAddTask = async () => {
        if (!title.trim()) { setActionError("Task title cannot be empty!"); return; }
        setActionError(null);
        const payload: any = { title: title.trim(), description: description.trim() || undefined, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined };
        if (currentUser?.isAdmin && selectedUserIdForNewTask) { payload.targetUserId = selectedUserIdForNewTask; }
        try {
            await httpClient.post("/tasks", payload);
            setTitle(""); setDescription(""); setEditTaskId(null); setSelectedUserIdForNewTask(""); setDueDate("");
            fetchUserTasks(filters);
        } catch (err: any) { console.error("Error creating task:", err); setActionError(err.response?.data?.message || 'Failed to add task.'); }
    };

    // --- MODIFIED: Opens the confirmation modal ---
    const handleDelete = (task: Task) => { // Now takes the full task object
        setTaskToDeleteId(task._id);
        setTaskToDeleteTitle(task.title); // Store title for modal message
        setShowDeleteConfirmModal(true); // Open modal
        setActionError(null);
    };

    // --- NEW: Handles the actual deletion after confirmation ---
     const confirmDeleteTask = async () => {
        if (!taskToDeleteId) return; // Safety check

        // Optionally show loading state on the confirmation button
        // setLoadingDelete(true);
        setActionError(null);
        try {
            console.log(`Attempting deletion of task ID: ${taskToDeleteId}`);
            await httpClient.delete(`/tasks/${taskToDeleteId}`);
            console.log(`Task ${taskToDeleteId} deleted successfully.`);
            setShowDeleteConfirmModal(false); // Close modal on success
            setTaskToDeleteId(null);
            setTaskToDeleteTitle(null);
            fetchUserTasks(filters); // Refresh task list
        } catch (err: any) {
            console.error("Error deleting task:", err);
            setActionError(err.response?.data?.message || 'Failed to delete task.');
            // Keep modal open to show error? Or close it? Closing for now.
            setShowDeleteConfirmModal(false);
            setTaskToDeleteId(null);
            setTaskToDeleteTitle(null);
        } finally {
             // setLoadingDelete(false);
        }
    };


    const handleEdit = (task: Task) => {
        setEditTaskId(task._id); setTitle(task.title); setDescription(task.description || ""); setActionError(null);
        if (task.dueDate) {
            try {
                const date = new Date(task.dueDate); if (isNaN(date.getTime())) throw new Error("Invalid date stored");
                const timezoneOffset = date.getTimezoneOffset() * 60000; const localTime = date.getTime() - timezoneOffset;
                const localDate = new Date(localTime); const localIsoString = localDate.toISOString().slice(0, 16); setDueDate(localIsoString);
            } catch (e) { console.error("Error formatting dueDate for edit:", task.dueDate, e); setDueDate(""); }
        } else { setDueDate(""); }
    };

    const handleUpdateTask = async () => {
        if (!editTaskId || !title.trim()) { setActionError("Task title cannot be empty!"); return; }
        setActionError(null);
        try {
            const payload = { title: title.trim(), description: description.trim() || undefined, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined };
            await httpClient.put(`/tasks/${editTaskId}`, payload);
            setEditTaskId(null); setTitle(""); setDescription(""); setDueDate("");
            fetchUserTasks(filters);
        } catch (err: any) { console.error("Error updating task:", err); setActionError(err.response?.data?.message || 'Failed to update task.'); }
    };

    const handleCancelEdit = () => {
        setEditTaskId(null); setTitle(''); setDescription(''); setSelectedUserIdForNewTask(''); setDueDate(''); setActionError(null);
    };

    const handleToggleFavorite = async (taskId: string) => {
        setActionError(null); const originalTasks = [...tasks];
        setTasks(prevTasks => prevTasks.map(task => task._id === taskId ? { ...task, isFavorite: !task.isFavorite } : task ));
        try { await httpClient.patch<Task>(`/tasks/${taskId}/toggleFavorite`); }
        catch (err: any) { console.error(`Error toggling favorite for ${taskId}:`, err); setActionError(err.response?.data?.message || 'Failed to toggle favorite.'); setTasks(originalTasks); }
    };

    const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
        setActionError(null); const originalTasks = [...tasks];
        setTasks(prevTasks => prevTasks.map(task => task._id === taskId ? { ...task, status: newStatus } : task ));
        try { await httpClient.put<Task>(`/tasks/${taskId}`, { status: newStatus }); }
        catch (err: any) { console.error(`Error updating status for ${taskId}:`, err); setActionError(err.response?.data?.message || 'Failed to update status.'); setTasks(originalTasks); }
    };

    const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target; setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
    };

    const handleClearFilters = () => { setFilters(initialFilters); };

    // --- useEffect Hooks ---
    useEffect(() => { debouncedFetchTasks(filters); return () => { debouncedFetchTasks.cancel(); }; }, [filters, debouncedFetchTasks]);
    useEffect(() => { if (currentUser?.isAdmin) { fetchAllUsersForAdmin(); } else { setAllUsers([]); if(filters.assignee) { setFilters(f => ({ ...f, assignee: '' })); } } }, [currentUser?.isAdmin]);

    // --- פונקציות עזר לרנדור ---
    const renderDueDate = (task: Task) => {
        if (!task.dueDate || !String(task.dueDate).trim()) return null;
        try {
            const dateObj = new Date(task.dueDate);
            // Check if the date is valid
            if (isNaN(dateObj.getTime())) {
                // תיקון: הדפסת הודעה וערך בעייתי לקונסול
                console.warn(`Task ${task._id}: Invalid date value received:`, task.dueDate);
                return <span className="text-red-600">(Invalid Date)</span>;
            }
            // Format date and time according to locale
            return <span>{dateObj.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</span>;
        } catch (e) {
            // תיקון: הדפסת הודעה, ערך בעייתי ושגיאה לקונסול
            console.error(`Task ${task._id}: Error formatting date`, task.dueDate, e);
            return <span className="text-red-600">(Date Error)</span>;
        }
    };

     const renderAssigneeForCard = (task: Task) => {
        if (!currentUser?.isAdmin) return null; const assigneeName = getAssigneeName(task);
        const shouldDisplay = assigneeName && assigneeName !== 'Self' && !assigneeName.startsWith('ID:') && assigneeName !== 'Unknown';
        return shouldDisplay ? (<div className="mt-1 text-xs text-purple-700 dark:text-purple-400"><span className="font-semibold">Assigned: </span> {assigneeName}</div>) : null;
    };


    // --- JSX ראשי ---
    return (
        <div className="max-w-6xl p-4 mx-auto">
            <h2 className="mb-6 text-3xl font-bold text-center text-gray-900 dark:text-white">Task Manager</h2>

            {/* Add/Edit Task Form */}
            <Card className="mb-8 shadow-lg">
                 <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">{editTaskId ? "Edit Task" : "Add New Task"}</h3>
                 {/* Display action errors (like add/update failures) INSIDE the form card */}
                 {actionError && !showDeleteConfirmModal && <Alert color="failure" className="mb-4" onDismiss={() => setActionError(null)}>{actionError}</Alert>}
                 <form onSubmit={(e) => { e.preventDefault(); if (editTaskId) { handleUpdateTask(); } else { handleAddTask(); } }}>
                     {/* Form fields... */}
                     <div className="mb-4"><div className="block mb-2"><Label htmlFor="title" value="Title" className="dark:text-gray-300" /></div><TextInput id="title" required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                     <div className="mb-4"><div className="block mb-2"><Label htmlFor="description" value="Description" className="dark:text-gray-300" /></div><Textarea id="description" placeholder="(Optional)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
                     <div className="mb-4"><div className="block mb-2"><Label htmlFor="due-date" value="Due Date & Time (Optional)" className="dark:text-gray-300" /></div><TextInput id="due-date" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
                     {(currentUser?.isAdmin && !editTaskId) && (<div className="mb-4"><div className="block mb-2"><Label htmlFor="assign-user-form" value="Assign Task To (Admin Only)" className="dark:text-gray-300" /></div><Select id="assign-user-form" value={selectedUserIdForNewTask} onChange={(e) => setSelectedUserIdForNewTask(e.target.value)} disabled={isLoadingUsers}><option value="">Myself ({getUserDisplayName(currentUser)})</option>{isLoadingUsers ? (<option disabled>Loading...</option>) : (allUsers.map(user => (<option key={user._id} value={user._id}>{getUserDisplayName(user)}</option>)))}</Select></div>)}
                     <Button type="submit" className="w-full" isProcessing={isLoadingTasks || isLoadingUsers} disabled={isLoadingTasks || isLoadingUsers}>{editTaskId ? "Update Task" : "Add Task"}</Button>
                     {editTaskId && (<Button color="gray" onClick={handleCancelEdit} className="w-full mt-2">Cancel Edit</Button>)}
                 </form>
            </Card>

            {/* Filters */}
            <Card className="mb-6 shadow">
                 <h4 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Filter Tasks</h4>
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                     {/* Filter fields... */}
                     <div><Label htmlFor="filter-status" value="Status" className="block mb-1 dark:text-gray-300"/><Select id="filter-status" name="status" value={filters.status} onChange={handleFilterChange}><option value="all">All Statuses</option>{taskStatuses.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>)}</Select></div>
                     <div><Label htmlFor="filter-favorite" value="Favorites" className="block mb-1 dark:text-gray-300"/><Select id="filter-favorite" name="isFavorite" value={filters.isFavorite} onChange={handleFilterChange}><option value="all">All Tasks</option><option value="true">Favorites Only</option><option value="false">Not Favorites</option></Select></div>
                     <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1"><Label htmlFor="filter-search" value="Search (Title/Desc.)" className="block mb-1 dark:text-gray-300"/><TextInput id="filter-search" name="searchTerm" type="search" placeholder="Enter search term..." value={filters.searchTerm} onChange={handleFilterChange} /></div>
                     {currentUser?.isAdmin && (<div><Label htmlFor="filter-assignee" value="Assigned User" className="block mb-1 dark:text-gray-300"/><Select id="filter-assignee" name="assignee" value={filters.assignee} onChange={handleFilterChange} disabled={isLoadingUsers}><option value="">All Users</option>{isLoadingUsers ? (<option disabled>Loading...</option>) : (allUsers.map(user => (<option key={user._id} value={user._id}>{getUserDisplayName(user)}</option>)))}</Select></div>)}
                     <div className="flex items-end"><Button color="light" onClick={handleClearFilters} className="w-full" title="Clear all filters"><FaTimes className="w-4 h-4 mr-2 hidden sm:inline"/> Clear</Button></div>
                 </div>
            </Card>

            {/* Task List Header and View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">Tasks ({isLoadingTasks ? '...' : tasks.length})</h3>
                <div className="flex gap-2">
                     <Tooltip content="Card View"><Button color={viewMode === 'card' ? 'blue' : 'gray'} size="sm" onClick={() => setViewMode('card')} aria-pressed={viewMode === 'card'}><FaListAlt className="w-4 h-4" /></Button></Tooltip>
                     <Tooltip content="Table View"><Button color={viewMode === 'table' ? 'blue' : 'gray'} size="sm" onClick={() => setViewMode('table')} aria-pressed={viewMode === 'table'}><FaTable className="w-4 h-4" /></Button></Tooltip>
                </div>
            </div>

            {/* Loading / Fetch Error Messages */}
            {fetchError && (<Alert color="failure" className="mb-4">Error: {fetchError}<Button size="xs" color="failure" onClick={() => fetchUserTasks(filters)} className="ml-2">Try Again</Button></Alert>)}
            {isLoadingTasks && (<div className="p-4 text-center"><Spinner size="xl"/></div>)}

            {/* Conditional Task List Rendering */}
            {!isLoadingTasks && (
                <>
                    {/* --- Card View --- */}
                    {viewMode === 'card' && (
                        <div className="space-y-4">
                            {tasks.length === 0 && (<p className="py-6 text-center text-gray-500 dark:text-gray-400">{Object.values(filters).some(v => v && v !== 'all') ? 'No tasks match filters.' : 'No tasks yet.'}</p>)}
                            {tasks.map((task) => (
                                <Card key={task._id} className="relative shadow">
                                  {/* Card content... */}
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-grow min-w-0">
                                      <h4 className="text-lg font-bold text-gray-900 truncate dark:text-white" title={task.title}>{task.title}</h4>
                                      {task.description && (<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{task.description}</p>)}
                                      {task.dueDate && (<div className="mt-1 text-xs text-cyan-700 dark:text-cyan-500"><span className="font-semibold">Due: </span>{renderDueDate(task)}</div>)}
                                      {renderAssigneeForCard(task)}
                                      <div className="mt-2">
                                        <Dropdown label={<span className={`text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center cursor-pointer ${task.status === "done"?"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300":task.status==="in-progress"?"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300":task.status==="pending"?"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300":"bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>{task.status.replace('-', ' ')}</span>} size="xs" inline arrowIcon={true} placement="bottom-start">
                                          <Dropdown.Header>Change Status</Dropdown.Header>
                                          {taskStatuses.map((statusOption) => (<Dropdown.Item key={statusOption} onClick={() => handleUpdateStatus(task._id, statusOption)} disabled={task.status === statusOption}>{statusOption.charAt(0).toUpperCase() + statusOption.slice(1).replace('-', ' ')}</Dropdown.Item>))}
                                        </Dropdown>
                                      </div>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 gap-2">
                                        <Tooltip content={task.isFavorite ? "Unfavorite" : "Favorite"}><button onClick={() => handleToggleFavorite(task._id)} className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${task.isFavorite ? 'text-yellow-400 dark:text-yellow-300' : 'text-gray-400 hover:text-yellow-400 dark:hover:text-yellow-300'}`} aria-label={task.isFavorite ? "Unfavorite" : "Favorite"}><FaStar size={16} /></button></Tooltip>
                                        {/* --- MODIFIED: Pass full task object to handleDelete --- */}
                                        <Button size="xs" color="gray" onClick={() => handleEdit(task)}>Edit</Button>
                                        <Button size="xs" color="failure" onClick={() => handleDelete(task)}>Delete</Button>
                                    </div>
                                  </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* --- Table View --- */}
                    {viewMode === 'table' && (
                        <div className="overflow-x-auto shadow-md sm:rounded-lg ">
                            <Table hoverable>
                                <Table.Head>
                                    <Table.HeadCell className="p-4 w-12"><span className="sr-only">Favorite</span><FaStar className="mx-auto text-gray-400"/></Table.HeadCell>
                                    <Table.HeadCell>Title</Table.HeadCell>
                                    <Table.HeadCell>Status</Table.HeadCell>
                                    {currentUser?.isAdmin && <Table.HeadCell>Assignee</Table.HeadCell>}
                                    <Table.HeadCell>Due Date</Table.HeadCell>
                                    <Table.HeadCell className="min-w-[120px]">Actions</Table.HeadCell>
                                </Table.Head>
                                <Table.Body className="divide-y dark:divide-gray-700">
                                    {tasks.length === 0 && (<Table.Row><Table.Cell colSpan={currentUser?.isAdmin ? 6 : 5} className="text-center text-gray-500 dark:text-gray-400 py-4">{Object.values(filters).some(v => v && v !== 'all') ? 'No tasks match filters.' : 'No tasks yet.'}</Table.Cell></Table.Row>)}
                                    {tasks.map((task) => (
                                        <Table.Row key={task._id} className="bg-white dark:bg-gray-800 dark:border-gray-700">
                                            <Table.Cell className="p-4 text-center"><button onClick={() => handleToggleFavorite(task._id)} className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${task.isFavorite ? 'text-yellow-400 dark:text-yellow-300' : 'text-gray-400 hover:text-yellow-400 dark:hover:text-yellow-300'}`} aria-label={task.isFavorite ? "Unfavorite" : "Favorite"}><FaStar size={16} /></button></Table.Cell>
                                            <Table.Cell className="font-medium text-gray-900 dark:text-white max-w-sm" title={task.description || task.title}><span className="block truncate">{task.title}</span>{task.description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">{task.description}</p>}</Table.Cell>
                                            <Table.Cell><Dropdown label={<span className={`text-xs font-semibold px-2 py-0.5 rounded inline-flex items-center cursor-pointer ${task.status === "done"?"bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300":task.status==="in-progress"?"bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300":task.status==="pending"?"bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300":"bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>{task.status.replace('-', ' ')}</span>} size="xs" inline arrowIcon={true} placement="bottom-start"><Dropdown.Header>Change Status</Dropdown.Header>{taskStatuses.map((statusOption) => (<Dropdown.Item key={statusOption} onClick={() => handleUpdateStatus(task._id, statusOption)} disabled={task.status === statusOption}>{statusOption.charAt(0).toUpperCase() + statusOption.slice(1).replace('-', ' ')}</Dropdown.Item>))}</Dropdown></Table.Cell>
                                            {currentUser?.isAdmin && (<Table.Cell className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{getAssigneeName(task)}</Table.Cell>)}
                                            <Table.Cell className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{renderDueDate(task) || <span className='italic text-gray-400'>None</span>}</Table.Cell>
                                            <Table.Cell>
                                                <div className="flex items-center gap-2">
                                                    {/* --- MODIFIED: Pass full task object to handleDelete --- */}
                                                    <Button size="xs" color="gray" onClick={() => handleEdit(task)} title="Edit Task">Edit</Button>
                                                    <Button size="xs" color="failure" onClick={() => handleDelete(task)} title="Delete Task">Delete</Button>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </div>
                    )}
                </>
            )}

            {/* --- NEW: Delete Confirmation Modal --- */}
            <Modal
                show={showDeleteConfirmModal}
                size="md"
                onClose={() => { // Handles closing via 'X' or clicking outside
                    setShowDeleteConfirmModal(false);
                    setTaskToDeleteId(null);
                    setTaskToDeleteTitle(null);
                }}
                popup
            >
                <Modal.Header /> {/* Can be empty for popup style */}
                <Modal.Body>
                    <div className="text-center">
                        {/* Optional Icon */}
                        {/* <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" /> */}
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete this task?
                            {/* Display task title for clarity */}
                            {taskToDeleteTitle && <span className="block font-semibold mt-1">"{taskToDeleteTitle}"</span>}
                            <br />
                            This action cannot be undone.
                        </h3>
                         {/* Display delete error message INSIDE the modal if it occurs */}
                         {actionError && showDeleteConfirmModal && <Alert color="failure" className="mb-4">{actionError}</Alert>}
                        <div className="flex justify-center gap-4">
                            <Button
                                color="failure" // Red color for confirmation
                                onClick={confirmDeleteTask} // Call the actual delete function
                            >
                                Yes, I'm sure
                            </Button>
                            <Button
                                color="gray" // Gray color for cancellation
                                onClick={() => {
                                    setShowDeleteConfirmModal(false);
                                    setTaskToDeleteId(null);
                                    setTaskToDeleteTitle(null);
                                    setActionError(null); // Clear error on cancel
                                }}
                            >
                                No, cancel
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal> {/* End Delete Confirmation Modal */}


        </div> // End Main Container Div
    );
} // End TaskManager Component