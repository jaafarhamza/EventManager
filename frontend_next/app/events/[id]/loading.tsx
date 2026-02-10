export default function EventDetailLoading() {
  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumb Skeleton */}
        <div className="mb-8 flex items-center gap-2">
          <div className="h-4 w-16 bg-(--color-muted) rounded animate-pulse" />
          <div className="h-4 w-4 bg-(--color-muted) rounded animate-pulse" />
          <div className="h-4 w-24 bg-(--color-muted) rounded animate-pulse" />
          <div className="h-4 w-4 bg-(--color-muted) rounded animate-pulse" />
          <div className="h-4 w-32 bg-(--color-muted) rounded animate-pulse" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Header Skeleton */}
            <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="h-10 w-3/4 bg-(--color-muted) rounded-lg animate-pulse" />
                <div className="h-8 w-24 bg-(--color-muted) rounded-full animate-pulse" />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-(--color-muted) rounded-lg animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-16 bg-(--color-muted) rounded animate-pulse" />
                      <div className="h-5 w-32 bg-(--color-muted) rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-(--color-muted) rounded animate-pulse" />
                  <div className="h-4 w-24 bg-(--color-muted) rounded animate-pulse" />
                </div>
                <div className="h-3 w-full bg-(--color-muted) rounded-full animate-pulse" />
                <div className="h-3 w-24 bg-(--color-muted) rounded animate-pulse ml-auto" />
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-8 space-y-4">
              <div className="h-8 w-64 bg-(--color-muted) rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-(--color-muted) rounded animate-pulse" />
                <div className="h-4 w-full bg-(--color-muted) rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-(--color-muted) rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6 space-y-6">
                <div className="h-7 w-32 bg-(--color-muted) rounded-lg animate-pulse" />
                <div className="h-12 w-full bg-(--color-muted) rounded-lg animate-pulse" />
              </div>

              <div className="bg-(--color-primary)/5 border border-(--color-primary)/20 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-(--color-muted) rounded animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-48 bg-(--color-muted) rounded animate-pulse" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-4 w-full bg-(--color-muted) rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
