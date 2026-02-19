import { jsPDF } from 'jspdf';
import { Invoice, User } from '../types';

// Palette par défaut
const STANDARD_BLUE = '#2563eb'; 
const TEXT_DARK = '#1e293b'; 
const TEXT_GRAY = '#64748b'; 

const getTheme = (user: User) => {
  const isBusiness = user.plan === 'business';
  // 👇 C'est ici que la personnalisation se fait : on utilise la couleur de la marque
  const accentColor = (isBusiness && user.brandColor) ? user.brandColor : STANDARD_BLUE;
  
  return {
    text: {
      primary: '#0f172a',    
      secondary: '#64748b', 
      accent: accentColor,   
      white: '#ffffff',
    },
    bg: {
      header: accentColor,
      stripe: '#f8fafc',
    },
    border: '#e2e8f0',
    accent: accentColor
  };
};

// Formatage propre pour éviter les bugs d'affichage PDF
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
  // 💎 DESIGN BUSINESS (Personnalisable & Structuré)
  // =================================================================
  if (isBusiness) {
      
      // --- 1. EN-TÊTE (Gauche : Emetteur / Droite : Client) ---
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

      // INFO ENTREPRISE
      setFont('bold', 16, theme.accent); // Utilise la couleur de la marque
      doc.text(user.businessName || user.name, margin, leftY + 5);
      leftY += 12;

      setFont('bold', 8, TEXT_DARK);
      doc.text("ÉMIS PAR :", margin, leftY);
      setFont('normal', 9, TEXT_GRAY);
      
      const senderLines = doc.splitTextToSize(`${user.address || ''}\n${user.phone || ''}\n${user.email}`, 80);
      doc.text(senderLines, margin, leftY + 5);
      
      const finalLeftY = leftY + 5 + (senderLines.length * 4);

      // INFO FACTURE (Colonne Droite)
      let rightY = margin + 15;
      const rightColX = pageWidth - margin;

      setFont('bold', 32, theme.accent); 
      doc.text("FACTURE", rightColX, rightY, { align: 'right' });
      
      setFont('bold', 10, TEXT_DARK);
      doc.text(`#${invoice.number}`, rightColX, rightY + 10, { align: 'right' });
      
      setFont('normal', 9, TEXT_GRAY);
      doc.text(`Date : ${new Date(invoice.date).toLocaleDateString('fr-FR')}`, rightColX, rightY + 15, { align: 'right' });

      // 👇 AJOUT : Echéance et Statut
      let statusY = rightY + 21;
      
      if (invoice.dueDate) {
          doc.text(`Échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, rightColX, statusY, { align: 'right' });
          statusY += 6;
      }

      if (invoice.status === 'paid') {
          setFont('bold', 10, '#10b981'); // Vert
          doc.text("PAYÉE", rightColX, statusY, { align: 'right' });
      } else if (invoice.status === 'overdue') {
          setFont('bold', 10, '#ef4444'); // Rouge
          doc.text("EN RETARD", rightColX, statusY, { align: 'right' });
      } else if (invoice.status === 'pending') {
          setFont('bold', 10, '#f59e0b'); // Orange
          doc.text("EN ATTENTE", rightColX, statusY, { align: 'right' });
      }

      // CLIENT (Décalé à droite)
      rightY += 45; // Descendu un peu pour laisser la place au statut
      const clientBoxX = pageWidth / 2 + 20;
      
      setFont('bold', 8, TEXT_DARK);
      doc.text("FACTURÉ À :", clientBoxX, rightY);
      
      setFont('bold', 11, TEXT_DARK);
      doc.text(invoice.clientName, clientBoxX, rightY + 6);
      
      setFont('normal', 9, TEXT_GRAY);
      let clientText = "";
      if (invoice.clientAddress) clientText += `${invoice.clientAddress}\n`;
      if (invoice.clientEmail) clientText += `${invoice.clientEmail}`;
      
      const clientLines = doc.splitTextToSize(clientText, 70);
      doc.text(clientLines, clientBoxX, rightY + 11);
      
      const finalRightY = rightY + 11 + (clientLines.length * 4);

      cursorY = Math.max(finalLeftY, finalRightY) + 20;

      // --- 2. TABLEAU (Header coloré) ---
      const colDesc = margin;
      const colPrice = pageWidth - margin - 75;
      const colQty = pageWidth - margin - 45;
      const colTotal = pageWidth - margin;

      doc.setFillColor(theme.accent); // Fond couleur personnalisée
      doc.rect(margin, cursorY, pageWidth - (margin * 2), 10, 'F');
      
      const headerTextY = cursorY + 6.5;
      setFont('bold', 9, theme.text.white);
      doc.text('DESCRIPTION', colDesc + 5, headerTextY);
      doc.text('PRIX UNIT.', colPrice, headerTextY, { align: 'right' });
      doc.text('QTÉ', colQty, headerTextY, { align: 'center' });
      doc.text('TOTAL', colTotal - 5, headerTextY, { align: 'right' });

      cursorY += 10;

      invoice.items.forEach((item) => {
          const descWidth = colPrice - colDesc - 10;
          const splitDesc = doc.splitTextToSize(item.description, descWidth);
          const rowHeight = Math.max(12, splitDesc.length * 5 + 8);
          
          if (cursorY + rowHeight > pageHeight - 60) {
              doc.addPage();
              cursorY = margin;
          }

          doc.setDrawColor('#e2e8f0');
          doc.setLineWidth(0.5);
          
          setFont('bold', 9, TEXT_DARK);
          doc.text(splitDesc, colDesc + 5, cursorY + 6);
          
          setFont('normal', 9, TEXT_GRAY);
          doc.text(formatMoney(item.price, invoice.currency), colPrice, cursorY + 6, { align: 'right' });
          doc.text(item.quantity.toString(), colQty, cursorY + 6, { align: 'center' });
          
          setFont('bold', 9, TEXT_DARK);
          doc.text(formatMoney(item.price * item.quantity, invoice.currency), colTotal - 5, cursorY + 6, { align: 'right' });

          cursorY += rowHeight;
          doc.line(margin, cursorY, pageWidth - margin, cursorY);
      });

      // --- 3. TOTAUX ---
      cursorY += 5;
      const summaryWidth = 90;
      const summaryX = pageWidth - margin - summaryWidth;

      setFont('normal', 9, TEXT_GRAY);
      doc.text("Sous-total :", summaryX, cursorY + 5);
      setFont('bold', 9, TEXT_DARK);
      doc.text(formatMoney(invoice.total, invoice.currency), pageWidth - margin - 5, cursorY + 5, { align: 'right' });

      cursorY += 10;

      // Total (Encadré couleur personnalisée)
      doc.setFillColor(theme.accent);
      doc.rect(summaryX - 5, cursorY, summaryWidth + 5, 12, 'F');
      
      setFont('bold', 10, theme.text.white);
      doc.text("TOTAL À PAYER :", summaryX, cursorY + 8);
      setFont('bold', 12, theme.text.white);
      doc.text(formatMoney(invoice.total, invoice.currency), pageWidth - margin - 5, cursorY + 8, { align: 'right' });

      // 👇 AJOUT : CACHET / SIGNATURE (VERSION INTELLIGENTE)
      if (user.signature) {
          const maxStampW = 40; // Largeur max autorisée
          const maxStampH = 25; // Hauteur max autorisée
          const stampY = pageHeight - 75; // Position Y fixe (au dessus du pied de page)
          const centerX = pageWidth - margin - (maxStampW / 2); // Centre de la zone tampon

          // Texte "LA DIRECTION" centré
          setFont('bold', 8, TEXT_DARK);
          doc.text("LA DIRECTION", centerX, stampY, { align: 'center' });

          try {
              // Calcul pour garder le ratio (éviter l'écrasement)
              const imgProps = doc.getImageProperties(user.signature);
              const ratio = imgProps.width / imgProps.height;
              
              let finalW = maxStampW;
              let finalH = finalW / ratio;

              // Si trop haut, on réduit en se basant sur la hauteur
              if (finalH > maxStampH) {
                  finalH = maxStampH;
                  finalW = finalH * ratio;
              }

              // Centrage de l'image sous le texte
              const imgX = centerX - (finalW / 2);
              const imgY = stampY + 2;

              // Dessin avec rotation légère (-3°)
              doc.addImage(user.signature, 'PNG', imgX, imgY, finalW, finalH, undefined, 'FAST', -3);
          } catch (e) {
              console.warn("Erreur signature", e);
          }
      }

      // --- 4. PIED DE PAGE (3 Colonnes) ---
      const footerY = pageHeight - 40;
      doc.setDrawColor(theme.accent);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      // Contact
      setFont('bold', 8, TEXT_DARK);
      doc.text("NOUS CONTACTER", margin, footerY + 5);
      setFont('normal', 7, TEXT_GRAY);
      doc.text(user.email, margin, footerY + 10);
      if(user.phone) doc.text(user.phone, margin, footerY + 14);

      // Paiement
      const col2X = margin + 60;
      setFont('bold', 8, TEXT_DARK);
      doc.text("PAIEMENT", col2X, footerY + 5);
      setFont('normal', 7, TEXT_GRAY);
      let payY = footerY + 10;
      if (invoice.paymentMethod) {
          doc.text(`Via : ${invoice.paymentMethod}`, col2X, payY);
          payY += 4;
      }
      if (invoice.dueDate) {
          doc.text(`Échéance : ${new Date(invoice.dueDate).toLocaleDateString('fr-FR')}`, col2X, payY);
      }

      // Notes
      const col3X = margin + 120;
      setFont('bold', 8, TEXT_DARK);
      doc.text("NOTES", col3X, footerY + 5);
      if (invoice.notes) {
          setFont('normal', 7, TEXT_GRAY);
          const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - col3X - margin);
          doc.text(splitNotes, col3X, footerY + 10);
      }

  } else {
      // =================================================================
      // 🛡️ DESIGN STANDARD (Code existant inchangé)
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
      } else if (invoice.status === 'overdue') {
          setFont('bold', 10, '#ef4444'); 
          doc.text("EN RETARD", rightX, statusY, { align: 'right' });
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