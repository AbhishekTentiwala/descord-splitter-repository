"use client";

import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export const roleIconMap = {
  Guest: null,
  Moderater: <ShieldCheck className="h-4 w-4 ml-2 text-indigo-500" />,
  Admin: <ShieldAlert className="h-4 w-4 ml-2 text-rose-500" />,
};

export const roleHierarchy = {
  Guest: 0,
  Moderater: 1,
  Admin: 2,
};