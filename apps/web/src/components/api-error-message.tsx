import type { ApiError } from "@/lib/types";

interface Props {
  error: ApiError | Error | string;
}

export function ApiErrorMessage({ error }: Props) {
  let message: string;
  let statusCode: number | undefined;

  if (typeof error === "string") {
    message = error;
  } else if ("statusCode" in error) {
    statusCode = error.statusCode;
    message = Array.isArray(error.message)
      ? error.message.join(", ")
      : error.message;
  } else {
    message = error.message;
  }

  if (message === "Unable to reach server" || !message) {
    message = "Unable to reach server. Please check your connection.";
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {statusCode && (
        <span className="mr-1 font-semibold">{statusCode}:</span>
      )}
      {message}
    </div>
  );
}
