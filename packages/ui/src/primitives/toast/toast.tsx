import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@bool/shared';

const ToastProvider = ToastPrimitive.Provider;

function ToastViewport({
  className,
  ref,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      ref={ref}
      className={cn(
        'fixed end-0 bottom-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-[420px]',
        className
      )}
      {...props}
    />
  );
}

const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full',
  {
    variants: {
      variant: {
        default: 'border bg-background text-foreground',
        destructive:
          'destructive group border-destructive bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Toast({
  className,
  variant,
  ref,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>) {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
}

function ToastAction({
  className,
  ref,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      ref={ref}
      className={cn(
        'border-border ring-offset-background hover:bg-secondary focus:ring-ring group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

function ToastClose({
  className,
  ref,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      ref={ref}
      className={cn(
        'text-foreground/50 hover:text-foreground absolute end-2 top-2 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 focus:opacity-100 focus:ring-2 focus:outline-none group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600',
        className
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitive.Close>
  );
}

function ToastTitle({
  className,
  ref,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title ref={ref} className={cn('text-sm font-semibold', className)} {...props} />
  );
}

function ToastDescription({
  className,
  ref,
  ...props
}: React.ComponentPropsWithRef<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      ref={ref}
      className={cn('text-sm opacity-90', className)}
      {...props}
    />
  );
}

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;
type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
};
