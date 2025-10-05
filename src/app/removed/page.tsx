"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RemovedPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any stored auth data
    localStorage.removeItem("supabase.auth.token");
  }, []);

  return (
    <div className="min-h-screen bg-[#f9fafc] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You have been removed
          </h1>
          <p className="text-gray-600">
            You no longer have access to this group chat. If you believe this is
            an error, please contact the group admin.
          </p>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="w-full bg-[#6c63ff] text-white py-3 px-4 rounded-lg hover:bg-[#5a52e5] transition-colors"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}
