import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Property } from '../types';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCardDescription(desc?: string): string {
  if (!desc) return 'Brak szczegółowego opisu nieruchomości w ogłoszeniu.';
  let text = desc.trim();

  // Strip multi-offer markers if any slipped through
  const secondOfferMatch = text.search(/(?:[\n\r;.]\s*(?:oferta\s*2\b|2[.)]\s+|inna oferta\b|kolejne mieszkanie\b|opcja\s*2\b|druga oferta\b))/i);
  if (secondOfferMatch > 0) {
    text = text.substring(0, secondOfferMatch).trim();
  }
  text = text.replace(/^(?:oferta\s*1\s*[:.-]?\s*|1[.)]\s*|mieszkanie\s*1\s*[:.-]?\s*)/i, '').trim();

  // Keep description strictly bounded so each PDF card fits comfortably inside the A4 page without clipping
  if (text.length > 290) {
    text = text.substring(0, 287) + '...';
  }
  return text;
}

export async function exportPropertiesToPDF(
  properties: Property[],
  query: string,
  dealTypeFilter: string = 'Wszystkie'
): Promise<void> {
  if (!properties || properties.length === 0) {
    throw new Error('Brak ofert do wyeksportowania.');
  }

  // Create a hidden container for PDF rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-99999px';
  container.style.left = '-99999px';
  container.style.width = '800px';
  container.style.zIndex = '-1000';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  document.body.appendChild(container);

  try {
    // 2 cards per page fits cleanly with safe margins on standard A4
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

      // Build single page DOM with exact A4 aspect ratio (800 x 1131 px)
      const pageEl = document.createElement('div');
      pageEl.style.width = '800px';
      pageEl.style.height = '1131px';
      pageEl.style.maxHeight = '1131px';
      pageEl.style.padding = '26px 36px';
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.backgroundColor = '#ffffff';
      pageEl.style.display = 'flex';
      pageEl.style.flexDirection = 'column';
      pageEl.style.justifyContent = 'space-between';
      pageEl.style.overflow = 'hidden';

      // Header Section
      let headerHTML = '';
      if (isFirstPage) {
        headerHTML = `
          <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="background-color: #0f172a; color: #ffffff; font-weight: 800; font-size: 13px; padding: 3px 8px; border-radius: 5px; letter-spacing: 0.5px;">
                  PropFinder
                </div>
                <h1 style="margin: 0; font-size: 19px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px;">
                  Raport Wyszukiwania Nieruchomości
                </h1>
              </div>
              <div style="text-align: right; font-size: 11px; color: #64748b;">
                <div>Data: <strong>${nowStr}</strong></div>
                <div>Liczba ofert: <strong>${properties.length}</strong></div>
              </div>
            </div>

            <div style="margin-top: 10px; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11.5px; color: #334155; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="color: #64748b; font-weight: 500;">Zapytanie:</span> 
                <strong style="color: #0f172a; margin-left: 4px;">"${escapeHtml(query)}"</strong>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                <span style="background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700;">
                  ✓ Dane zweryfikowane
                </span>
                <span style="background-color: #e2e8f0; color: #1e293b; padding: 2px 7px; border-radius: 4px; font-size: 10.5px; font-weight: 600;">
                  Filtr: ${escapeHtml(dealTypeFilter || 'Wszystkie')}
                </span>
              </div>
            </div>
          </div>
        `;
      } else {
        headerHTML = `
          <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-weight: 800; color: #0f172a;">PropFinder</span>
              <span>•</span>
              <span style="color: #475569; font-weight: 500;">${escapeHtml(query)}</span>
            </div>
            <div style="font-weight: 600;">Strona ${pageNum} z ${totalPages}</div>
          </div>
        `;
      }

      // Middle Section (Property Cards)
      let cardsHTML = `<div style="display: flex; flex-direction: column; gap: 14px; flex: 1;">`;

      currentProps.forEach((prop, idx) => {
        const globalIndex = pageIdx * offersPerPage + idx + 1;
        const isRent = prop.dealType?.toLowerCase().includes('wynaj') || prop.dealType?.toLowerCase().includes('rent');
        const badgeColor = isRent ? '#065f46' : '#1e40af';
        const badgeBg = isRent ? '#ecfdf5' : '#eff6ff';
        const badgeBorder = isRent ? '#a7f3d0' : '#bfdbfe';

        const featuresHTML = (prop.features || []).slice(0, 5).map(f => `
          <span style="background-color: #f1f5f9; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500;">
            ${escapeHtml(f)}
          </span>
        `).join('');

        const singleDesc = formatCardDescription(prop.description);

        cardsHTML += `
          <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 14px 16px; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0,0,0,0.03);">
            <!-- Top Badges & Portal -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="display: flex; gap: 6px; align-items: center;">
                <span style="background-color: #0f172a; color: #ffffff; font-size: 10.5px; font-weight: 800; padding: 2px 7px; border-radius: 4px;">
                  #${globalIndex}
                </span>
                <span style="background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px;">
                  ${escapeHtml(prop.dealType || 'Oferta')}
                </span>
                <span style="background-color: #f8fafc; color: #334155; border: 1px solid #e2e8f0; font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 10px;">
                  ${escapeHtml(prop.propertyType || 'Nieruchomość')}
                </span>
                <span style="background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 10px;">
                  ✓ Zweryfikowano
                </span>
                ${(prop.hasPhoneNumber || prop.phoneNumber) ? `
                  <span style="background-color: #ecfdf5; color: #065f46; border: 1px solid #6ee7b7; font-size: 9.5px; font-weight: 700; padding: 2px 6px; border-radius: 10px;">
                    ☎ Telefon
                  </span>
                ` : ''}
              </div>
              <span style="background-color: #fffbeb; color: #92400e; border: 1px solid #fde68a; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px;">
                ${escapeHtml(prop.source || 'Portal')}
              </span>
            </div>

            <!-- Title -->
            <h3 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #0f172a; line-height: 1.35; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
              ${escapeHtml(prop.title)}
            </h3>

            <!-- Price & Location -->
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">
              <div>
                <span style="font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                  ${escapeHtml(prop.price)}
                </span>
                ${prop.pricePerM2 && prop.pricePerM2 !== 'N/A' ? `
                  <span style="font-size: 11px; color: #64748b; margin-left: 5px; font-weight: 500;">
                    (${escapeHtml(prop.pricePerM2)})
                  </span>
                ` : ''}
              </div>
              <div style="font-size: 11.5px; font-weight: 600; color: #475569;">
                📍 ${escapeHtml(prop.location)}
              </div>
            </div>

            <!-- Metrics bar -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 10px; margin-bottom: 6px; display: flex; gap: 16px; font-size: 11px; color: #334155;">
              <div><strong>Powierzchnia:</strong> ${escapeHtml(prop.area || '-')}</div>
              <div><strong>Pokoje:</strong> ${escapeHtml(prop.rooms || '-')}</div>
              ${prop.floor && prop.floor !== 'N/A' ? `<div><strong>Piętro:</strong> ${escapeHtml(prop.floor)}</div>` : ''}
            </div>

            <!-- Single-Offer Description Box -->
            <div style="background-color: #fcfcfc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 7px 10px; margin-bottom: 6px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                <span style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                  Opis oferty
                </span>
                <span style="font-size: 9px; font-weight: 600; color: #065f46; background-color: #ecfdf5; padding: 1px 6px; border-radius: 4px; border: 1px solid #a7f3d0;">
                  1 ogłoszenie
                </span>
              </div>
              <p style="margin: 0; font-size: 11px; line-height: 1.45; color: #334155;">
                ${escapeHtml(singleDesc)}
              </p>
            </div>

            <!-- Features -->
            ${featuresHTML ? `
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px;">
                ${featuresHTML}
              </div>
            ` : ''}

            <!-- Contact & Link -->
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #475569; padding-top: 6px; padding-bottom: 2px; border-top: 1px solid #f1f5f9; line-height: 1.5;">
              <div>
                <strong style="color: #0f172a;">Kontakt:</strong> ${prop.phoneNumber ? `<span style="color: #065f46; font-weight: 700;">☎ ${escapeHtml(prop.phoneNumber)}</span>` : escapeHtml(prop.contact || 'W ogłoszeniu')}
              </div>
              <div style="max-width: 440px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-bottom: 2px;">
                <a href="${escapeHtml(prop.url)}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 500; font-size: 10.5px;">
                  ${escapeHtml(prop.source || 'Portal')}: Zobacz ofertę bezpośrednią ↗
                </a>
              </div>
            </div>
          </div>
        `;
      });

      cardsHTML += `</div>`;

      // Footer
      const footerHTML = `
        <div style="border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
          <div>
            Wygenerowano przez <strong>PropFinder</strong> (Google Search Grounding).
          </div>
          <div style="font-weight: 600;">
            Strona ${pageNum} z ${totalPages}
          </div>
        </div>
      `;

      pageEl.innerHTML = headerHTML + cardsHTML + footerHTML;
      container.innerHTML = '';
      container.appendChild(pageEl);

      // Render page to canvas with exact A4 proportions
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
    }

    // Sanitize query for file name
    const sanitizedQuery = query
      .toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż]+/gi, '_')
      .slice(0, 30);

    const filename = `propfinder_${sanitizedQuery || 'nieruchomosci'}_${Date.now()}.pdf`;
    pdf.save(filename);

  } finally {
    // Clean up temporary DOM container
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
