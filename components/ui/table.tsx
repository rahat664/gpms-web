import * as React from "react";
import TableContainer from "@mui/material/TableContainer";
import MuiTable from "@mui/material/Table";
import MuiTableHead from "@mui/material/TableHead";
import MuiTableBody from "@mui/material/TableBody";
import MuiTableRow from "@mui/material/TableRow";
import MuiTableCell from "@mui/material/TableCell";
import Paper from "@mui/material/Paper";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.ComponentProps<typeof MuiTable>) {
  return (
    <TableContainer component={Paper} className="w-full overflow-x-auto">
      <MuiTable className={cn(className)} {...props} />
    </TableContainer>
  );
}

export const TableHeader = (props: React.ComponentProps<typeof MuiTableHead>) => (
  <MuiTableHead {...props} />
);
export const TableBody = (props: React.ComponentProps<typeof MuiTableBody>) => (
  <MuiTableBody {...props} />
);
export const TableRow = ({ className, ...props }: React.ComponentProps<typeof MuiTableRow>) => (
  <MuiTableRow className={cn(className)} {...props} />
);
export const TableHead = ({ className, ...props }: React.ComponentProps<typeof MuiTableCell>) => (
  <MuiTableCell className={cn(className)} {...props} />
);
export const TableCell = ({ className, ...props }: React.ComponentProps<typeof MuiTableCell>) => (
  <MuiTableCell className={cn(className)} {...props} />
);
