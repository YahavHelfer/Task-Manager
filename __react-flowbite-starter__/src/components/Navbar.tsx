// src/components/Navbar.tsx
import React from 'react';
import { Navbar, Button, Avatar, Dropdown } from 'flowbite-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/UserContext'; // מניח שזה הקובץ הנכון

const AppNavbar: React.FC = () => {
    const { user, logout } = useAuth(); // ה-user object אמור להכיל עכשיו firstName ו-lastName
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/signin');
    };

    // 1. הכנת משתנים לשם התצוגה ולפרמטר האווטאר
    let displayName = 'User'; // ברירת מחדל
    let avatarNameParam = 'User'; // ברירת מחדל ל-URL

    if (user) {
        if (user.firstName && user.lastName) {
            // אם יש שם פרטי ושם משפחה - הצג אותם
            displayName = `${user.firstName} ${user.lastName}`;
            avatarNameParam = `${user.firstName}+${user.lastName}`; // פורמט ל-URL
        } else if (user.email) {
            // אחרת, אם יש אימייל - הצג אותו (גיבוי)
            displayName = user.email;
            avatarNameParam = user.email;
        }
        // אם אין כלום (לא אמור לקרות אם user קיים), ישאר 'User'
    }


    return (
        <Navbar fluid rounded className="border-b border-gray-200 dark:border-gray-700">
            <Navbar.Brand as={Link} to={user ? "/" : "/signin"}>
                <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
                    Task Manager
                </span>
            </Navbar.Brand>

            <div className="flex md:order-2">
                {user ? (
                    <Dropdown
                        arrowIcon={false}
                        inline
                        label={
                            <Avatar alt="User settings" img={
                                // 3. שימוש בפרמטר השם המחושב ל-URL של האווטאר
                                `https://ui-avatars.com/api/?name=${avatarNameParam}&background=random&size=128`
                            } rounded />
                        }
                    >
                        <Dropdown.Header>
                            {/* 2. שימוש בשם התצוגה המחושב */}
                            <span className="block text-sm font-medium">{displayName}</span>
                            {/* אפשר להוסיף את האימייל מתחת אם רוצים */}
                            {user.firstName && user.lastName && user.email && (
                                 <span className="block text-sm truncate text-gray-500 dark:text-gray-400">{user.email}</span>
                            )}
                        </Dropdown.Header>
                        <Dropdown.Item as={Link} to="/">Dashboard</Dropdown.Item>
                        <Dropdown.Item as={Link} to="/favorites">Favorites</Dropdown.Item>

                        {/* --- קישורי אדמין בתפריט הנפתח --- */}
                        {user.isAdmin && (
                            <>
                                <Dropdown.Divider />
                                <Dropdown.Item as={Link} to="/admin/users">Manage Users</Dropdown.Item>
                            </>
                        )}
                        {/* --- סוף קישורי אדמין --- */}

                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleLogout}>Sign out</Dropdown.Item>
                    </Dropdown>
                ) : (
                    <Button as={Link} to="/signin">Sign In</Button>
                )}
                <Navbar.Toggle />
            </div>

            {/* --- Navbar Collapse נשאר ללא שינוי --- */}
            <Navbar.Collapse>
                {user ? (
                    <>
                        <Navbar.Link as={Link} to="/" active={location.pathname === '/'}>
                            Dashboard
                        </Navbar.Link>
                        <Navbar.Link as={Link} to="/favorites" active={location.pathname === '/favorites'}>
                            Favorites
                        </Navbar.Link>

                        {user.isAdmin && (
                            <>
                                <Navbar.Link as={Link} to="/admin/users" active={location.pathname === '/admin/users'}>
                                    Manage Users
                                </Navbar.Link>
                            </>
                        )}
                        <Navbar.Link as={Link} to="/about" active={location.pathname === '/about'}>
                             About
                         </Navbar.Link>
                    </>
                ) : (
                    <>
                        <Navbar.Link as={Link} to="/signin" active={location.pathname === '/signin'}> Sign In </Navbar.Link>
                        <Navbar.Link as={Link} to="/signup" active={location.pathname === '/signup'}> Sign Up </Navbar.Link>
                        <Navbar.Link as={Link} to="/about" active={location.pathname === '/about'}> About </Navbar.Link>
                    </>
                )}
            </Navbar.Collapse>
        </Navbar>
    );
};

export default AppNavbar;