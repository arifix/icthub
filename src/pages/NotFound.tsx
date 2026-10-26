import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

const NotFound: React.FC = () => {
  useEffect(() => {
    document.title = "Page not found — ICTHub";
  }, []);

  return (
    <div className="grid min-h-[70vh] place-items-center bg-canvas px-4 py-16">
      <div className="text-center">
        <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent-ink">
          <Compass className="h-7 w-7" />
        </span>
        <p className="eyebrow">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">This page doesn't exist</h1>
        <p className="mx-auto mt-2 max-w-sm text-ink-subtle">
          The link may be broken, or the content was moved or unpublished.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="btn-primary">
            Go home
          </Link>
          <Link to="/notes" className="btn-secondary">
            Browse notes
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
