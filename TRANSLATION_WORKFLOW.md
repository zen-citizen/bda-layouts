# Translation Workflow for Kannada Language Support

## Overview

This document outlines the workflow for ensuring accurate Kannada translations for the BDA Layouts site.

## Translation Files

- **English**: `src/i18n/locales/en/translation.json`
- **Kannada**: `src/i18n/locales/kn/translation.json`

## Translation Accuracy Workflow

### Phase 1: Initial Setup (Completed)

1. ✅ All English strings extracted to translation files
2. ✅ Initial Kannada translations added (automated/hybrid approach)
3. ✅ Translation structure organized by page/component

### Phase 2: Human Review (Required)

**Reviewer Requirements:**

- Native Kannada speaker
- Familiar with formal/official Kannada (for government content)
- Understanding of technical terms related to auctions and real estate

**Review Checklist:**

1. **Context Accuracy**

   - Verify translations match the context of use
   - Check that technical terms are appropriate
   - Ensure formal tone for government/official content

2. **Terminology Consistency**

   - "eAuction" - May remain in English or use accepted Kannada equivalent
   - "BDA" - Typically remains as "BDA" (acronym)
   - "EMD" (Earnest Money Deposit) - Use appropriate Kannada term
   - Financial terms (Rs., Lakhs, sq.m) - Keep as-is or use appropriate format

3. **Cultural Appropriateness**

   - Verify language is appropriate for official government content
   - Check that address formats and contact information are clear
   - Ensure dates and numbers are understandable

4. **Completeness**
   - Verify all strings are translated
   - Check for missing translations (should fallback to English)
   - Ensure no placeholder text remains

### Phase 3: Quality Assurance

**Testing Checklist:**

1. **Functional Testing**

   - [ ] Toggle language on all pages (Home, Map, Info)
   - [ ] Verify translations load correctly
   - [ ] Check localStorage persistence of language preference
   - [ ] Test page navigation with language preference

2. **Content Testing**

   - [ ] Verify all text is translated (no English fallbacks visible)
   - [ ] Check special characters render correctly (Kannada script)
   - [ ] Verify text doesn't overflow UI elements
   - [ ] Test on different devices/browsers

3. **UI Testing**
   - [ ] Check button/label widths (Kannada text may be longer/shorter)
   - [ ] Verify responsive layouts work with Kannada text
   - [ ] Test form inputs and placeholders
   - [ ] Check modal and dropdown translations

## Translation File Structure

Translations are organized by:

- `common`: Shared navigation, buttons, labels
- `home`: Home page content
- `infoPage`: Auction info page sections
- `mapPage`: Map page filters and labels
- `siteFilters`: Filter component labels
- `siteList`: Site list component
- `siteDetails`: Site details modal

## Notes for Translators

1. **Formal Tone**: All content should use formal Kannada appropriate for government/official communications
2. **Technical Terms**: Some terms like "eAuction", "BDA" may remain in English if commonly understood
3. **Dates/Numbers**: Keep in standard format (English numerals, standard date format)
4. **URLs**: Keep unchanged, only translate link text
5. **Data Values**: Site numbers, layout names from CSV remain unchanged

## Review Process

1. **Initial Review**: Native Kannada speaker reviews all translations
2. **Context Check**: Verify translations in actual UI context
3. **Final Approval**: Stakeholder approval before deployment

## Maintenance

- Track translation changes in git
- Document any terminology decisions
- Update translations when content changes
- Regular review for accuracy and completeness
