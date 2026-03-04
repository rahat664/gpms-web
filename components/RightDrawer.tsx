"use client";

import CloseIcon from "@mui/icons-material/Close";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export function RightDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={() => onOpenChange(false)}
      slotProps={{
        paper: {
          className,
          sx: {
            width: "100%",
            maxWidth: 900,
            p: 3,
            backgroundImage: "none",
          },
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h6">{title}</Typography>
          {description ? <Typography variant="body2" color="text.secondary">{description}</Typography> : null}
        </Box>
        <IconButton onClick={() => onOpenChange(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ overflowY: "auto", pr: 1 }}>{children}</Box>
    </Drawer>
  );
}
