import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Contrast, 
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/hooks/useAccessibility";
import ThemeToggle from "@/components/ThemeToggle";
import AdminUpload from "@/components/AdminUpload";
import AdminBookList from "@/components/AdminBookList";
import API from "@/api";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'upload' or 'edit'
  const [editingBook, setEditingBook] = useState(null);

  const {
    toggleHighContrast,
  } = useAccessibility();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        navigate("/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
          navigate("/dashboard");
          return;
        }

      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await API.post("/auth/logout", { userId: user.id });
    } catch (error) {
      console.error("Logout error:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/dashboard")}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100 dark:shadow-none">
                <span className="text-white text-sm font-bold">PMI</span>
              </div>
              <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Admin Portal</h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleHighContrast}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Contrast size={18} />
              </Button>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-500 dark:text-slate-400 hover:text-red-500 p-2"
                title="Logout"
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Library Management</h2>
            <p className="text-slate-500 dark:text-slate-400">Manage your audiobooks, chapters, and metadata</p>
          </div>
          <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'list' ? 'bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950'}`}
            >
              All Audiobooks
            </button>
            <button 
              onClick={() => { setActiveTab('upload'); setEditingBook(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950'}`}
            >
              Add New
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[500px]">
          {activeTab === 'list' && (
            <AdminBookList 
              onEdit={(book) => {
                setEditingBook(book);
                setActiveTab('edit');
              }} 
            />
          )}

          {(activeTab === 'upload' || activeTab === 'edit') && (
            <div className="p-1">
               <AdminUpload 
                 existingBook={editingBook} 
                 onComplete={() => {
                   setActiveTab('list');
                   setEditingBook(null);
                 }} 
               />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
