import { createBrowserRouter } from "react-router";
import { ApplicantPortal } from "./App";
import { AdminDashboard } from "./App";

export const router = createBrowserRouter([
  { path: "/",      Component: ApplicantPortal },
  { path: "/admin", Component: AdminDashboard  },
  { path: "*",      Component: ApplicantPortal },
]);
