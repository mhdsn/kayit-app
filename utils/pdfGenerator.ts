import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Invoice, User } from '../types';

// Fonction pour formater la devise
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency }).format(amount);
};

// Fonction pour formater la date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const generateAndDownloadPDF = async (invoice: Invoice, user: User) => {
  // 1. Créer un élément HTML temporaire pour la facture (invisible pour l'utilisateur)
  const element = document.createElement('div');
  element.style.position = 'absolute';
  element.style.left = '-9999px';
  element.style.top = '0';
  element.style.width = '800px'; // Largeur fixe A4
  element.style.padding = '40px';
  element.style.backgroundColor = 'white';
  element.style.fontFamily = 'Arial, sans-serif';
  element.style.color = '#333';
  
  // HTML de la facture (Design propre et simple pour le PDF)
  element.innerHTML = `
    <div style="padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 50px;">
        <div>
           ${user.logo ? `<img src="${user.logo}" style="height: 60px; object-fit: contain; margin-bottom: 15px;" />` : ''}
           <h1 style="font-size: 24px; color: #1e293b; margin: 0;">${user.businessName || user.name}</h1>
           <p style="font-size: 14px; color: #64748b; margin-top: 5px;">${user.email}<br/>${user.phone || ''}</p>
        </div>
        <div style="text-align: right;">
           <h2 style="font-size: 32px; color: #2563eb; margin: 0;">FACTURE</h2>
           <p style="font-size: 16px; font-weight: bold; margin: 5px 0 0;">#${invoice.number}</p>
           <p style="font-size: 14px; color: #64748b; margin-top: 5px;">Date : ${formatDate(invoice.date)}</p>
           ${invoice.dueDate ? `<p style="font-size: 14px; color: #ef4444; margin-top: 2px;">Échéance : ${formatDate(invoice.dueDate)}</p>` : ''}
        </div>
      </div>

      <div style="margin-bottom: 40px; background-color: #f8fafc; padding: 20px; border-radius: 8px;">
        <p style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 10px;">Facturé à :</p>
        <h3 style="font-size: 18px; margin: 0 0 5px;">${invoice.clientName}</h3>
        <p style="font-size: 14px; color: #475569;">${invoice.clientEmail || ''}<br/>${invoice.clientAddress || ''}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #1e293b; color: white;">
            <th style="padding: 12px; text-align: left; font-size: 12px; border-radius: 6px 0 0 6px;">DESCRIPTION</th>
            <th style="padding: 12px; text-align: right; font-size: 12px;">QTÉ</th>
            <th style="padding: 12px; text-align: right; font-size: 12px;">PRIX</th>
            <th style="padding: 12px; text-align: right; font-size: 12px; border-radius: 0 6px 6px 0;">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, index) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 15px 10px;">
                <div style="font-weight: bold; font-size: 14px;">${item.description}</div>
              </td>
              <td style="padding: 15px 10px; text-align: right; font-size: 14px;">${item.quantity}</td>
              <td style="padding: 15px 10px; text-align: right; font-size: 14px;">${formatCurrency(item.price, invoice.currency)}</td>
              <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 14px;">${formatCurrency(item.quantity * item.price, invoice.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div style="width: 250px;">
          <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #1e293b;">
            <span style="font-weight: bold; font-size: 16px;">TOTAL</span>
            <span style="font-weight: bold; font-size: 20px; color: #2563eb;">${formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 5px;">Notes :</p>
          <p style="font-size: 13px; color: #334155;">${invoice.notes}</p>
        </div>
      ` : ''}
      
      <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8;">
        Facture générée par Kayit.
      </div>
    </div>
  `;

  document.body.appendChild(element);

  try {
    // 2. Transformer le HTML en image (Canvas)
    // scale: 2 améliore la netteté sur mobile (Retina display)
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    
    // 3. Créer le PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const fileName = `Facture-${invoice.number}.pdf`;

    // 4. LOGIQUE MOBILE INTELLIGENTE 📱
    // On vérifie si le navigateur supporte le partage de fichiers (Mobile)
    if (navigator.share) {
      // On transforme le PDF en "Blob" (Fichier virtuel)
      const blob = pdf.output('blob');
      const file = new File([blob], fileName, { type: 'application/pdf' });

      // On vérifie si on peut partager ce fichier
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Facture #${invoice.number}`,
            text: `Voici la facture #${invoice.number} de ${invoice.clientName}`,
          });
          return; // Si le partage a marché, on s'arrête là
        } catch (shareError) {
          console.log('Partage annulé ou erreur, fallback sur téléchargement classique');
        }
      }
    }

    // 5. FALLBACK DESKTOP (Ou si le partage mobile échoue)
    pdf.save(fileName);

  } catch (error) {
    console.error("Erreur lors de la génération du PDF", error);
    alert("Impossible de générer le PDF. Réessayez.");
  } finally {
    // Nettoyage
    document.body.removeChild(element);
  }
};