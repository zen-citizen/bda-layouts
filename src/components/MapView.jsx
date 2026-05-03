import { useEffect, useRef, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  ZoomControl,
  GeoJSON
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Check } from "lucide-react";
import { folders, layerConfig } from "../lib/utils";
import "./MapView.css";

const getFeatureName = (props) =>
  props?.LAYOUT_NAM ||
  props?.["Name of Layout"] ||
  props?.vil_eng ||
  props?.name ||
  "Unknown";

const defaultStyle = {
  color: "#888888",
  weight: 1,
  opacity: 0.6,
  fillColor: "#888888",
  fillOpacity: 0.1
};

const getFeatureStyle = (feature, selectedLayout) => {
  const folder = feature.properties?.folder;
  const style = layerConfig[folder] || defaultStyle;

  if (selectedLayout) {
    const props = feature.properties || {};
    const name = getFeatureName(props);
    if (
      name === selectedLayout.name &&
      props.folder === selectedLayout.folder
    ) {
      return {
        color: "#000000",
        weight: 3,
        opacity: 1,
        fillColor: style.color,
        fillOpacity: style.fillOpacity
      };
    }
  }

  return style;
};

// Component to fly to a selected layout's bounds
function FlyToLayout({ selectedLayout, boundaries, isMobile }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedLayout || !boundaries) return;

    let combinedBounds = null;
    for (const feature of boundaries.features) {
      const props = feature.properties || {};
      const name = getFeatureName(props);
      if (
        name === selectedLayout.name &&
        props.folder === selectedLayout.folder
      ) {
        const tempLayer = L.geoJSON(feature);
        const featureBounds = tempLayer.getBounds();
        if (featureBounds.isValid()) {
          combinedBounds = combinedBounds
            ? combinedBounds.extend(featureBounds)
            : featureBounds;
        }
      }
    }

    if (combinedBounds) {
      const padding = isMobile ? [50, 50] : [200, 200];
      const maxZoom = isMobile ? 17 : 16;
      map.flyToBounds(combinedBounds, {
        padding,
        maxZoom,
        duration: 0.5
      });
    }
  }, [selectedLayout, boundaries, map, isMobile]);

  return null;
}

// Component to handle map resize when container size changes
function MapResizeHandler({ mapExpanded, isResizingRef }) {
  const map = useMap();
  const clearTimerRef = useRef(null);

  useEffect(() => {
    // Set resize flag to prevent animations during resize
    if (isResizingRef) {
      isResizingRef.current = true;
    }

    // Clear any existing clearTimer from previous effect run
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    // Small delay to ensure CSS transition completes
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (error) {
        console.warn("Map resize error:", error);
      }

      // Clear resize flag after a short delay to allow map to stabilize
      clearTimerRef.current = setTimeout(() => {
        if (isResizingRef) {
          isResizingRef.current = false;
        }
        clearTimerRef.current = null;
      }, 100);
    }, 350); // Slightly longer than CSS transition (300ms)

    return () => {
      clearTimeout(timer);
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      // Ensure flag is cleared on unmount
      if (isResizingRef) {
        isResizingRef.current = false;
      }
    };
  }, [mapExpanded, map, isResizingRef]);

  return null;
}

const showMetadataConditionally = (feature) => {
  let html = "";
  if (feature.properties.Taluk) {
    html += `<br /><span>Taluk:&nbsp;</span><span>${feature.properties.Taluk}</span>`;
  }
  if (feature.properties.Hobli) {
    html += `<br /><span>Hobli:&nbsp;</span><span>${feature.properties.Hobli}</span>`;
  }
  if (feature.properties.Village) {
    html += `<br /><span>Village:&nbsp;</span><span>${feature.properties.Village}</span>`;
  }
  return html;
};

