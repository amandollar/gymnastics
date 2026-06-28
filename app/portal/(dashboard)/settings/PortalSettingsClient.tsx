"use client";

import React from "react";
import { signOut, signIn } from "next-auth/react";
import SettingsTab from "@/app/portal/_components/SettingsTab";
import { generateSiblingSwitchTokenAction } from "@/lib/actions/students";

interface PortalSettingsClientProps {
  student: any;
  siblings: any[];
  academyProfile: any;
}

export default function PortalSettingsClient({
  student,
  siblings,
  academyProfile,
}: PortalSettingsClientProps) {
  const handleLogout = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    signOut({ callbackUrl: `${origin}/login` });
  };

  const handleSwitchSibling = async (siblingId: string) => {
    try {
      const res = await generateSiblingSwitchTokenAction(siblingId);
      if (res.success && res.token) {
        await signIn("credentials", {
          email: "sibling_switch_token",
          password: res.token,
          callbackUrl: "/portal",
          redirect: true
        });
      } else {
        alert(res.message || "Failed to generate switch token");
      }
    } catch (err) {
      console.error(err);
      alert("Error switching profiles");
    }
  };

  return (
    <SettingsTab
      student={student}
      siblings={siblings}
      academyProfile={academyProfile}
      onLogout={handleLogout}
      onSwitchSibling={handleSwitchSibling}
    />
  );
}
