// Role-based access control hook
// Roles: admin | account | audit | employee

export const useRole = () => {
  const role = localStorage.getItem('userRole') || 'employee';

  return {
    role,
    isAdmin:        role === 'admin',
    isAccount:      role === 'account' || role === 'audit',
    isEmployee:     role === 'employee',
    // Permission checks
    canAccessSettings:    role === 'admin',
    canAccessRoomDetails: role === 'admin',
    canEditDelete:        role === 'admin',
    canCreateDeleteUsers: role === 'admin',
    canEditSalary:        role === 'admin',
    canEditContact:       role === 'admin',
    canPrintDGList:       role === 'admin',
    canManageExpenseCategories: role === 'admin',
    // Account/Audit can access everything except Settings
    canAccessAccount:     role === 'admin' || role === 'account' || role === 'audit',
    canAccessReports:     role === 'admin' || role === 'account' || role === 'audit',
  };
};
