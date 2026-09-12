import { useJsonCollection } from "./useJsonCollection";

// Employee adjustments are now server-only.
export function useEmployeeAdjustments(options = {}) {
  return useJsonCollection("employeeAdjustments", options);
}
