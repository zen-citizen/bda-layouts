import { useState, useEffect, useMemo, useRef } from "react";
import { Menu, X, Search, Info } from "lucide-react";
import MapView from "../components/MapView";
import { layerConfig } from "../lib/utils";
import { parseKML } from "../lib/kmlParser";
import AboutDialog from "../components/AboutDialog";
import "./MapPage.css";

function MapPage() {
  const [mapViewMode, setMapViewMode] = useState("street");
  const [boundaries, setBoundaries] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [folderFilter, setFolderFilter] = useState("");
  const sidebarListRef = useRef(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  // Scroll the active item into view when selectedLayout changes
  useEffect(() => {
    if (!selectedLayout || !sidebarListRef.current) return;
    const active = sidebarListRef.current.querySelector(
      ".sidebar-layout-item.active"
    );
    if (active) {
      active.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedLayout]);

  // Load KML data at page level so sidebar + map can share it
  useEffect(() => {
    const load = async () => {
      try {
        const [allottedRes, approvedRes, unauthRes] = await Promise.allSettled([
          fetch("/allotted-layouts.kml"),
          fetch("/approved-layouts.kml"),
          fetch("/unauthorized-layouts.kml")
        ]);
        const combined = await Promise.all([
          allottedRes?.value?.text(),
          approvedRes?.value?.text(),
          unauthRes?.value?.text()
        ]);
        const geoJson = combined.reduce(
          (acc, curr) => {
            const { features } = parseKML(curr);
            return { ...acc, features: acc.features.concat(features) };
          },
          { type: "FeatureCollection", features: [] }
        );
        if (geoJson?.features?.length > 0) {
          setBoundaries(geoJson);
        }
        console.log(geoJson);
      } catch (e) {
        console.log(
          "Error when reading/parsing/transforming KML to GeoJSON",
          e
        );
      }
    };
    load();
  }, []);

  // Extract unique layout names grouped by folder
  const layoutsByFolder = useMemo(() => {
    if (!boundaries) return {};
    const grouped = {};
    for (const feature of boundaries.features) {
      const folder = feature.properties?.folder || "Other";
      const name =
        feature.properties?.LAYOUT_NAM ||
        feature.properties?.["Name of Layout"] ||
        feature.properties?.name ||
        null;
      if (!name) continue;
      if (!grouped[folder]) grouped[folder] = new Set();
      grouped[folder].add(name);
    }
    const unauth = boundaries.features.filter(
      (f) => f.properties.folder === "Unauthorized"
    );
    grouped["Unauthorized"] = unauth.map((layout, idx) => `Layout-${idx + 1}`);
    // Convert sets to sorted arrays in display order
    const folderOrder = ["Allotted", "Approved", "Unauthorized"];
    const result = {};
    for (const folder of folderOrder) {
      if (grouped[folder]) {
        result[folder] = Array.from(grouped[folder]).sort();
      }
    }
    return result;
  }, [boundaries]);

  const filteredLayoutsByFolder = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = {};
    for (const [folder, names] of Object.entries(layoutsByFolder)) {
      if (folderFilter && folder !== folderFilter) continue;
      const filtered = query
        ? names.filter((name) => name.toLowerCase().includes(query))
        : names;
      if (filtered.length > 0) {
        result[folder] = filtered;
      }
    }
    return result;
  }, [layoutsByFolder, searchQuery, folderFilter]);

  const sidebarFooter = (
    <div className="sidebar-footer flex items-center justify-between">
      <span>
        Data Source:{" "}
        <a
          href="https://bdakarnataka.in"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-footer-link"
        >
          BDA
        </a>
      </span>
      <button
        className="sidebar-footer-link inline-flex items-center gap-1"
        onClick={() => setAboutOpen(true)}
      >
        <Info size={14} />
        More info
      </button>
    </div>
  );

  const sidebarContent = (
    <>
      <div className="sidebar-header">
        <h1 className="sidebar-title">BDA Layouts</h1>
      </div>
      <div className="sidebar-search">
        <Search size={16} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder="Search layouts..."
          className="sidebar-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="sidebar-filter">
        <select
          className="sidebar-filter-select"
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
        >
          <option value="">All Layouts</option>
          {Object.entries(layerConfig)
            .sort(([, a], [, b]) => a.order - b.order)
            .map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
        </select>
      </div>
      <div className="sidebar-list" ref={sidebarListRef}>
        {Object.keys(filteredLayoutsByFolder).length === 0 ? (
          <div className="sidebar-no-results">No layout/region found.</div>
        ) : (
          Object.entries(filteredLayoutsByFolder).map(([folder, names]) => (
            <div key={folder} className="sidebar-folder">
              <div
                className="sidebar-folder-header"
                style={{
                  color: layerConfig[folder]?.textColor,
                  backgroundColor: layerConfig[folder]?.color
                }}
              >
                {layerConfig[folder]?.label}
              </div>
              {names.map((name) => (
                <div
                  key={name}
                  className={`sidebar-layout-item ${
                    selectedLayout?.name === name &&
                    selectedLayout?.folder === folder
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setSelectedLayout({ name, folder });
                    setMenuOpen(false);
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
      {sidebarFooter}
    </>
  );

  return (
    <div className="map-page">
      {/* Desktop sidebar */}
      <aside className="sidebar">{sidebarContent}</aside>

      {/* Mobile collapsed sidebar */}
      <div className="sidebar-mobile-bar">
        <h1 className="sidebar-title">BDA Layouts</h1>
        <div className="flex items-center gap-x-4">
          <button
            className="sidebar-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Search size={22} />
          </button>
          <button
            className="sidebar-menu-button"
            onClick={() => setAboutOpen(true)}
            aria-label="More info"
          >
            <Info size={22} />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}>
          <aside
            className="sidebar-overlay-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sidebar-overlay-close">
              <button
                className="sidebar-menu-button sidebar-menu-button-mobile"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Map */}
      <div className="map-area">
        <div
          className="map-view-toggle-floating"
          role="group"
          aria-label="Map view mode"
        >
          <button
            type="button"
            className={`map-view-toggle-button ${
              mapViewMode === "street" ? "active" : ""
            }`}
            onClick={() => setMapViewMode("street")}
          >
            Map
          </button>
          <button
            type="button"
            className={`map-view-toggle-button ${
              mapViewMode === "satellite" ? "active" : ""
            }`}
            onClick={() => setMapViewMode("satellite")}
          >
            Satellite
          </button>
        </div>

        {/* Mobile floating search button - only show when sidebar is closed */}
        {!menuOpen && (
          <button
            className="mobile-search-fab"
            onClick={() => setMenuOpen(true)}
            aria-label="Open search"
          >
            <Search size={22} />
            <span>Search</span>
          </button>
        )}

        <MapView
          mapViewMode={mapViewMode}
          boundaries={boundaries}
          selectedLayout={selectedLayout}
          onLayoutSelect={setSelectedLayout}
        />
      </div>

      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}

export default MapPage;
