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
import { layerConfig } from "../lib/utils";
import "./MapView.css";

const getFeatureName = (props) =>
  props?.LAYOUT_NAM || props?.["Name of Layout"] || props?.vil_eng || props?.name || "Unknown";

const defaultStyle = {
  color: "#888888",
  weight: 1,
  opacity: 0.6,
  fillColor: "#888888",
  fillOpacity: 0.1
};

const getFeatureStyle = (feature) => {
  const folder = feature.properties?.folder;
  return layerConfig[folder] || defaultStyle;
};

// Component to fly to a selected layout's bounds
function FlyToLayout({ selectedLayout, boundaries }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedLayout || !boundaries) return;

    let combinedBounds = null;
    for (const feature of boundaries.features) {
      const props = feature.properties || {};
      const name = getFeatureName(props);
      if (name === selectedLayout.name && props.folder === selectedLayout.folder) {
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
      map.flyToBounds(combinedBounds, {
        padding: [200, 200],
        maxZoom: 16,
        duration: 0.8
      });
    }
  }, [selectedLayout, boundaries, map]);

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

function MapView({ mapViewMode = "street", mapExpanded = false, boundaries = null, selectedLayout = null, onLayoutSelect = null }) {
  const defaultCenter = [12.9716, 77.5946];
  const defaultZoom = 12;

  const maxBounds = [
    [12.5, 77.0],
    [13.5, 78.0]
  ];

  const isResizingRef = useRef(false);
  const mapRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  const [hiddenFolders, setHiddenFolders] = useState(new Set());

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

  const visibleBoundaries = useMemo(() => {
    if (!boundaries || hiddenFolders.size === 0) return boundaries;
    return {
      ...boundaries,
      features: boundaries.features.filter(
        (f) => !hiddenFolders.has(f.properties?.folder)
      )
    };
  }, [boundaries, hiddenFolders]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

      {/* Render layout boundary outlines from KML */}
      {visibleBoundaries && visibleBoundaries.features && visibleBoundaries.features.length > 0 && (
        <GeoJSON
          key={`layout-boundaries-${[...hiddenFolders].sort().join(",")}`}
          data={visibleBoundaries}
          style={getFeatureStyle}
          onEachFeature={(feature, layer) => {
            const props = feature.properties || {};
            const folder = props.folder || "";
            const name = getFeatureName(props);
            layer.bindTooltip(
              `<strong>${name}</strong><br/><em>${folder}</em>`,
              { sticky: true }
            );
            layer.on("click", () => {
              if (onLayoutSelect) {
                onLayoutSelect({ name, folder });
              }
            });
          }}
        />
      )}

      <FlyToLayout selectedLayout={selectedLayout} boundaries={boundaries} />
      <MapResizeHandler
        mapExpanded={mapExpanded}
        isResizingRef={isResizingRef}
      />
      <div className="map-legend">
        {Object.entries(layerConfig).map(([name, style]) => {
          const hidden = hiddenFolders.has(name);
          return (
            <div
              key={name}
              className={`map-legend-item ${hidden ? "map-legend-item-hidden" : ""}`}
              onClick={() => toggleFolder(name)}
            >
              <span
                className="map-legend-swatch"
                style={{ background: hidden ? "#ccc" : style.color }}
              />
              <span>{name}</span>
            </div>
          );
        })}
      </div>
    </MapContainer>
  );
}

export default MapView;
