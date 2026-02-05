import { jsPDF } from 'jspdf';
import { Invoice, User } from '../types';

// Palette par défaut
const STANDARD_BLUE = '#2563eb';
const TEXT_DARK = '#1e293b';
const TEXT_GRAY = '#64748b';
const LIGHT_GRAY = '#f8fafc';

const getTheme = (user: User) => {
  const isBusiness = user.plan === 'business';
  const accentColor = (isBusiness && user.brandColor) ? user.brandColor : STANDARD_BLUE;
  
  return {
    text: {
      primary: TEXT_DARK,
      secondary: TEXT_GRAY,
      accent: accentColor,
      white: '#ffffff',
    },
    bg: {
      header: accentColor,
      stripe: `${accentColor}10`, // Version très claire de la couleur d'accent pour les lignes
    },
    border: '#e2e8f0',
    accent: accentColor
  };
};

const formatMoney = (amount: number, currency: string = 'XOF') => {
    const integerPart = amount.toFixed(0);
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} ${currency}`;
};

const createInvoiceDoc = (invoice: Invoice, user: User): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  const isBusiness = user.plan === 'business';
  const isStarter = user.plan === 'starter';
  const theme = getTheme(user);
  
  const setFont = (type: 'bold' | 'normal' | 'italic', size: number, color: string) => {
    doc.setFont('helvetica', type);
    doc.setFontSize(size);
    doc.setTextColor(color);
  };

  let cursorY = margin;

  // =================================================================
  // 💎 NOUVEAU DESIGN BUSINESS "PREMIUM" (Fidèle à l'exemple)
  // =================================================================
  if (isBusiness) {
      
      // --- 1. EN-TÊTE ---
      let leftY = margin + 5;
      
      // LOGO
      if (user.logo) {
          try {
             const imgProps = doc.getImageProperties(user.logo);
             const ratio = imgProps.width / imgProps.height;
             let w = 35; let h = w / ratio;
             if(h > 25) { h = 25; w = h * ratio; }
             doc.addImage(user.logo, margin, leftY, w, h);
             leftY += h + 8;
          } catch (e) {}
      }

      // NOM DE L'ENTREPRISE
      setFont('bold', 20, theme.text.primary);
      doc.text(user.businessName || user.name, margin, leftY + 5);
      leftY += 12;

      // ADRESSE ET CONTACT
      setFont('bold', 9, theme.text.secondary);
      doc.text("Office Address", margin, leftY + 5);
      setFont('normal', 9, theme.text.secondary);
      
      const senderLines = doc.splitTextToSize(`${user.address || ''}\n\n(+221) ${user.phone || ''}`, 80);
      doc.text(senderLines, margin, leftY + 12);
      
      const finalLeftY = leftY + 12 + (senderLines.length * 5);

      // INFO FACTURE (Droite)
      let rightY = margin + 15;
      const rightColX = pageWidth - margin;

      setFont('bold', 28, theme.accent); 
      doc.text("INVOICE", rightColX, rightY, { align: 'right' });
      
      setFont('bold', 10, theme.text.primary);
      const dateStr = new Date(invoice.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      doc.text(dateStr, rightColX, rightY + 10, { align: 'right' });
      setFont('normal', 9, theme.text.secondary);
      doc.text(`#${invoice.number}`, rightColX, rightY + 15, { align: 'right' });

      // CLIENT "To:" (Décalé à droite)
      rightY += 35;
      const clientBoxX = pageWidth / 2 + 20;
      
      setFont('bold', 9, theme.text.secondary);
      doc.text("To:", clientBoxX, rightY);
      
      setFont('bold', 11, theme.text.primary);
      doc.text(invoice.clientName, clientBoxX, rightY + 7);
      
      setFont('normal', 9, theme.text.secondary);
      let clientText = "";
      if (invoice.clientAddress) clientText += `${invoice.clientAddress}\n`;
      if (invoice.clientEmail) clientText += `${invoice.clientEmail}`;
      
      const clientLines = doc.splitTextToSize(clientText, 70);
      doc.text(clientLines, clientBoxX, rightY + 13);
      
      const finalRightY = rightY + 13 + (clientLines.length * 5);

      cursorY = Math.max(finalLeftY, finalRightY) + 25;

      // --- 2. TABLEAU ---
      const colDesc = margin;
      const colPrice = pageWidth - margin - 85;
      const colQty = pageWidth - margin - 45;
      const colTotal = pageWidth - margin;

      // Header du tableau (Bande de couleur pleine)
      doc.setFillColor(theme.accent);
      doc.rect(margin, cursorY, pageWidth - (margin * 2), 12, 'F');
      
      const headerTextY = cursorY + 8;
      setFont('bold', 9, theme.text.white);
      doc.text('Items Description', colDesc + 5, headerTextY);
      doc.text('Unit Price', colPrice, headerTextY, { align: 'right' });
      doc.text('Qnt', colQty, headerTextY, { align: 'center' });
      doc.text('Total', colTotal - 5, headerTextY, { align: 'right' });

      cursorY += 12;

      invoice.items.forEach((item, index) => {
          const descWidth = colPrice - colDesc - 10;
          const splitDesc = doc.splitTextToSize(item.description, descWidth);
          const rowHeight = Math.max(16, splitDesc.length * 5 + 10);
          
          if (cursorY + rowHeight > pageHeight - 80) {
              doc.addPage();
              cursorY = margin;
          }

          // Ligne impaire : fond très clair
          if (index % 2 !== 0) {
             doc.setFillColor(theme.bg.stripe);
             doc.rect(margin, cursorY, pageWidth - (margin * 2), rowHeight, 'F');
          }

          setFont('bold', 9, theme.text.primary);
          doc.text(item.name || 'Item', colDesc + 5, cursorY + 7);
          
          setFont('normal', 8, theme.text.secondary);
          doc.text(splitDesc, colDesc + 5, cursorY + 12);
          
          setFont('normal', 9, theme.text.primary);
          doc.text(formatMoney(item.price, invoice.currency), colPrice, cursorY + 10, { align: 'right' });
          doc.text(item.quantity.toString(), colQty, cursorY + 10, { align: 'center' });
          
          setFont('bold', 9, theme.text.primary);
          doc.text(formatMoney(item.price * item.quantity, invoice.currency), colTotal - 5, cursorY + 10, { align: 'right' });

          cursorY += rowHeight;
          
          // Ligne de séparation fine
          doc.setDrawColor(theme.border);
          doc.setLineWidth(0.1);
          doc.line(margin, cursorY, pageWidth - margin, cursorY);
      });

      // --- 3. TOTAUX & NOTES ---
      cursorY += 10;
      const summaryWidth = 90;
      const summaryX = pageWidth - margin - summaryWidth;

      // Bloc de Notes (à gauche)
      if (invoice.notes) {
          const notesWidth = pageWidth - margin*3 - summaryWidth;
          setFont('bold', 9, theme.text.primary);
          doc.text("Note:", margin, cursorY + 5);
          setFont('normal', 8, theme.text.secondary);
          const splitNotes = doc.splitTextToSize(invoice.notes, notesWidth);
          doc.text(splitNotes, margin, cursorY + 12);
      }

      // Sous-total
      setFont('normal', 9, theme.text.secondary);
      doc.text("SUBTOTAL :", summaryX, cursorY + 5);
      setFont('bold', 9, theme.text.primary);
      doc.text(formatMoney(invoice.total, invoice.currency), pageWidth - margin - 5, cursorY + 5, { align: 'right' });

      cursorY += 10;
      
      // Taxe (Exemple fictif 15%) - À adapter selon ta logique
      // const tax = invoice.total * 0.15;
      // setFont('normal', 9, theme.text.secondary);
      // doc.text("Tax VAT 15% :", summaryX, cursorY + 5);
      // setFont('bold', 9, theme.text.primary);
      // doc.text(formatMoney(tax, invoice.currency), pageWidth - margin - 5, cursorY + 5, { align: 'right' });
      // cursorY += 10;

      // Total Due (Encadré couleur pleine)
      doc.setFillColor(theme.accent);
      doc.rect(summaryX - 5, cursorY, summaryWidth + 5, 14, 'F');
      
      setFont('bold', 10, theme.text.white);
      doc.text("TOTAL DUE :", summaryX, cursorY + 9);
      setFont('bold', 12, theme.text.white);
      doc.text(formatMoney(invoice.total, invoice.currency), pageWidth - margin - 5, cursorY + 9, { align: 'right' });

      // --- 4. PIED DE PAGE ---
      const footerY = pageHeight - 50;
      
      setFont('bold', 10, theme.text.primary);
      doc.text("Thank you for your Business", margin, footerY - 10);
      
      // Ligne de séparation
      doc.setDrawColor(theme.text.secondary);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY, pageWidth - margin, footerY);

      // 3 Colonnes du footer
      const col2X = margin + 60;
      const col3X = margin + 120;
      const footerTextY = footerY + 10;
      const footerContentY = footerTextY + 6;

      // Col 1: Questions
      setFont('bold', 9, theme.text.primary);
      doc.text("Questions?", margin, footerTextY);
      setFont('normal', 8, theme.text.secondary);
      doc.text(`Email us : ${user.email}`, margin, footerContentY);
      if(user.phone) doc.text(`Call us : ${user.phone}`, margin, footerContentY + 5);

      // Col 2: Payment Info
      setFont('bold', 9, theme.text.primary);
      doc.text("Payment Info :", col2X, footerTextY);
      setFont('normal', 8, theme.text.secondary);
      let payY = footerContentY;
      if (invoice.paymentMethod) {
          doc.text(`Method : ${invoice.paymentMethod}`, col2X, payY);
          payY += 5;
      }
      // Exemple de détails bancaires (à remplacer par les vrais)
      doc.text("Account : 1234 567 890", col2X, payY);
      doc.text("Bank : Nom de la banque", col2X, payY + 5);


      // Col 3: Terms
      setFont('bold', 9, theme.text.primary);
      doc.text("Terms & Conditions/Note:", col3X, footerTextY);
      setFont('normal', 7, theme.text.secondary);
      const terms = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt.";
      const splitTerms = doc.splitTextToSize(terms, pageWidth - col3X - margin);
      doc.text(splitTerms, col3X, footerContentY);

  } else {
      // =================================================================
      // 🛡️ DESIGN STANDARD (Inchangé)
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

      // ECHEANCE OPTIONNELLE
      let statusY = cursorY + 23; 
      
      if (invoice.dueDate) {
          const dueDateStr = new Date(invoice.dueDate).toLocaleDateString('fr-FR');
          doc.text(`Échéance : ${dueDateStr}`, rightX, statusY, { align: 'right' });
          statusY += 6; 
      }

      if (invoice.status === 'paid') {
          setFont('bold', 10, '#10b981'); 
          doc.text("PAYÉE", rightX, statusY, { align: 'right' });
      } else if (invoice.status === 'pending') {
          setFont('bold', 10, '#f59e0b'); 
          doc.text("EN ATTENTE", rightX, statusY, { align: 'right' });
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
          
          doc.text(formatMoney(item.price, invoice.currency), colPrice, cursorY, { align: 'right' });
          
          setFont('bold', 10, TEXT_DARK);
          doc.text(formatMoney(item.price * item.quantity, invoice.currency), colTotal - 5, cursorY, { align: 'right' });
          
          cursorY += 10;
      });
      
      doc.setDrawColor('#e2e8f0');
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 10;
      
      const summaryWidth = 100;
      const summaryX = pageWidth - margin - summaryWidth;

      if (invoice.notes || invoice.paymentMethod) {
          const notesWidth = pageWidth - margin*2 - summaryWidth - 10;
          let noteY = cursorY;

          if (invoice.paymentMethod) {
              setFont('bold', 9, TEXT_DARK); 
              doc.text(`Paiement via : ${invoice.paymentMethod}`, margin, noteY + 4);
              noteY += 8;
          }

          if (invoice.notes) {
              setFont('italic', 9, TEXT_GRAY);
              const splitNotes = doc.splitTextToSize(invoice.notes, notesWidth);
              doc.text(splitNotes, margin, noteY + 4);
          }
      }

      setFont('normal', 10, TEXT_GRAY);
      doc.text("Sous-total", summaryX + 5, cursorY);
      setFont('bold', 10, TEXT_DARK);
      doc.text(formatMoney(invoice.total, invoice.currency), pageWidth - margin - 5, cursorY, { align: 'right' });

      cursorY += 8;

      doc.setFillColor('#f8fafc');
      doc.roundedRect(summaryX, cursorY, summaryWidth, 14, 2, 2, 'F');

      const totalY = cursorY + 10;
      setFont('bold', 10, TEXT_DARK);
      doc.text("Total à payer", summaryX + 5, totalY);
      
      setFont('bold', 12, STANDARD_BLUE); 
      doc.text(formatMoney(invoice.total, invoice.currency), pageWidth - margin - 5, totalY, { align: 'right' });

      if (isStarter) {
        setFont('normal', 10, '#94a3b8');
        doc.text('Créé gratuitement avec Kayit', pageWidth / 2, pageHeight - 15, { align: 'center' });
        doc.setFontSize(8);
        doc.text('Passez en Pro pour retirer ce message', pageWidth / 2, pageHeight - 10, { align: 'center' });
      }
  }

  return doc;
};

// FONCTION AVEC SUPPORT MOBILE
export const generateInvoicePDF = async (invoice: Invoice, user: User) => {
  const doc = createInvoiceDoc(invoice, user);
  const fileName = invoice.number ? `Facture-${invoice.number}.pdf` : 'Facture.pdf';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile && navigator.share) {
    try {
      const blob = doc.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Facture ${invoice.number || ''}`,
          text: `Voici la facture de ${invoice.clientName}`,
        });
        return; 
      }
    } catch (error) {
      console.warn("Partage mobile annulé, on tente le téléchargement classique.");
    }
  }

  doc.save(fileName);
};

export const getInvoicePdfBlobUrl = (invoice: Invoice, user: User): string => {
  const doc = createInvoiceDoc(invoice, user);
  return doc.output('bloburl');
};