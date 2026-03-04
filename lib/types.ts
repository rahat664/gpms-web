export type RoleName =
  | "ADMIN"
  | "PLANNER"
  | "STORE"
  | "CUTTING"
  | "SUPERVISOR"
  | "QC"
  | "SHIPMENT"
  | "VIEWER";

export type Factory = {
  id: string;
  code: string;
  name: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: RoleName;
  factories: Factory[];
};
