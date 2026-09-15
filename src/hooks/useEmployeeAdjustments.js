import { useJsonCollection } from "./useJsonCollection";

// Employee adjustments are now VPS server-only.
export function useEmployeeAdjustments(options = {}) {
  return useJsonCollection("employeeAdjustments", options);
}
