import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

interface TicketData {
  reservationId: string;
  eventTitle: string;
  eventDescription: string;
  eventDate: Date;
  eventLocation: string;
  participantName: string;
  participantEmail: string;
  reservationStatus: string;
  createdAt: Date;
}

@Injectable()
export class PdfService {
  async generateTicket(data: TicketData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        // Buffer to store PDF
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Generate QR Code and create PDF
        QRCode.toDataURL(`RESERVATION:${data.reservationId}`, {
          width: 200,
          margin: 1,
        })
          .then((qrCodeDataUrl) => {
            // Header - Title
            doc
              .fontSize(28)
              .font('Helvetica-Bold')
              .fillColor('#2563eb')
              .text('TICKET DE RÉSERVATION', { align: 'center' });

            doc.moveDown(0.5);

            // Divider line
            doc
              .strokeColor('#2563eb')
              .lineWidth(2)
              .moveTo(50, doc.y)
              .lineTo(545, doc.y)
              .stroke();

            doc.moveDown(1.5);

            // Event Information Section
            doc
              .fontSize(18)
              .font('Helvetica-Bold')
              .fillColor('#1e293b')
              .text('INFORMATIONS ÉVÉNEMENT', { underline: true });

            doc.moveDown(0.5);

            // Event Title
            doc
              .fontSize(16)
              .font('Helvetica-Bold')
              .fillColor('#0f172a')
              .text(data.eventTitle);

            doc.moveDown(0.3);

            // Event Description
            doc
              .fontSize(11)
              .font('Helvetica')
              .fillColor('#475569')
              .text(data.eventDescription, {
                width: 495,
                align: 'justify',
              });

            doc.moveDown(1);

            // Event Details in a box
            const detailsY = doc.y;
            doc.rect(50, detailsY, 495, 80).fillAndStroke('#f1f5f9', '#cbd5e1');

            doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold');

            // Date
            doc.text('Date:', 70, detailsY + 15, { continued: true });
            doc.font('Helvetica').text(
              ` ${new Date(data.eventDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}`,
            );

            // Time
            doc.font('Helvetica-Bold').text('Heure:', 70, detailsY + 35, {
              continued: true,
            });
            doc.font('Helvetica').text(
              ` ${new Date(data.eventDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}`,
            );

            // Location
            doc.font('Helvetica-Bold').text('Lieu:', 70, detailsY + 55, {
              continued: true,
            });
            doc.font('Helvetica').text(` ${data.eventLocation}`);

            doc.moveDown(3);

            // Participant Information Section
            doc
              .fontSize(18)
              .font('Helvetica-Bold')
              .fillColor('#1e293b')
              .text('INFORMATIONS PARTICIPANT', { underline: true });

            doc.moveDown(0.5);

            const participantY = doc.y;
            doc
              .rect(50, participantY, 495, 60)
              .fillAndStroke('#fef3c7', '#fbbf24');

            doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold');

            // Participant Name
            doc.text('Nom:', 70, participantY + 15, { continued: true });
            doc.font('Helvetica').text(` ${data.participantName}`);

            // Participant Email
            doc.font('Helvetica-Bold').text('Email:', 70, participantY + 35, {
              continued: true,
            });
            doc.font('Helvetica').text(` ${data.participantEmail}`);

            doc.moveDown(2.5);

            // QR Code Section
            doc
              .fontSize(18)
              .font('Helvetica-Bold')
              .fillColor('#1e293b')
              .text('CODE QR', { align: 'center' });

            doc.moveDown(0.5);

            // Add QR Code
            const qrY = doc.y;
            doc.image(qrCodeDataUrl, 197.5, qrY, {
              width: 150,
              height: 150,
            });

            doc.y = qrY + 160;

            // Reservation Number
            doc
              .fontSize(10)
              .font('Helvetica')
              .fillColor('#64748b')
              .text(`N° Réservation: ${data.reservationId}`, {
                align: 'center',
              });

            doc.moveDown(0.3);

            // Status Badge
            doc
              .fontSize(12)
              .font('Helvetica-Bold')
              .fillColor('#16a34a')
              .text(data.reservationStatus, { align: 'center' });

            doc.moveDown(2);

            // Footer
            doc
              .strokeColor('#cbd5e1')
              .lineWidth(1)
              .moveTo(50, doc.y)
              .lineTo(545, doc.y)
              .stroke();

            doc.moveDown(0.5);

            doc
              .fontSize(9)
              .font('Helvetica')
              .fillColor('#94a3b8')
              .text(
                'Ce ticket est personnel et ne peut être cédé à un tiers.',
                { align: 'center' },
              );

            doc.text(
              "Veuillez présenter ce ticket (imprimé ou sur mobile) à l'entrée de l'événement.",
              { align: 'center' },
            );

            doc.moveDown(0.5);

            doc
              .fontSize(8)
              .fillColor('#cbd5e1')
              .text(
                `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
                { align: 'center' },
              );

            // Finalize PDF
            doc.end();
          })
          .catch((error: Error) => {
            reject(error);
          });
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
