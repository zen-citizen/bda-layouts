import { useTranslation } from 'react-i18next'
import { getSessionDate, toTitleCase, normalizeLayoutName } from '../lib/utils'
import { Info } from 'lucide-react'
import AreaIcon from './icons/AreaIcon'
import SitesIcon from './icons/SitesIcon'
import './SiteList.css'

function SiteList({ sites, selectedSite, onSiteSelect, mapViewMode, setMapViewMode }) {
  const { t } = useTranslation()
  
  return (
    <div className="site-list">
      <div className="site-list-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#4B2840', display: 'inline-flex', alignItems: 'center' }}>
            <SitesIcon size={32} />
          </span>
          {t('siteList.title')} ({sites.length})
          <span className="info-tooltip-wrapper">
            <Info size={14} className="info-icon" />
            <span className="info-tooltip">{t('mapPage.mapView.tooltip')}</span>
          </span>
        </h3>
        {mapViewMode !== undefined && setMapViewMode && (
          <div className="map-view-toggle-mobile" role="group" aria-label="Map view mode">
            <button
              type="button"
              className={`map-view-toggle-button ${mapViewMode === 'street' ? 'active' : ''}`}
              onClick={() => setMapViewMode('street')}
              aria-pressed={mapViewMode === 'street'}
            >
              {t('mapPage.mapView.map')}
            </button>
            <button
              type="button"
              className={`map-view-toggle-button ${mapViewMode === 'satellite' ? 'active' : ''}`}
              onClick={() => setMapViewMode('satellite')}
              aria-pressed={mapViewMode === 'satellite'}
            >
              {t('mapPage.mapView.satellite')}
            </button>
          </div>
        )}
      </div>
      <div className="site-list-content">
        {sites.length === 0 ? (
          <div className="no-sites">{t('siteList.noSites')}</div>
        ) : (
          sites.map(site => (
            <div
              key={site.slNo}
              className={`site-item ${selectedSite?.slNo === site.slNo ? 'selected' : ''}`}
              onClick={() => onSiteSelect(site)}
              data-site-id={site.slNo}
            >
              <div className="site-item-header">
                <span className="site-number">{t('siteList.siteNumber')}{site.slNo}</span>
                <span className="site-session">{getSessionDate(site.biddingSession)}</span>
              </div>
              <div className="site-item-layout">
                {site.layoutDetails 
                  ? toTitleCase(normalizeLayoutName(site.layoutDetails.split(',')[0].trim()))
                  : toTitleCase(site.layout)}
              </div>
              <div className="site-item-details">
                <span>{t('siteDetails.basicInfo.siteNo')} {site.siteNo}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ color: '#4B2840' }}>
                    <AreaIcon size={20} />
                  </span>
                  {t('siteList.totalArea')} {site.totalArea} sq.m
                </span>
              </div>
              {!site.hasCoordinates && (
                <div className="site-item-warning">{t('siteList.noCoordinates')}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SiteList
