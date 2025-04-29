// src/pages/About.tsx
import React from 'react';
import { Card } from 'flowbite-react';

const About: React.FC = () => {
    return (
        // Using similar container styling as SignIn/SignUp form boxes
        <div className="max-w-2xl p-6 mx-auto mt-10 bg-white rounded-lg shadow-md dark:bg-gray-800">
            <h1 className="mb-4 text-3xl font-bold text-center text-gray-900 dark:text-white">
                About Task Manager
            </h1>

            <Card> {/* Using a Card for content structure */}
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                    Welcome to Task Manager! This application helps you organize your life and manage your daily tasks efficiently.
                </p>
                <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                    Built with modern web technologies including React, TypeScript, Node.js, Express, MongoDB, and styled with Flowbite/Tailwind CSS.
                </p>
                <h2 className="mt-4 mb-2 text-xl font-semibold text-gray-900 dark:text-white">Features:</h2>
                <ul className="mb-3 text-gray-700 list-disc list-inside dark:text-gray-400">
                    <li>Create, edit, and delete tasks</li>
                    <li>Secure user authentication</li>
                    <li>Simple and intuitive interface</li>
                    {/* Add more features as applicable */}
                </ul>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                    {/* ✍️ Update with your name or project team */}
                    This application was created by Yahav Helfer.
                </p>
            </Card>

           
        </div>
    );
};

export default About;