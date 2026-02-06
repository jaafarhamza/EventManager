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

interface EventStatsData {
  eventId: string;
  eventTitle: string;
  eventDescription: string;
  eventDate: Date;
  eventLocation: string;
  capacity: number;
  availableSeats: number;
  status: string;
  reservationsCount: {
    pending: number;
    confirmed: number;
    refused: number;
    canceled: number;
    total: number;
  };
  fillRate: number;
  participants: Array<{
    name: string;
    email: string;
    status: string;
    reservedAt: Date;
  }>;
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

  async generateEventStats(data: EventStatsData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        // Header
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#2563eb')
          .text('RAPPORT STATISTIQUES ÉVÉNEMENT', { align: 'center' });

        doc.moveDown(0.3);

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#64748b')
          .text(
            `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
            { align: 'center' },
          );

        doc.moveDown(0.5);

        // Divider
        doc
          .strokeColor('#2563eb')
          .lineWidth(2)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();

        doc.moveDown(1.5);

        // Event Information
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor('#1e293b')
          .text('INFORMATIONS ÉVÉNEMENT', { underline: true });

        doc.moveDown(0.5);

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor('#0f172a')
          .text(data.eventTitle);

        doc.moveDown(0.3);

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor('#475569')
          .text(data.eventDescription, { width: 495, align: 'justify' });

        doc.moveDown(1);

        // Event Details Box
        const detailsY = doc.y;
        doc.rect(50, detailsY, 495, 100).fillAndStroke('#f1f5f9', '#cbd5e1');

        doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold');

        doc.text('Date:', 70, detailsY + 15, { continued: true });
        doc.font('Helvetica').text(
          ` ${new Date(data.eventDate).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })} à ${new Date(data.eventDate).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}`,
        );

        doc.font('Helvetica-Bold').text('Lieu:', 70, detailsY + 35, {
          continued: true,
        });
        doc.font('Helvetica').text(` ${data.eventLocation}`);

        doc.font('Helvetica-Bold').text('Capacité:', 70, detailsY + 55, {
          continued: true,
        });
        doc.font('Helvetica').text(` ${data.capacity} places`);

        doc
          .font('Helvetica-Bold')
          .text('Places disponibles:', 70, detailsY + 75, {
            continued: true,
          });
        doc.font('Helvetica').text(` ${data.availableSeats} places`);

        doc.moveDown(4);

        // Statistics Section
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor('#1e293b')
          .text('STATISTIQUES', { underline: true });

        doc.moveDown(0.5);

        // Stats Grid
        const statsY = doc.y;
        const colWidth = 120;
        const rowHeight = 70;

        // Fill Rate Box
        doc
          .rect(50, statsY, colWidth, rowHeight)
          .fillAndStroke('#dbeafe', '#3b82f6');
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('TAUX DE REMPLISSAGE', 55, statsY + 15, {
            width: colWidth - 10,
          });
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#2563eb')
          .text(`${data.fillRate}%`, 55, statsY + 35, {
            width: colWidth - 10,
            align: 'center',
          });

        // Total Reservations Box
        doc
          .rect(50 + colWidth + 5, statsY, colWidth, rowHeight)
          .fillAndStroke('#dcfce7', '#22c55e');
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#166534')
          .text('TOTAL RÉSERVATIONS', 55 + colWidth + 5, statsY + 15, {
            width: colWidth - 10,
          });
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#16a34a')
          .text(
            `${data.reservationsCount.total}`,
            55 + colWidth + 5,
            statsY + 35,
            {
              width: colWidth - 10,
              align: 'center',
            },
          );

        // Confirmed Box
        doc
          .rect(50 + colWidth * 2 + 10, statsY, colWidth, rowHeight)
          .fillAndStroke('#fef3c7', '#eab308');
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#854d0e')
          .text('CONFIRMÉES', 55 + colWidth * 2 + 10, statsY + 15, {
            width: colWidth - 10,
          });
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#ca8a04')
          .text(
            `${data.reservationsCount.confirmed}`,
            55 + colWidth * 2 + 10,
            statsY + 35,
            { width: colWidth - 10, align: 'center' },
          );

        // Second row
        const statsY2 = statsY + rowHeight + 10;

        // Pending Box
        doc
          .rect(50, statsY2, colWidth, rowHeight)
          .fillAndStroke('#fef3c7', '#f59e0b');
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#92400e')
          .text('EN ATTENTE', 55, statsY2 + 15, { width: colWidth - 10 });
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#d97706')
          .text(`${data.reservationsCount.pending}`, 55, statsY2 + 35, {
            width: colWidth - 10,
            align: 'center',
          });

        // Refused Box
        doc
          .rect(50 + colWidth + 5, statsY2, colWidth, rowHeight)
          .fillAndStroke('#fee2e2', '#ef4444');
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#991b1b')
          .text('REFUSÉES', 55 + colWidth + 5, statsY2 + 15, {
            width: colWidth - 10,
          });
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#dc2626')
          .text(
            `${data.reservationsCount.refused}`,
            55 + colWidth + 5,
            statsY2 + 35,
            {
              width: colWidth - 10,
              align: 'center',
            },
          );

        // Canceled Box
        doc
          .rect(50 + colWidth * 2 + 10, statsY2, colWidth, rowHeight)
          .fillAndStroke('#f3f4f6', '#6b7280');
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#374151')
          .text('ANNULÉES', 55 + colWidth * 2 + 10, statsY2 + 15, {
            width: colWidth - 10,
          });
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor('#4b5563')
          .text(
            `${data.reservationsCount.canceled}`,
            55 + colWidth * 2 + 10,
            statsY2 + 35,
            { width: colWidth - 10, align: 'center' },
          );

        doc.y = statsY2 + rowHeight + 20;

        // Participants List
        if (data.participants.length > 0) {
          doc
            .fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#1e293b')
            .text('LISTE DES PARTICIPANTS', { underline: true });

          doc.moveDown(0.5);

          // Table Header
          const tableTop = doc.y;
          doc.rect(50, tableTop, 495, 25).fillAndStroke('#e2e8f0', '#cbd5e1');

          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#0f172a')
            .text('Nom', 60, tableTop + 8, { width: 150 })
            .text('Email', 220, tableTop + 8, { width: 180 })
            .text('Statut', 410, tableTop + 8, { width: 80 })
            .text('Date', 490, tableTop + 8, { width: 50 });

          let currentY = tableTop + 25;

          // Limit to first 20 participants to avoid PDF overflow
          const participantsToShow = data.participants.slice(0, 20);

          participantsToShow.forEach((participant, index) => {
            // Check if we need a new page
            if (currentY > 700) {
              doc.addPage();
              currentY = 50;
            }

            const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
            doc.rect(50, currentY, 495, 25).fillAndStroke(bgColor, '#e2e8f0');

            doc
              .fontSize(9)
              .font('Helvetica')
              .fillColor('#334155')
              .text(participant.name, 60, currentY + 8, { width: 150 })
              .text(participant.email, 220, currentY + 8, { width: 180 });

            // Status with color
            let statusColor = '#64748b';
            if (participant.status === 'CONFIRMED') statusColor = '#16a34a';
            else if (participant.status === 'PENDING') statusColor = '#d97706';
            else if (participant.status === 'REFUSED') statusColor = '#dc2626';
            else if (participant.status === 'CANCELED') statusColor = '#6b7280';

            doc
              .fillColor(statusColor)
              .font('Helvetica-Bold')
              .text(participant.status, 410, currentY + 8, { width: 80 });

            doc
              .fillColor('#64748b')
              .font('Helvetica')
              .text(
                new Date(participant.reservedAt).toLocaleDateString('fr-FR'),
                490,
                currentY + 8,
                { width: 50 },
              );

            currentY += 25;
          });

          if (data.participants.length > 20) {
            doc.moveDown(1);
            doc
              .fontSize(9)
              .font('Helvetica-Oblique')
              .fillColor('#64748b')
              .text(
                `... et ${data.participants.length - 20} autres participants`,
                { align: 'center' },
              );
          }
        }

        // Footer
        doc.moveDown(2);
        doc
          .strokeColor('#cbd5e1')
          .lineWidth(1)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();

        doc.moveDown(0.5);

        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#94a3b8')
          .text('Rapport confidentiel - Réservé aux administrateurs', {
            align: 'center',
          });

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}