function MapView({
  mapViewMode = "street",
  mapExpanded = false,
  boundaries = null,
  selectedLayout = null,
  onLayoutSelect = null
}) {
  const defaultCenter = [12.9716, 77.5946];
  const defaultZoom = 12;

  const maxBounds = [
    [12.5, 77.0],
    [13.5, 78.0]
  ];

  const isResizingRef = useRef(false);
  const mapRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  const [hiddenFolders, setHiddenFolders] = useState(new Set(["BDA Boundary"]));

  const toggleFolder = (folder) => {
    setHiddenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  };

  const NON_INTERACTIVE_FOLDERS = new Set(["BDA Boundary"]);

  const boundariesByFolder = useMemo(() => {
    if (!boundaries || !boundaries.features) return {};

    const grouped = {};
    for (const feature of boundaries.features) {
      const folder = feature.properties?.folder;
      if (!folder) continue;

      if (hiddenFolders.has(folder)) continue;

      if (!grouped[folder]) {
        grouped[folder] = { type: "FeatureCollection", features: [] };
      }
      grouped[folder].features.push(feature);
    }
    return grouped;
  }, [boundaries, hiddenFolders]);

  const sortedFolders = useMemo(() => {
    return Object.keys(boundariesByFolder).sort((a, b) => {
      const orderA = layerConfig[a]?.order ?? 999;
      const orderB = layerConfig[b]?.order ?? 999;
      return orderA - orderB;
    });
  }, [boundariesByFolder]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (selectedLayout?.folder) {
      setHiddenFolders((prev) => {
        const next = new Set(prev);
        next.delete(selectedLayout.folder);
        return next;
      });
    }
  }, [selectedLayout]);

  const tileConfig = useMemo(() => {
    if (mapViewMode === "satellite") {
      // Use shorter attribution text on mobile
      const attribution = isMobile
        ? "Tiles &copy; Esri"
        : "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

      return {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution,
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0
      };
    }
    return {
      url: "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
      attribution: `&copy; Carto.com Basemaps`,
      // url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      // attribution:
      //   '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      tileSize: 256,
      zoomOffset: 0
    };
  }, [mapViewMode, isMobile]);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
      className={`map-container ${
        mapViewMode === "satellite" ? "satellite-view" : ""
      }`}
      scrollWheelZoom={true}
      zoomControl={false}
      ref={mapRef}
    >
      <ZoomControl position="topright" />
      <TileLayer
        attribution={tileConfig.attribution}
        url={tileConfig.url}
        maxZoom={tileConfig.maxZoom}
        tileSize={tileConfig.tileSize}
        zoomOffset={tileConfig.zoomOffset}
        errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      />

      {/* Render layout boundary outlines from KML grouped by folder */}
      {sortedFolders.map((folder) => {
        const isNonInteractive = NON_INTERACTIVE_FOLDERS.has(folder);
        return (
          <GeoJSON
            key={`layout-boundaries-${folder}`}
            data={boundariesByFolder[folder]}
            style={(feature) => getFeatureStyle(feature, selectedLayout)}
            interactive={!isNonInteractive}
            onEachFeature={(feature, layer) => {
              if (isNonInteractive) return;

              const props = feature.properties || {};
              const folderLabel = layerConfig[props.folder]?.label || "";
              const name = getFeatureName(props);
              layer.bindTooltip(
                `
                  <strong class="tooltip">${name}</strong>
                  <br/>
                  <em>${folderLabel}</em>
                  ${showMetadataConditionally(feature)}
                `,
                { sticky: true }
              );
              layer.on("click", () => {
                if (onLayoutSelect) {
                  onLayoutSelect({ name, folder: props.folder });
                }
              });
            }}
          />
        );
      })}

      <FlyToLayout
        selectedLayout={selectedLayout}
        boundaries={boundaries}
        isMobile={isMobile}
      />
      <MapResizeHandler
        mapExpanded={mapExpanded}
        isResizingRef={isResizingRef}
      />
      <div className="map-legend">
        {Object.entries(layerConfig)
          .filter((a) => !["Unauthorized", "BDA Boundary"].includes(a[0]))
          .sort(([n1, { order: ord1 }], [n2, { order: ord2 }]) =>
            ord1 < ord2 ? -1 : 1
          )
          .map(([name, style]) => {
            const hidden = hiddenFolders.has(name);
            return (
              <div
                key={name}
                className={`map-legend-item ${
                  hidden ? "map-legend-item-hidden" : ""
                }`}
                onClick={() => toggleFolder(name)}
              >
                <span
                  className="map-legend-swatch"
                  style={{ background: hidden ? "#ccc" : style.color }}
                >
                  {!hidden && (
                    <Check
                      size={10}
                      strokeWidth={3}
                      color={layerConfig[name]?.textColor}
                    />
                  )}
                </span>
                <span>
                  {name === "BDA Boundary"
                    ? "Show BDA boundary"
                    : layerConfig[name]?.label}
                </span>
              </div>
            );
          })}
        {Object.entries(layerConfig)
          .filter((a) => ["BDA Boundary"].includes(a[0]))
          .map(([name, style]) => {
            const hidden = hiddenFolders.has(name);
            return (
              <div
                key={name}
                className={`map-legend-item ${
                  hidden ? "map-legend-item-hidden" : ""
                }`}
                onClick={() => toggleFolder(name)}
              >
                <span
                  className="map-legend-swatch"
                  style={{ background: hidden ? "#ccc" : style.color }}
                >
                  {!hidden && (
                    <Check
                      size={10}
                      strokeWidth={3}
                      color={layerConfig[name]?.textColor}
                    />
                  )}
                </span>
                <span>
                  {name === "BDA Boundary"
                    ? "Show BDA boundary"
                    : layerConfig[name]?.label}
                </span>
              </div>
            );
          })}
      </div>
    </MapContainer>
  );
}

export default MapView;
