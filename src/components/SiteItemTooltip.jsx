import { useEffect, useRef } from 'react'
import './SiteList.css'

function SiteItemTooltip({ site }) {
  const tooltipRef = useRef(null)
  const rafRef = useRef(null)
  const isVisibleRef = useRef(true)

  useEffect(() => {
    const updatePosition = () => {
      if (!tooltipRef.current || !isVisibleRef.current) return
      
      const item = document.querySelector(`[data-site-id="${site.slNo}"]`)
      if (!item) return
      
      const itemRect = item.getBoundingClientRect()
      const sidebar = item.closest('.map-page-sidebar')
      const sidebarRect = sidebar?.getBoundingClientRect()
      
      if (!sidebarRect) return
      
      // Cancel any pending animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      
      // Use requestAnimationFrame for smooth, single-frame updates
      rafRef.current = requestAnimationFrame(() => {
        if (tooltipRef.current && isVisibleRef.current) {
          const tooltipRect = tooltipRef.current.getBoundingClientRect()
          const left = sidebarRect.right + 10
          const top = itemRect.top + (itemRect.height / 2) - (tooltipRect.height / 2)
          
          tooltipRef.current.style.left = `${left}px`
          tooltipRef.current.style.top = `${top}px`
        }
      })
    }

    const handleScroll = () => {
      // Hide tooltip during scroll
      isVisibleRef.current = false
      if (tooltipRef.current) {
        tooltipRef.current.style.opacity = '0'
      }
      
      // Show again after scroll stops
      setTimeout(() => {
        isVisibleRef.current = true
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '1'
          updatePosition()
        }
      }, 150)
    }

    // Initial position
    const initialTimeout = setTimeout(updatePosition, 50)

    // Listen to scroll on the sidebar container
    const scrollContainer = document.querySelector('.site-list-content')
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    }
    
    // Update on resize
    window.addEventListener('resize', updatePosition)

    return () => {
      clearTimeout(initialTimeout)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('resize', updatePosition)
    }
  }, [site.slNo])

  return (
    <div ref={tooltipRef} className="site-item-tooltip">
      <div className="tooltip-content">
        <strong>Site #{site.slNo}</strong>
        <div>{site.layout}</div>
        <div>Site No: {site.siteNo}</div>
        <div>E to W: {site.eToW} m</div>
        <div>N to S: {site.nToS} m</div>
        <div>Total Area: {site.totalArea} sq.m</div>
        {site.hasCoordinates && (
          <div>Location: {site.lat.toFixed(6)}, {site.lng.toFixed(6)}</div>
        )}
        <div className="tooltip-hint">Click for full details</div>
      </div>
    </div>
  )
}

export default SiteItemTooltip
