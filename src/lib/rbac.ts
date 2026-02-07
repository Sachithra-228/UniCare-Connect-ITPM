import { UserRole } from "@/types";

const rolePriority: Record<UserRole, number> = {
  student: 1,
  mentor: 2,
  donor: 2,
  admin: 3,
  super_admin: 4
};

export function hasRoleAccess(userRole: UserRole, requiredRole: UserRole) {
  return rolePriority[userRole] >= rolePriority[requiredRole];
}
