import { useState, useEffect, useRef } from "react";
import { Menu, LogOut, Search, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate, Link } from "react-router-dom";
import { searchApi, type SearchResult } from "@/api/search";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchApi.search(searchQuery);
        if (res.data.data) setSearchResults(res.data.data);
      } catch { /* ignore */ } finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const totalResults = searchResults
    ? searchResults.clients.length + searchResults.projects.length + searchResults.servers.length + searchResults.domains.length + searchResults.urls.length
    : 0;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden">
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div className="hidden lg:block">
          <WorkspaceSwitcher />
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-auto text-xs bg-white px-1.5 py-0.5 rounded border">⌘K</kbd>
        </button>

        {searchOpen && (
          <div className="absolute top-0 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="flex items-center gap-2 px-3 py-2 border-b">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients, projects, servers..."
                className="flex-1 text-sm outline-none"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults(null); }}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isSearching && <p className="p-4 text-sm text-gray-500 text-center">Searching...</p>}
              {!isSearching && searchQuery && totalResults === 0 && (
                <p className="p-4 text-sm text-gray-500 text-center">No results found.</p>
              )}
              {!isSearching && searchResults && totalResults > 0 && (
                <div className="py-2">
                  {searchResults.clients.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Clients</p>
                      {searchResults.clients.map((c) => (
                        <Link key={c.id} to={`/clients/${c.id}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                          className="block px-4 py-2 text-sm hover:bg-gray-50">
                          <span className="font-medium">{c.name}</span>
                          <span className="text-gray-500 ml-2">({c.company})</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.projects.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Projects</p>
                      {searchResults.projects.map((p) => (
                        <Link key={p.id} to={`/projects/${p.id}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                          className="block px-4 py-2 text-sm hover:bg-gray-50">
                          <span className="font-medium">{p.name}</span>
                          <span className="text-gray-500 ml-2">({p.client.name})</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.servers.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Servers</p>
                      {searchResults.servers.map((s) => (
                        <Link key={s.id} to={`/servers/${s.id}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                          className="block px-4 py-2 text-sm hover:bg-gray-50">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-gray-500 ml-2">({s.provider})</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.domains.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">Domains</p>
                      {searchResults.domains.map((d) => (
                        <Link key={d.id} to={`/domains/${d.id}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                          className="block px-4 py-2 text-sm hover:bg-gray-50">
                          <span className="font-medium">{d.domain}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.urls.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase">URLs</p>
                      {searchResults.urls.map((u) => (
                        <Link key={u.id} to={`/urls/${u.id}`} onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                          className="block px-4 py-2 text-sm hover:bg-gray-50">
                          <span className="font-medium">{u.alias || u.shortCode}</span>
                          <span className="text-gray-500 ml-2">({u.clickCount} clicks)</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="border-t px-4 py-2 text-xs text-gray-400">
              {totalResults > 0 && <span>{totalResults} results</span>}
              <span className="ml-auto">ESC to close</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-700 font-medium text-sm">{user?.name?.charAt(0) ?? "U"}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role?.replace("_", " ")}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-red-600" title="Logout">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
