import { jsPDF } from 'jspdf';
import { Invoice, User, formatPrice } from '../types';

// Palette par défaut
const STANDARD_BLUE = '#2563eb'; 
const TEXT_DARK = '#1e293b'; // Slate-800
const TEXT_GRAY = '#64748b'; // Slate-500

const getTheme = (user: User) => {
  const isBusiness = user.plan === 'business';
  const accentColor = (isBusiness && user.brandColor) ? user.brandColor : STANDARD_BLUE;
  
  return {
    text: {
      primary: '#0f172a',    
      secondary: '#64748b', 
      accent: accentColor,   
      white: '#ffffff',
    },
    bg: {
      tableHeader: isBusiness ? accentColor : '#f1f5f9', 
      totalHighlight: isBusiness ? accentColor : '#f8fafc',
      stripe: '#f8fafc',
    },
    border: '#e2e8f0',
    accent: accentColor
  };
};

const createInvoiceDoc = (invoice: Invoice, user: User): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  const isBusiness = user.plan === 'business';
  const isStarter = user.plan === 'starter';
  const theme = getTheme(user);
  
  // Formatter propre
  const formatMoney = (amount: number) => {
    const cleanValue = amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const currency = user.currency || 'USD';
    return `${cleanValue} ${currency}`;
  };
  
  const setFont = (type: 'bold' | 'normal' | 'italic', size: number, color: string) => {
    doc.setFont('helvetica', type);
    doc.setFontSize(size);
    doc.setTextColor(color);
  };

  let cursorY = margin;

  // =================================================================
  // 💎 DESIGN BUSINESS (PREMIUM & COULEUR)
  // =================================================================
  if (isBusiness) {
      
      doc.setFillColor(theme.accent);
      doc.rect(0, 0, pageWidth, 4, 'F'); 
      cursorY = margin + 10;

      // LOGO
      if (user.logo) {
          try {
             const imgProps = doc.getImageProperties(user.logo);
             const ratio = imgProps.width / imgProps.height;
             let w = 40; let h = w / ratio;
             if(h > 25) { h = 25; w = h * ratio; }
             doc.addImage(user.logo, margin, cursorY, w, h);
          } catch (e) {
             setFont('bold', 22, theme.text.primary);
             doc.text(user.businessName || user.name, margin, cursorY + 10);
          }
      } else {
         setFont('bold', 22, theme.text.primary);
         doc.text(user.businessName || user.name, margin, cursorY + 10);
      }

      const rightX = pageWidth - margin;
      setFont('bold', 32, theme.text.primary);
      doc.text("FACTURE", rightX, cursorY + 10, { align: 'right' });
      setFont('normal', 10, theme.text.accent);
      doc.text(`#${invoice.number}`, rightX, cursorY + 18, { align: 'right' });

      // Badge Statut
      const statusLabel = invoice.status === 'paid' ? 'PAYÉE' : invoice.status === 'pending' ? 'EN ATTENTE' : 'BROUILLON';
      const statusColor = invoice.status === 'paid' ? '#10b981' : invoice.status === 'pending' ? '#f59e0b' : '#94a3b8';
      doc.setFontSize(9);
      const badgeWidth = doc.getTextWidth(statusLabel) + 12;
      doc.setDrawColor(statusColor);
      doc.setFillColor(statusColor);
      doc.roundedRect(rightX - badgeWidth, cursorY + 24, badgeWidth, 7, 2, 2, 'F');
      doc.setTextColor('#ffffff');
      doc.setFont('helvetica', 'bold');
      doc.text(statusLabel, rightX - badgeWidth / 2, cursorY + 28.5, { align: 'center' });

      cursorY += 45;

      // Adresses
      const midPoint = pageWidth / 2;
      setFont('bold', 8, '#94a3b8');
      doc.text("ÉMIS PAR", margin, cursorY);
      setFont('bold', 11, theme.text.primary);
      doc.text(user.businessName || user.name, margin, cursorY + 6);
      setFont('normal', 9, theme.text.secondary);
      let senderY = cursorY + 11;
      doc.text(user.email, margin, senderY);
      if (user.phone) doc.text(user.phone, margin, senderY += 5);

      setFont('bold', 8, '#94a3b8');
      doc.text("FACTURÉ À", midPoint, cursorY);
      setFont('bold', 11, theme.text.primary);
      doc.text(invoice.clientName, midPoint, cursorY + 6);
      setFont('normal', 9, theme.text.secondary);
      let clientY = cursorY + 11;
      if (invoice.clientEmail) doc.text(invoice.clientEmail, midPoint, clientY);
      
      const datesY = Math.max(senderY, clientY) + 15;
      doc.setDrawColor(theme.border);
      doc.line(margin, datesY, pageWidth - margin, datesY);
      
      const dateSectionY = datesY + 8;
      setFont('bold', 9, theme.text.primary);
      doc.text("Date d'émission", margin, dateSectionY);
      setFont('normal', 9, theme.text.secondary);
      doc.text(new Date(invoice.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), margin, dateSectionY + 5);

      cursorY = dateSectionY + 20;

      // Tableau
      const colDesc = margin;
      const colQty = pageWidth - margin - 80;
      const colPrice = pageWidth - margin - 45;
      const colTotal = pageWidth - margin;

      doc.setFillColor(theme.accent);
      doc.roundedRect(margin, cursorY, pageWidth - (margin * 2), 10, 2, 2, 'F');
      const headerY = cursorY + 6.5;
      setFont('bold', 8, theme.text.white);
      doc.text('DESCRIPTION', colDesc + 5, headerY);
      doc.text('QTÉ', colQty, headerY, { align: 'center' });
      doc.text('PRIX UNIT.', colPrice, headerY, { align: 'right' });
      doc.text('TOTAL', colTotal - 5, headerY, { align: 'right' });

      cursorY += 14;

      invoice.items.forEach((item, index) => {
          const totalItem = item.quantity * item.price;
          const descWidth = colQty - colDesc - 10;
          const splitDesc = doc.splitTextToSize(item.description, descWidth);
          const rowHeight = Math.max(10, splitDesc.length * 5 + 6);
          if (cursorY + rowHeight > pageHeight - 50) { doc.addPage(); cursorY = margin; }
          if (index % 2 !== 0) {
             doc.setFillColor('#f8fafc');
             doc.roundedRect(margin, cursorY - 2, pageWidth - margin*2, rowHeight, 1, 1, 'F');
          }
          setFont('bold', 9, theme.text.primary);
          doc.text(splitDesc, colDesc + 5, cursorY + 3);
          setFont('normal', 9, theme.text.secondary);
          doc.text(item.quantity.toString(), colQty, cursorY + 3, { align: 'center' });
          doc.text(formatMoney(item.price), colPrice, cursorY + 3, { align: 'right' });
          setFont('bold', 9, theme.text.primary);
          doc.text(formatMoney(totalItem), colTotal - 5, cursorY + 3, { align: 'right' });
          cursorY += rowHeight;
      });
      
      doc.setDrawColor(theme.accent);
      doc.setLineWidth(0.5);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 10;

      // NOTES ET PAIEMENT (Business - Modifié)
      const summaryWidth = 100;
      const notesWidth = pageWidth - margin*2 - summaryWidth - 10;
      let notesY = cursorY;

      if (invoice.notes || invoice.paymentMethod) {
          if (invoice.paymentMethod) {
              setFont('bold', 9, theme.text.primary);
              doc.text(`Mode de paiement : ${invoice.paymentMethod}`, margin, notesY + 4);
              notesY += 8;
          }
          if (invoice.notes) {
               setFont('italic', 9, theme.text.secondary); // Italique et gris
               const splitNotes = doc.splitTextToSize(invoice.notes, notesWidth);
               doc.text(splitNotes, margin, notesY + 4);
          }
      }

      // Total Business
      const summaryX = pageWidth - margin - summaryWidth;
      const totalBoxY = cursorY + 2;
      
      doc.setFillColor(theme.accent); 
      doc.roundedRect(summaryX, totalBoxY, summaryWidth, 14, 2, 2, 'F');
      
      const totalTextY = totalBoxY + 9;
      setFont('bold', 11, theme.text.white);
      doc.text("TOTAL À PAYER", summaryX + 5, totalTextY);
      setFont('bold', 14, theme.text.white);
      doc.text(formatMoney(invoice.total), pageWidth - margin - 5, totalTextY, { align: 'right' });

  } else {
      // =================================================================
      // 🛡️ DESIGN STANDARD (STARTER & PRO)
      // =================================================================
      
      const showLogo = user.plan !== 'starter' && user.logo;

      if (showLogo) {
          try {
              const imgProps = doc.getImageProperties(user.logo!);
              const ratio = imgProps.width / imgProps.height;
              let w = 35; let h = w / ratio;
              if (h > 25) { h = 25; w = h * ratio; }
              doc.addImage(user.logo!, margin, cursorY, w, h);
          } catch(e) {}
      } else {
          setFont('bold', 26, STANDARD_BLUE); 
          doc.text(user.businessName || user.name, margin, cursorY + 10);
          setFont('normal', 10, TEXT_GRAY);
          doc.text('Gestion de factures', margin, cursorY + 16);
      }
      
      const rightX = pageWidth - margin;
      setFont('bold', 9, TEXT_GRAY);
      doc.text("FACTURE N°", rightX, cursorY + 5, { align: 'right' });
      setFont('bold', 14, TEXT_DARK);
      
      const invoiceNum = invoice.number || '----';
      doc.text(invoiceNum, rightX, cursorY + 11, { align: 'right' });
      
      setFont('normal', 10, TEXT_GRAY);
      const dateStr = new Date(invoice.date).toLocaleDateString('fr-FR');
      doc.text(`Date : ${dateStr}`, rightX, cursorY + 17, { align: 'right' });

      if (invoice.status === 'paid') {
          setFont('bold', 10, '#10b981'); 
          doc.text("PAYÉE", rightX, cursorY + 23, { align: 'right' });
      } else if (invoice.status === 'pending') {
          setFont('bold', 10, '#f59e0b'); 
          doc.text("EN ATTENTE", rightX, cursorY + 23, { align: 'right' });
      }

      cursorY += 40;

      doc.setDrawColor('#e2e8f0');
      doc.setLineWidth(0.1);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 15;

      const leftColX = margin;
      const rightColX = pageWidth / 2 + 10;

      setFont('bold', 8, '#94a3b8'); 
      doc.text('ÉMIS PAR', leftColX, cursorY);
      doc.text('FACTURÉ À', rightColX, cursorY);
      cursorY += 6;
      
      setFont('bold', 11, TEXT_DARK);
      doc.text(user.businessName || user.name, leftColX, cursorY);
      setFont('normal', 10, TEXT_GRAY);
      doc.text(user.email, leftColX, cursorY + 6);
      
      setFont('bold', 11, TEXT_DARK);
      doc.text(invoice.clientName, rightColX, cursorY);
      setFont('normal', 10, TEXT_GRAY);
      if (invoice.clientEmail) {
          doc.text(invoice.clientEmail, rightColX, cursorY + 6);
      }

      cursorY += 40;

      // TABLEAU STANDARD
      const colDesc = margin;
      const colQty = pageWidth / 2;
      const colPrice = pageWidth - margin - 60;
      const colTotal = pageWidth - margin;

      doc.setFillColor('#f8fafc'); 
      doc.rect(margin, cursorY, pageWidth - (margin * 2), 10, 'F');
      
      const headerY = cursorY + 6.5;
      setFont('bold', 8, '#94a3b8'); 
      doc.text('DESCRIPTION', colDesc + 5, headerY);
      doc.text('QTÉ', colQty, headerY, { align: 'center' });
      doc.text('PRIX UNIT.', colPrice, headerY, { align: 'right' });
      doc.text('MONTANT', colTotal - 5, headerY, { align: 'right' });
      
      cursorY += 15;
      
      invoice.items.forEach((item) => {
          setFont('normal', 10, TEXT_DARK);
          doc.text(item.description, colDesc + 5, cursorY);
          
          doc.text(item.quantity.toString(), colQty, cursorY, { align: 'center' });
          
          doc.text(formatMoney(item.price), colPrice, cursorY, { align: 'right' });
          
          setFont('bold', 10, TEXT_DARK);
          doc.text(formatMoney(item.price * item.quantity), colTotal - 5, cursorY, { align: 'right' });
          
          cursorY += 10;
      });
      
      doc.setDrawColor('#e2e8f0');
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 10;
      
      // TOTAUX
      const summaryWidth = 100;
      const summaryX = pageWidth - margin - summaryWidth;

      // 👇 ICI : CORRECTION DESIGN NOTES (Plus de titre "Informations")
      if (invoice.notes || invoice.paymentMethod) {
          const notesWidth = pageWidth - margin*2 - summaryWidth - 10;
          let noteY = cursorY; // Aligné avec le haut du bloc totaux

          // Paiement en Gras/Noir
          if (invoice.paymentMethod) {
              setFont('bold', 9, TEXT_DARK); 
              doc.text(`Paiement via : ${invoice.paymentMethod}`, margin, noteY + 4);
              noteY += 8;
          }

          // Notes en Italique/Gris
          if (invoice.notes) {
              setFont('italic', 9, TEXT_GRAY);
              const splitNotes = doc.splitTextToSize(invoice.notes, notesWidth);
              doc.text(splitNotes, margin, noteY + 4);
          }
      }

      // Sous-total
      setFont('normal', 10, TEXT_GRAY);
      doc.text("Sous-total", summaryX + 5, cursorY);
      setFont('bold', 10, TEXT_DARK);
      doc.text(formatMoney(invoice.total), pageWidth - margin - 5, cursorY, { align: 'right' });

      cursorY += 8;

      // Boite Total
      doc.setFillColor('#f8fafc');
      doc.roundedRect(summaryX, cursorY, summaryWidth, 14, 2, 2, 'F');

      const totalY = cursorY + 10;
      setFont('bold', 10, TEXT_DARK);
      doc.text("Total à payer", summaryX + 5, totalY);
      
      setFont('bold', 12, STANDARD_BLUE); 
      doc.text(formatMoney(invoice.total), pageWidth - margin - 5, totalY, { align: 'right' });

      if (isStarter) {
        setFont('normal', 10, '#94a3b8');
        doc.text('Créé gratuitement avec Kayit', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.setFontSize(8);
        doc.text('Passez en Pro pour retirer ce message', pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
  }

  return doc;
};

export const generateInvoicePDF = (invoice: Invoice, user: User) => {
  const doc = createInvoiceDoc(invoice, user);
  const fileName = invoice.number ? `Facture-${invoice.number}.pdf` : 'Facture.pdf';
  doc.save(fileName);
};

export const getInvoicePdfBlobUrl = (invoice: Invoice, user: User): string => {
  const doc = createInvoiceDoc(invoice, user);
  return doc.output('bloburl');
};