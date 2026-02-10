"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { clearUser } from "@/lib/store/slices/authSlice";
import { authApi } from "@/lib/api";

const navigation = [{ name: "Events", href: "/events" }];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      dispatch(clearUser());
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(clearUser());
      router.push("/");
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-(--color-background)/80 backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-(--color-primary) to-(--color-tertiary) flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-xl bg-linear-to-br from-(--color-primary) to-(--color-tertiary) blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="text-xl font-(family-name:--font-mclaren) font-bold text-(--color-foreground) hidden sm:block">
              EventHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-(--color-primary)"
                      : "text-(--color-muted-foreground) hover:text-(--color-foreground)"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-(--color-primary) rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg">
                    {user?.picture ? (
                      <Image
                        src={user.picture}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-tertiary) flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user?.firstName?.[0]}
                          {user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-medium text-(--color-foreground)">
                      {user?.firstName}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-(--color-foreground) hover:bg-(--color-muted) transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 transition-transform group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-(--color-foreground) hover:bg-(--color-muted) transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 transition-transform group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sign In</span>
                  </Link>

                  <Link
                    href="/register"
                    className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-(--color-tertiary) text-(--color-primary-foreground) hover:opacity-90 transition-all duration-200 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-linear-to-r from-(--color-primary) to-(--color-tertiary) opacity-0 group-hover:opacity-100 transition-opacity" />
                    <svg
                      className="w-4 h-4 relative z-10 transition-transform group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span className="relative z-10">Get Started</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-(--color-foreground) hover:bg-(--color-muted) transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-(--color-primary)/10 text-(--color-primary)"
                      : "text-(--color-muted-foreground) hover:bg-(--color-muted) hover:text-(--color-foreground)"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Mobile Auth Buttons */}
            <div className="pt-4 space-y-3 border-t border-(--color-border)">
              {isAuthenticated ? (
                <>
                  {/* User Info Mobile */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-(--color-muted)">
                    {user?.picture ? (
                      <Image
                        src={user.picture}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-(--color-primary) to-(--color-tertiary) flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user?.firstName?.[0]}
                          {user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-(--color-foreground)">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-(--color-muted-foreground)">
                        {user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Logout Button Mobile */}
                  <button
                    onClick={handleLogout}
                    className="group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium border border-(--color-border) text-(--color-foreground) hover:bg-(--color-muted) transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 transition-transform group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium border border-(--color-border) text-(--color-foreground) hover:bg-(--color-muted) transition-all duration-200"
                  >
                    <svg
                      className="w-4 h-4 transition-transform group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sign In</span>
                  </Link>

                  <Link
                    href="/register"
                    className="group relative flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium bg-(--color-tertiary) text-(--color-primary-foreground) hover:opacity-90 transition-all duration-200 overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-linear-to-r from-(--color-primary) to-(--color-tertiary) opacity-0 group-hover:opacity-100 transition-opacity" />
                    <svg
                      className="w-4 h-4 relative z-10 transition-transform group-hover:scale-110"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span className="relative z-10">Get Started</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
