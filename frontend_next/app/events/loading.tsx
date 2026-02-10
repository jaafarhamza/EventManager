export default function EventsLoading() {
  return (
    <main className="min-h-screen pt-20">
      {/* Page Header Skeleton */}
      <section className="bg-linear-to-br from-(--color-primary)/10 to-(--color-tertiary)/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="h-12 w-96 bg-(--color-muted) rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-[600px] bg-(--color-muted) rounded-lg mx-auto animate-pulse" />
        </div>
      </section>

      {/* Content Skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Skeleton */}
          <aside className="lg:col-span-1">
            <div className="h-8 w-32 bg-(--color-muted) rounded-lg mb-4 animate-pulse" />
            <div className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6 space-y-6">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-(--color-muted) rounded animate-pulse" />
                <div className="h-10 bg-(--color-muted) rounded-lg animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-(--color-muted) rounded animate-pulse" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-(--color-muted) rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Events Grid Skeleton */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <div className="h-8 w-64 bg-(--color-muted) rounded-lg mb-2 animate-pulse" />
              <div className="h-5 w-48 bg-(--color-muted) rounded animate-pulse" />
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-(--color-card) border border-(--color-border) rounded-2xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-6 w-3/4 bg-(--color-muted) rounded animate-pulse" />
                    <div className="h-6 w-16 bg-(--color-muted) rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-(--color-muted) rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-(--color-muted) rounded animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="h-4 w-full bg-(--color-muted) rounded animate-pulse" />
                    ))}
                  </div>
                  <div className="h-2 w-full bg-(--color-muted) rounded-full animate-pulse" />
                  <div className="h-10 w-full bg-(--color-muted) rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
