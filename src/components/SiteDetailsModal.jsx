import { useTranslation } from 'react-i18next'
import { getSessionDate } from '../lib/utils'
import { ExternalLink } from 'lucide-react'
import AreaIcon from './icons/AreaIcon'
import PhoneIcon from './icons/PhoneIcon'
import EWIcon from './icons/EWIcon'
import NSIcon from './icons/NSIcon'
import './SiteDetailsModal.css'

// Helper function to format phone number
function formatPhoneNumber(value) {
  if (!value || value === '' || value === 'NA') return null
  const cleaned = value.toString().trim()
  return cleaned
}

// Version: 2025-01-27 - All CSV fields always visible
function SiteDetailsModal({ site, onClose }) {
  const { t } = useTranslation()
  
  if (!site) return null

  const contactNumber = formatPhoneNumber(site.contactNumber)
  const googleMapsLink = site.googleMapsLink && site.googleMapsLink !== 'NA' && site.googleMapsLink.trim() !== '' 
    ? site.googleMapsLink 
    : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header-sticky">
          <h2>{t('siteDetails.title')}</h2>
          <div className="modal-site-number">{t('siteList.siteNumber')}{site.slNo}</div>
        </div>
        
        <div className="site-details">
          {/* Basic Information Section */}
          <div className="detail-section">
            <h3 className="section-title">{t('siteDetails.basicInfo.title')}</h3>
            <div className="detail-row">
              <span className="detail-label">
                {googleMapsLink ? (
                  <a 
                    href={googleMapsLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link-external"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ExternalLink size={16} />
                    {t('siteDetails.basicInfo.viewOnGoogleMaps')}
                  </a>
                ) : (
                  <span style={{ color: '#666', fontStyle: 'italic' }}>{t('siteDetails.basicInfo.googleMapsUnavailable')}</span>
                )}
              </span>
              <span className="detail-value"></span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t('siteDetails.basicInfo.biddingRound')}</span>
              <span className="detail-value">{getSessionDate(site.biddingSession)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t('siteDetails.basicInfo.siteNo')}</span>
              <span className="detail-value">{site.siteNo || t('common.labels.nA')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t('siteDetails.basicInfo.layoutDetails')}</span>
              <span className="detail-value">{site.layoutDetails || site.layout || t('common.labels.nA')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t('siteDetails.basicInfo.surveyNo')}</span>
              <span className="detail-value">{site.surveyNo || t('common.labels.nA')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t('siteDetails.basicInfo.ratePerSqM')}</span>
              <span className="detail-value">
                {(() => {
                  try {
                    if (!site.ratePerSqMtr || site.ratePerSqMtr === 'NA' || site.ratePerSqMtr.trim() === '') {
                      return t('common.labels.nA')
                    }
                    const rate = parseFloat(site.ratePerSqMtr)
                    if (isNaN(rate)) {
                      return t('common.labels.nA')
                    }
                    return `₹${rate.toLocaleString('en-IN')}`
                  } catch {
                    return t('common.labels.nA')
                  }
                })()}
              </span>
            </div>
          </div>

          {/* Dimensions Section */}
          <div className="detail-section">
            <h3 className="section-title">{t('siteDetails.dimensions.title')}</h3>
            <div className="detail-row">
              <span className="detail-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#4B2840' }}>
                  <AreaIcon size={22} />
                </span>
                {t('siteDetails.dimensions.totalArea')}
              </span>
              <span className="detail-value">{site.totalArea ? `${site.totalArea} sq.m` : t('common.labels.nA')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t('siteDetails.dimensions.siteShape')}</span>
              <span className="detail-value">{site.siteSize || t('common.labels.nA')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">{t('siteDetails.dimensions.type')}</span>
              <span className="detail-value">{site.type || t('common.labels.nA')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#4B2840' }}>
                  <EWIcon size={22} />
                </span>
                {t('siteDetails.dimensions.eToW')}
              </span>
              <span className="detail-value">{site.eToW ? `${site.eToW} m` : t('common.labels.nA')}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ color: '#4B2840' }}>
                  <NSIcon size={22} />
                </span>
                {t('siteDetails.dimensions.nToS')}
              </span>
              <span className="detail-value">{site.nToS ? `${site.nToS} m` : t('common.labels.nA')}</span>
            </div>
          </div>

          {/* Site Information Coordinator */}
          <div className="detail-section">
            <div className="detail-row">
              <span className="detail-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                {contactNumber && <PhoneIcon size={20} />}
                {t('siteDetails.coordinator.title')}
              </span>
              <span className="detail-value">
                {contactNumber ? (
                  <a href={`tel:+91${contactNumber}`} className="link-phone">
                    +91 {contactNumber}
                  </a>
                ) : (
                  t('common.labels.nA')
                )}
              </span>
            </div>
          </div>

        </div>

        <div className="modal-footer-sticky">
          <a 
            href="https://kppp.karnataka.gov.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-primary"
          >
            {t('common.buttons.goToPortal')}
          </a>
        </div>
      </div>
    </div>
  )
}

export default SiteDetailsModal
