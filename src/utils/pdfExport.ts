import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Property } from '../types';
import { resolveDirectPropertyUrl } from './urlValidator';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate description at clean word boundaries without mid-word cuts or multi-offer text
 */
function cleanCardDescription(desc?: string, maxLength = 240): string {
  if (!desc) return 'Brak szczegółowego opisu nieruchomości w ogłoszeniu.';
  let text = desc.trim();

  // Strip second offer markers if any
  const secondOfferMatch = text.search(/(?:[\n\r;.]\s*(?:oferta\s*2\b|2[.)]\s+|inna oferta\b|kolejne mieszkanie\b|opcja\s*2\b|druga oferta\b|w ofercie także))/i);
  if (secondOfferMatch > 0) {
    text = text.substring(0, secondOfferMatch).trim();
  }
  text = text.replace(/^(?:oferta\s*1\s*[:.-]?\s*|1[.)]\s*|mieszkanie\s*1\s*[:.-]?\s*)/i, '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  // Find last space before maxLength to avoid cuts like "a w b..."
  const cut = text.substring(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.65) {
    return cut.substring(0, lastSpace).replace(/[,;.:\s-]+$/, '') + '...';
  }
  return cut.replace(/[,;.:\s-]+$/, '') + '...';
}

/**
 * Clean and bound title without clipping top font ascenders
 */
function cleanCardTitle(title?: string, maxLength = 100): string {
  if (!title) return 'Nieruchomość';
  const clean = title.trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.substring(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.7) {
    return cut.substring(0, lastSpace).replace(/[,;.:\s-]+$/, '') + '...';
  }
  return cut + '...';
}

/**
 * Format floor string cleanly to Polish naming
 */
function formatFloorName(rawFloor?: string): string {
  if (!rawFloor || rawFloor === 'N/A') return '';
  const trimmed = rawFloor.trim();
  const upper = trimmed.toUpperCase();
  const floorMap: Record<string, string> = {
    'GROUND': 'Parter',
    'PARTER': 'Parter',
    'FIRST': '1. piętro',
    'SECOND': '2. piętro',
    'THIRD': '3. piętro',
    'FOURTH': '4. piętro',
    'FIFTH': '5. piętro',
    'SIXTH': '6. piętro',
    'SEVENTH': '7. piętro',
    'EIGHTH': '8. piętro',
    'NINTH': '9. piętro',
    'TENTH': '10. piętro'
  };
  for (const [key, val] of Object.entries(floorMap)) {
    if (upper.includes(key)) {
      return val;
    }
  }
  return trimmed;
}

