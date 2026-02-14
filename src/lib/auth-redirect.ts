export function getDashboardPathForRole(role?: string | null) {
  const normalizedRole = (role ?? "").toLowerCase();

  if (normalizedRole === "student") {
    return "/dashboard/student";
  }

  if (normalizedRole === "admin" || normalizedRole === "super_admin") {
    return "/dashboard/admin";
  }

  if (normalizedRole === "mentor") {
    return "/dashboard/mentor";
  }

  if (normalizedRole === "donor") {
    return "/dashboard/donor";
  }

  if (normalizedRole === "employer") {
    return "/dashboard/employer";
  }

  if (normalizedRole === "ngo") {
    return "/dashboard/ngo";
  }

  if (normalizedRole === "parent") {
    return "/dashboard/parent";
  }

  return "/dashboard/student";
}
