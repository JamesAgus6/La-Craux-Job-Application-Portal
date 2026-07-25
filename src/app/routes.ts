import { createBrowserRouter } from "react-router";
import { ApplicantPortal } from "./App";
import { AdminRoute } from "./App";

export const router = createBrowserRouter([
  { path: "/",      Component: ApplicantPortal },
  { path: "/admin", Component: AdminRoute      },
  { path: "*",      Component: ApplicantPortal },
]);
