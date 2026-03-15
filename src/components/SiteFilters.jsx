import { useTranslation } from 'react-i18next'
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import SearchIcon from './icons/SearchIcon'
import { toTitleCase } from '../lib/utils'

function SiteFilters({ layouts, biddingSessions, filters, onFilterChange, onSearchChange }) {
  const { t } = useTranslation()
  
  return (
    <Card className="border-0 shadow-none rounded-none">
      <CardContent className="pt-3 pb-4 px-6">
        <div className="flex flex-row gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label htmlFor="search">{t('siteFilters.search.label')}</Label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', color: '#4B2840', pointerEvents: 'none', zIndex: 1 }}>
                <SearchIcon size={24} />
              </span>
              <Input
                id="search"
                type="text"
                placeholder={t('siteFilters.search.placeholder')}
                value={filters.search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 py-1.5"
                style={{ paddingLeft: '2.5rem' }}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex-1 min-w-[200px] space-y-2">
            <Label htmlFor="biddingSession">{t('siteFilters.biddingRounds.label')}</Label>
            <Select
              id="biddingSession"
              value={filters.biddingSession}
              onChange={(e) => onFilterChange('biddingSession', e.target.value)}
              className="h-9 py-1.5"
            >
              <option value="">{t('siteFilters.biddingRounds.allRounds')}</option>
              {biddingSessions.map(session => (
                <option key={session.value} value={session.value}>
                  {session.label}
                </option>
              ))}
            </Select>
          </div>
          
          <div className="flex-1 min-w-[180px] space-y-2">
            <Label htmlFor="layout">{t('siteFilters.layout.label')}</Label>
            <Select
              id="layout"
              value={filters.layout}
              onChange={(e) => onFilterChange('layout', e.target.value)}
              className="h-9 py-1.5"
            >
              <option value="">{t('siteFilters.layout.allLayouts')}</option>
              {layouts.map(layout => (
                <option key={layout} value={layout}>
                  {toTitleCase(layout)}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex-1 min-w-[180px] space-y-2">
            <Label htmlFor="siteSize">{t('siteFilters.siteSize.label')}</Label>
            <Select
              id="siteSize"
              value={filters.siteSize}
              onChange={(e) => onFilterChange('siteSize', e.target.value)}
              className="h-9 py-1.5"
            >
              <option value="">{t('siteFilters.siteSize.allSizes')}</option>
              <option value="Upto 54 sq.m">{t('siteFilters.siteSize.upto54')}</option>
              <option value="54-108 sq.m">{t('siteFilters.siteSize.54to108')}</option>
              <option value="108-216 sq.m">{t('siteFilters.siteSize.108to216')}</option>
              <option value="> 216 sq.m">{t('siteFilters.siteSize.above216')}</option>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SiteFilters
