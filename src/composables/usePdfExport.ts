import { ref } from 'vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Article } from '@shared/types';

export function usePdfExport() {
  const exporting = ref(false);
  const error = ref<string | null>(null);

  async function exportArticleToPdf(article: Article, bodyElement: HTMLElement | null) {
    if (!article || !bodyElement) return;

    exporting.value = true;
    error.value = null;

    try {
      // Create a container with article content for PDF export
      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.fontFamily = 'Vazirmatn, Tahoma, sans-serif';
      container.style.lineHeight = '1.95';
      container.style.color = '#1F2421';
      container.style.fontSize = '16px';
      container.style.direction = 'rtl';
      container.style.textAlign = 'right';
      container.style.backgroundColor = '#ffffff';

      // Add title
      const titleElement = document.createElement('h1');
      titleElement.textContent = article.title;
      titleElement.style.fontSize = '28px';
      titleElement.style.fontWeight = 'bold';
      titleElement.style.marginBottom = '16px';
      titleElement.style.lineHeight = '1.4';
      titleElement.style.marginTop = '0';
      container.appendChild(titleElement);

      // Add metadata
      const metaElement = document.createElement('div');
      metaElement.style.fontSize = '12px';
      metaElement.style.color = '#666';
      metaElement.style.marginBottom = '20px';
      metaElement.style.borderBottom = '1px solid #ddd';
      metaElement.style.paddingBottom = '12px';
      let metaText = '';
      if (article.readingTime) {
        metaText += `⏱ ${article.readingTime} | `;
      }
      if (article.chapterSlug) {
        metaText += `فصل ${article.chapterSlug}`;
      }
      if (metaText) metaElement.textContent = metaText;
      metaElement.innerHTML += `<br>تاریخ انتشار: ${new Date(article.publishedAt).toLocaleDateString('fa-IR')}`;
      container.appendChild(metaElement);

      // Clone and append the article body
      const bodyClone = bodyElement.cloneNode(true) as HTMLElement;
      container.appendChild(bodyClone);

      // Add footer with reference link
      const footer = document.createElement('div');
      footer.style.marginTop = '40px';
      footer.style.paddingTop = '20px';
      footer.style.borderTop = '1px solid #ddd';
      footer.style.fontSize = '12px';
      footer.style.color = '#999';
      footer.textContent = `منبع: ${window.location.href}`;
      container.appendChild(footer);

      // Append to body temporarily for rendering
      document.body.appendChild(container);

      // Convert HTML to canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Calculate PDF dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190; // A4 width with margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight() - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`${article.slug}.pdf`);
    } catch (e) {
      error.value = (e as Error).message || 'خطا در تولید PDF';
      console.error('PDF export error:', e);
    } finally {
      exporting.value = false;
    }
  }

  return {
    exporting,
    error,
    exportArticleToPdf,
  };
}