export async function exportPropertiesToPDF(
  properties: Property[],
  query: string,
  dealTypeFilter: string = 'Wszystkie'
): Promise<void> {
  if (!properties || properties.length === 0) {
    throw new Error('Brak ofert do wyeksportowania.');
  }

  // Calculate market analytics summary from actual properties
  const totalOffers = properties.length;
  const numericPrices = properties
    .map(p => p.priceNumeric || parseInt((p.price || '').replace(/[^0-9]/g, ''), 10))
    .filter(n => !isNaN(n) && n > 0);
  
  const minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : null;
  const maxPrice = numericPrices.length > 0 ? Math.max(...numericPrices) : null;

  const m2Prices = properties
    .map(p => parseInt((p.pricePerM2 || '').replace(/[^0-9]/g, ''), 10))
    .filter(n => !isNaN(n) && n > 0);
  const avgM2Price = m2Prices.length > 0 
    ? Math.round(m2Prices.reduce((a, b) => a + b, 0) / m2Prices.length) 
    : null;

  const phoneOffersCount = properties.filter(p => p.hasPhoneNumber || p.phoneNumber).length;
  const phonePercentage = Math.round((phoneOffersCount / totalOffers) * 100);

  // Staging container: keep within viewport coordinates with opacity: 0
  // to ensure browser layout & html2canvas render all backgrounds, fonts, and text without offscreen culling
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0px';
  container.style.left = '0px';
  container.style.width = '800px';
  container.style.zIndex = '-9999';
  container.style.opacity = '0';
  container.style.pointerEvents = 'none';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  document.body.appendChild(container);

  try {
    // 2 listings per page fits comfortably within A4 proportions
    const offersPerPage = 2;
    const pagesData: Property[][] = [];
    for (let i = 0; i < properties.length; i += offersPerPage) {
      pagesData.push(properties.slice(i, i + offersPerPage));
    }

    const totalPages = pagesData.length;
    const nowStr = new Date().toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;

    for (let pageIdx = 0; pageIdx < pagesData.length; pageIdx++) {
      const currentProps = pagesData[pageIdx];
      const pageNum = pageIdx + 1;
      const isFirstPage = pageNum === 1;

      // Build single page DOM matching standard A4 aspect ratio (800 x 1131 px)
      const pageEl = document.createElement('div');
      pageEl.style.width = '800px';
      pageEl.style.height = '1131px';
      pageEl.style.padding = '22px 34px 18px 34px';
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.backgroundColor = '#ffffff';
      pageEl.style.display = 'flex';
      pageEl.style.flexDirection = 'column';
      pageEl.style.justifyContent = 'flex-start';
      pageEl.style.position = 'relative';
      pageEl.style.overflow = 'hidden';

      // 1. Header Section
      let headerHTML = '';
      if (isFirstPage) {
        headerHTML = `
          <div style="border-bottom: 2px solid #0f172a; padding-bottom: 11px; margin-bottom: 12px;">
            <!-- Brand & Title Row (Table layout ensures bulletproof vertical alignment across browsers) -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <td style="vertical-align: middle; text-align: left; padding: 0;">
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="background-color: #0f172a; color: #ffffff; font-weight: 800; font-size: 13px; line-height: 18px; padding: 5px 10px; border-radius: 6px; display: inline-block; vertical-align: middle; white-space: nowrap;">
                      <span style="color: #10b981; margin-right: 4px;">◆</span>PropFinder
                    </div>
                    <div>
                      <h1 style="margin: 0; padding: 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; line-height: 1.25;">
                        Raport Analityczny Nieruchomości
                      </h1>
                      <div style="font-size: 10.5px; color: #64748b; line-height: 1.35; margin-top: 2px;">
                        Zweryfikowane oferty z polskich portali (Otodom, OLX, Morizon, Gratka)
                      </div>
                    </div>
                  </div>
                </td>
                <td style="vertical-align: middle; text-align: right; width: 190px; padding: 0;">
                  <div style="font-size: 11px; color: #475569; line-height: 1.45;">
                    <div>Data: <strong style="color: #0f172a;">${nowStr}</strong></div>
                    <div>Znaleziono: <strong style="color: #0f172a;">${totalOffers} ${totalOffers === 1 ? 'ofertę' : (totalOffers < 5 ? 'oferty' : 'ofert')}</strong></div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Market Metrics & Search Criteria Strip -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 9px 13px;">
              <!-- Top Row: Criteria & Badges with ample line-height and no clipping -->
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 7px;">
                <tr>
                  <td style="vertical-align: middle; text-align: left; padding: 0;">
                    <div style="font-size: 12px; line-height: 20px; color: #1e293b; max-width: 530px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 1px 0;">
                      <span style="color: #64748b; font-weight: 600;">Kryteria:</span>
                      <strong style="color: #0f172a; margin-left: 4px;">"${escapeHtml(query)}"</strong>
                    </div>
                  </td>
                  <td style="vertical-align: middle; text-align: right; white-space: nowrap; padding: 0;">
                    <span style="display: inline-block; vertical-align: middle; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 5px; font-size: 10px; font-weight: 700; line-height: 14px; margin-right: 6px;">
                      ✓ Dane zweryfikowane
                    </span>
                    <span style="display: inline-block; vertical-align: middle; background-color: #e2e8f0; color: #0f172a; padding: 3px 8px; border-radius: 5px; font-size: 10px; font-weight: 600; line-height: 14px;">
                      Filtr: ${escapeHtml(dealTypeFilter || 'Wszystkie')}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Dashed separator with generous padding above and below so letters never touch it -->
              <div style="border-top: 1px dashed #cbd5e1; margin-top: 2px; padding-top: 7px;">
                <div style="display: flex; gap: 14px; font-size: 10.5px; line-height: 16px; color: #475569; flex-wrap: wrap;">
                  ${minPrice && maxPrice ? `
                    <div>
                      <span style="color: #64748b;">Zakres cen:</span> 
                      <strong style="color: #0f172a;">${minPrice.toLocaleString('pl-PL')} – ${maxPrice.toLocaleString('pl-PL')} PLN</strong>
                    </div>
                  ` : ''}
                  ${avgM2Price ? `
                    <div>
                      <span style="color: #64748b;">Śr. stawka:</span> 
                      <strong style="color: #0f172a;">~${avgM2Price.toLocaleString('pl-PL')} PLN/m²</strong>
                    </div>
                  ` : ''}
                  <div>
                    <span style="color: #64748b;">Bezpośredni telefon:</span> 
                    <strong style="color: #047857;">${phoneOffersCount} (${phonePercentage}%)</strong>
                  </div>
                  <div>
                    <span style="color: #64748b;">Ochrona linków:</span> 
                    <strong style="color: #0284c7;">100% bezpośrednie 1:1</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        headerHTML = `
          <div style="border-bottom: 1.5px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: middle; text-align: left; padding: 0;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background-color: #0f172a; color: #ffffff; font-weight: 800; font-size: 10.5px; line-height: 14px; padding: 2px 7px; border-radius: 4px; display: inline-block;">
                      PropFinder
                    </span>
                    <span style="color: #0f172a; font-weight: 700; font-size: 11px; line-height: 16px;">Raport Wyszukiwania:</span>
                    <span style="color: #475569; font-weight: 500; font-size: 11px; line-height: 16px; max-width: 440px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block;">
                      "${escapeHtml(query)}"
                    </span>
                  </div>
                </td>
                <td style="vertical-align: middle; text-align: right; width: 120px; font-weight: 700; font-size: 11px; color: #64748b; padding: 0;">
                  Strona ${pageNum} z ${totalPages}
                </td>
              </tr>
            </table>
          </div>
        `;
      }

      // 2. Listing Cards Section (Strictly bounded height so 2 cards never overflow)
      let cardsHTML = `<div style="display: flex; flex-direction: column; gap: 12px; flex: 1;">`;

      currentProps.forEach((prop, idx) => {
        const globalIndex = pageIdx * offersPerPage + idx + 1;
        const isRent = prop.dealType?.toLowerCase().includes('wynaj') || prop.dealType?.toLowerCase().includes('rent');
        const badgeColor = isRent ? '#065f46' : '#1e40af';
        const badgeBg = isRent ? '#ecfdf5' : '#eff6ff';
        const badgeBorder = isRent ? '#a7f3d0' : '#bfdbfe';

        const featuresHTML = (prop.features || []).slice(0, 5).map(f => `
          <span style="background-color: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; padding: 2px 7px; border-radius: 4px; font-size: 9.5px; font-weight: 500;">
            ${escapeHtml(f)}
          </span>
        `).join('');

        const singleDesc = cleanCardDescription(prop.description, 230);
        const singleTitle = cleanCardTitle(prop.title, 90);
        const directUrlObj = resolveDirectPropertyUrl(prop);
        const directUrl = directUrlObj.url;

        cardsHTML += `
          <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-top: 3.5px solid #1e293b; border-radius: 8px; padding: 12px 16px; box-sizing: border-box; box-shadow: 0 1px 3px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <!-- Top Badges & Portal -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                  <span style="background-color: #0f172a; color: #ffffff; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px;">
                    #${globalIndex}
                  </span>
                  <span style="background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px;">
                    ${escapeHtml(prop.dealType || 'Oferta')}
                  </span>
                  <span style="background-color: #f8fafc; color: #1e293b; border: 1px solid #cbd5e1; font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 6px;">
                    ${escapeHtml(prop.propertyType || 'Mieszkanie')}
                  </span>
                  <span style="background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 6px;">
                    ✓ Oferta 1:1
                  </span>
                  ${(prop.liveVerification && prop.liveVerification.isLive) ? `
                    <span style="background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 6px;">
                      ● Aktywna na żywo
                    </span>
                  ` : ''}
                  ${(prop.hasPhoneNumber || prop.phoneNumber) ? `
                    <span style="background-color: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; font-size: 9.5px; font-weight: 700; padding: 2px 7px; border-radius: 6px;">
                      ☎ Telefon
                    </span>
                  ` : ''}
                </div>
                <span style="background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a; font-size: 10.5px; font-weight: 700; padding: 2px 9px; border-radius: 6px;">
                  ${escapeHtml(prop.source || 'Portal')}
                </span>
              </div>

              <!-- Listing Title (Standard block layout with safe padding to prevent character clipping) -->
              <h3 style="margin: 0 0 6px 0; font-size: 14.5px; font-weight: 800; color: #0f172a; line-height: 1.35; padding: 2px 0 3px 0; display: block; word-break: break-word;">
                ${escapeHtml(singleTitle)}
              </h3>

              <!-- Price & Location Row -->
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
                <div style="display: flex; align-items: baseline; gap: 6px;">
                  <span style="font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                    ${escapeHtml(prop.price)}
                  </span>
                  ${prop.pricePerM2 && prop.pricePerM2 !== 'N/A' ? `
                    <span style="font-size: 11.5px; color: #475569; font-weight: 600;">
                      (${escapeHtml(prop.pricePerM2)})
                    </span>
                  ` : ''}
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #334155;">
                  📍 ${escapeHtml(prop.location)}
                </div>
              </div>

              <!-- Key Specs Grid Bar -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 12px; margin-bottom: 6px; display: flex; gap: 20px; font-size: 11px; color: #334155;">
                <div><span style="color: #64748b;">Powierzchnia:</span> <strong>${escapeHtml(prop.area || '-')}</strong></div>
                <div><span style="color: #64748b;">Liczba pokoi:</span> <strong>${escapeHtml(prop.rooms || '-')}</strong></div>
                ${prop.floor && prop.floor !== 'N/A' ? `<div><span style="color: #64748b;">Piętro:</span> <strong>${escapeHtml(formatFloorName(prop.floor))}</strong></div>` : ''}
              </div>

              <!-- Single-Offer Description Box -->
              <div style="background-color: #fcfcfd; border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px 11px; margin-bottom: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                  <span style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                    Opis nieruchomości (autonomiczny lokal)
                  </span>
                  <span style="font-size: 9px; font-weight: 700; color: #065f46; background-color: #ecfdf5; padding: 1px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">
                    1 ogłoszenie
                  </span>
                </div>
                <p style="margin: 0; font-size: 11px; line-height: 1.45; color: #334155; word-break: break-word;">
                  ${escapeHtml(singleDesc)}
                </p>
              </div>

              <!-- Amenities / Features -->
              ${featuresHTML ? `
                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">
                  ${featuresHTML}
                </div>
              ` : ''}
            </div>

            <!-- Footer: Direct Phone & High-Visibility Action Link -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #475569; padding-top: 6px; border-top: 1px solid #f1f5f9; line-height: 1.4;">
              <div>
                <strong style="color: #0f172a;">Kontakt:</strong> 
                ${prop.phoneNumber ? `
                  <span style="color: #065f46; font-weight: 800; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 2px 7px; border-radius: 4px; margin-left: 4px;">
                    ☎ ${escapeHtml(prop.phoneNumber)}
                  </span>
                ` : `
                  <span style="color: #64748b; margin-left: 4px;">${escapeHtml(prop.contact || 'W ogłoszeniu')}</span>
                `}
              </div>

              <div style="text-align: right;">
                <a 
                  id="pdf-link-${globalIndex}"
                  class="pdf-direct-link"
                  data-url="${escapeHtml(directUrl)}"
                  href="${escapeHtml(directUrl)}" 
                  target="_blank" 
                  style="display: inline-block; vertical-align: middle; background-color: #0f172a; color: #ffffff !important; padding: 5px 12px; border-radius: 6px; font-weight: 700; font-size: 10.5px; text-decoration: none; line-height: 16px; text-align: center; border: 1px solid #0f172a;"
                >
                  <span style="color: #ffffff !important; display: inline-block;">Otwórz ofertę (${escapeHtml(prop.source || 'Portal')}) ↗</span>
                </a>
              </div>
            </div>
          </div>
        `;
      });

      cardsHTML += `</div>`;

      // 3. Document Footer
      const footerHTML = `
        <div style="border-top: 1px solid #e2e8f0; padding-top: 7px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b;">
          <div>
            Wygenerowano przez <strong>PropFinder</strong> • Zweryfikowane dane rynku nieruchomości w Polsce (Google Search Grounding).
          </div>
          <div style="font-weight: 700; color: #0f172a;">
            Strona ${pageNum} z ${totalPages}
          </div>
        </div>
      `;

      pageEl.innerHTML = headerHTML + cardsHTML + footerHTML;
      container.innerHTML = '';
      container.appendChild(pageEl);

      // Measure coordinates of interactive links on this page for jsPDF annotation
      const pageRect = pageEl.getBoundingClientRect();
      const linkElements = pageEl.querySelectorAll<HTMLElement>('.pdf-direct-link');
      const interactiveLinks: { url: string; xMm: number; yMm: number; wMm: number; hMm: number }[] = [];

      linkElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const url = el.getAttribute('data-url');
        if (url) {
          const relX = rect.left - pageRect.left;
          const relY = rect.top - pageRect.top;
          const relW = rect.width;
          const relH = rect.height;

          // Convert to A4 millimeters (210 x 297 mm from 800 x 1131 px)
          const xMm = (relX / 800) * pdfWidth;
          const yMm = (relY / 1131) * pdfHeight;
          const wMm = (relW / 800) * pdfWidth;
          const hMm = (relH / 1131) * pdfHeight;

          interactiveLinks.push({ url, xMm, yMm, wMm, hMm });
        }
      });

      // Render page to canvas with high resolution
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      if (pageIdx > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      // Add real clickable hyperlinks directly into the PDF layer
      interactiveLinks.forEach(link => {
        try {
          pdf.link(link.xMm, link.yMm, link.wMm, link.hMm, { url: link.url });
        } catch (e) {
          console.warn('Could not add PDF hyperlink annotation:', e);
        }
      });
    }

    // Sanitize query for file name
    const sanitizedQuery = query
      .toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż]+/gi, '_')
      .slice(0, 32);

    const filename = `propfinder_${sanitizedQuery || 'nieruchomosci'}_${Date.now()}.pdf`;
    pdf.save(filename);

  } finally {
    // Clean up temporary DOM container
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
