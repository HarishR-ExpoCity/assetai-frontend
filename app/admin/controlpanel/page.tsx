"use client";

import React, { useEffect } from "react";

export default function ControlPanelPage() {
    useEffect(() => {
        // Redirect directly to Power Apps URL
        const powerAppsUrl = "https://apps.powerapps.com/play/e/default-d8310f08-1574-471b-8877-43c503225b1a/a/1f7e97cd-ded7-4bc9-93aa-e2fbdcc77c6a?tenantId=d8310f08-1574-471b-8877-43c503225b1a";

        window.location.href = powerAppsUrl;
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="dark:bg-[#FFFFFF0D] dark:text-white bg-[#0000000d] chat-bubble rounded-xl p-3">
                <div className="flex flex-col items-center space-y-1 my-1 mx-2">
                    <div className="flex space-x-1">
                        <div
                            className="dot bg-slate-400 dark:bg-white w-2.5 h-2.5 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                        />
                        <div
                            className="dot bg-slate-400 dark:bg-white w-2.5 h-2.5 rounded-full animate-bounce"
                            style={{ animationDelay: "200ms" }}
                        />
                        <div
                            className="dot bg-slate-400 dark:bg-white w-2.5 h-2.5 rounded-full animate-bounce"
                            style={{ animationDelay: "400ms" }}
                        />
                    </div>
                    <span className="text-lg tracking-[0.025em] dark:text-white mt-1">
                        Redirecting to Power Apps...
                    </span>
                </div>
            </div>
        </div>
    );
} 