import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto rounded-[20px] border border-white/10">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export const TableHeader = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...props} />;
export const TableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...props} />;
export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn("border-b border-white/5 transition-colors hover:bg-white/5", className)} {...props} />
);
export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "sticky top-0 h-11 bg-background/80 px-4 text-left align-middle font-medium text-muted-foreground backdrop-blur",
      className,
    )}
    {...props}
  />
);
export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("p-4 align-middle", className)} {...props} />
);
