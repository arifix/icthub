import React from "react";

type State = { error: Error | null };

/** Catches render errors and failed lazy-chunk loads (e.g. after a redeploy). */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isChunkError = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(
      error.message,
    );

    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div role="alert" className="card max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold text-ink">
            {isChunkError ? "A new version is available" : "Something went wrong"}
          </h1>
          <p className="mt-2 text-sm text-ink-subtle">
            {isChunkError
              ? "ICTHub was updated while you had it open. Reload to get the latest version."
              : "An unexpected error occurred. Reloading the page usually fixes it."}
          </p>
          <button type="button" className="btn-primary mt-6" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
