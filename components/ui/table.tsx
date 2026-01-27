import * as React from 'react';

import { cn } from '@/lib/utils';

type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement> & {
  variant?: 'default' | 'alternate';
};

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  variant?: 'default' | 'alternate';
  align?: 'left' | 'center' | 'right';
};

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className='relative w-full'>
    <table
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  </div>
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }
>(({ className, sticky = false, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      '[&_tr]:border-b table-head',
      sticky && 'sticky top-0 z-10 bg-white dark:bg-[#1a1a1a]',
      className
    )}
    {...props}
  />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={className} {...props} />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      'transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted dark:border-[#FFFFFF26] table-row-style',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseStyles =
      'text-left align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] dark:border-[#FFFFFF26] dark:text-white text-[#222222]';

    const variantStyles = {
      default:
        'h-10 px-2 text-xs font-semibold tracking-[0.025em] border-right blackhole',
      alternate:
        'h-12 px-3 text-xs font-medium leading-6 tracking-[0.005em] border-r border-[#00000026] last:border-r-0',
    };

    return (
      <th
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...props}
      />
    );
  }
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, variant = 'default', align = 'left', ...props }, ref) => {
    const baseStyles =
      ' font-light align-middle blackhole contact-cell [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] dark:border-[#FFFFFF26] dark:text-white text-[#222222]';

    const variantStyles = {
      default: 'h-10 px-2 text-xs tracking-[0.025em] border-right text-left',
      alternate:
        'h-12 px-3 text-xs leading-6 tracking-[0.005em] border-r border-[#00000026] last:border-r-0',
    };

    const alignmentStyles = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return (
      <td
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          alignmentStyles[align],
          className
        )}
        {...props}
      />
    );
  }
);

TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
