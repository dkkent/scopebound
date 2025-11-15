type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

type Toast = ToastProps & {
  id: string;
};

const listeners: Array<(toast: Toast) => void> = [];
let toastCount = 0;

function addListener(listener: (toast: Toast) => void) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

function emitToast(props: ToastProps) {
  const id = (++toastCount).toString();
  const toast: Toast = { ...props, id };
  listeners.forEach((listener) => listener(toast));
  return { id };
}

export function useToast() {
  return {
    toast: emitToast,
  };
}

export { addListener };
export type { Toast, ToastProps };
