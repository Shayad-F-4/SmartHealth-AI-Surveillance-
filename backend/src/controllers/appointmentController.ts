import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

const prisma = new PrismaClient();

// Default 30-min time slots template if doctor hasn't configured custom slots
const DEFAULT_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

/**
 * GET /api/appointments/doctors
 * Get list of verified doctors for patient booking selection
 */
export async function getDoctors(_req: AuthRequest, res: Response) {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        verificationStatus: 'VERIFIED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            district: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({ doctors });
  } catch (err: any) {
    console.error('Error fetching doctors for appointment booking:', err);
    return res.status(500).json({ error: 'Failed to fetch doctor directory.' });
  }
}

/**
 * GET /api/appointments/doctors/:doctorId/slots?date=YYYY-MM-DD
 * Calculate available time slots for a doctor on a specific date
 */
export async function getDoctorSlots(req: AuthRequest, res: Response) {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid date parameter (YYYY-MM-DD).' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: { select: { name: true } } },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const targetDate = new Date(date);
    const dayOfWeekStr = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

    // Fetch existing booked or pending appointments on that date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'APPROVED', 'COMPLETED'],
        },
      },
      select: {
        startTime: true,
        status: true,
      },
    });

    const bookedTimesSet = new Set(existingAppointments.map((a) => a.startTime));

    // Check if doctor defined custom slots for this day
    const customSlots = await prisma.doctorSlot.findMany({
      where: { doctorId, dayOfWeek: dayOfWeekStr, isAvailable: true },
    });

    let rawSlots = DEFAULT_TIME_SLOTS;
    if (customSlots.length > 0) {
      // Build slot list from custom slots
      rawSlots = customSlots.map((s) => s.startTime);
    }

    const formattedSlots = rawSlots.map((time) => ({
      time,
      isAvailable: !bookedTimesSet.has(time),
      status: bookedTimesSet.has(time) ? 'BOOKED' : 'AVAILABLE',
    }));

    return res.json({
      doctorId,
      doctorName: doctor.user.name,
      date,
      dayOfWeek: dayOfWeekStr,
      slots: formattedSlots,
    });
  } catch (err: any) {
    console.error('Error fetching doctor slots:', err);
    return res.status(500).json({ error: 'Failed to fetch doctor time slots.' });
  }
}

/**
 * POST /api/appointments/book
 * Patient books a new appointment (Status defaults to PENDING)
 */
export async function bookAppointment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
    });

    if (!patient) {
      return res.status(403).json({ error: 'Only registered patients can book appointments.' });
    }

    const { doctorId, appointmentDate, startTime, type, reason } = req.body;

    if (!doctorId || !appointmentDate || !startTime) {
      return res.status(400).json({ error: 'Missing required booking fields (doctorId, appointmentDate, startTime).' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const bookingDate = new Date(appointmentDate);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Prevent double booking at exact time
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: { gte: startOfDay, lte: endOfDay },
        startTime,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (conflict) {
      return res.status(409).json({ error: 'Selected time slot is no longer available. Please choose another time.' });
    }

    // End time is start time + 30 mins
    const [hrs, mins] = startTime.split(':').map(Number);
    const endMin = (mins + 30) % 60;
    const endHr = hrs + Math.floor((mins + 30) / 60);
    const endTime = `${String(endHr).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        appointmentDate: bookingDate,
        startTime,
        endTime,
        type: type || 'IN_PERSON',
        reason: reason || 'General Consultation',
        status: 'PENDING',
      },
      include: {
        patient: { include: { user: { select: { name: true, phone: true } } } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    // Create Notification for Doctor
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: 'New Appointment Request',
        message: `Patient ${req.user.name} requested an appointment for ${appointmentDate} at ${startTime}.`,
        type: 'APPOINTMENT_REQUEST',
        priority: 'MEDIUM',
      },
    });

    await logAudit(req, 'BOOK_APPOINTMENT', 'APPOINTMENT', appointment.id, `Patient booked appointment with Dr. ${doctor.user.name}`);

    return res.status(201).json({
      message: 'Appointment booking request submitted successfully. Awaiting doctor approval.',
      appointment,
    });
  } catch (err: any) {
    console.error('Error booking appointment:', err);
    return res.status(500).json({ error: 'Failed to submit appointment booking.' });
  }
}

/**
 * GET /api/appointments/my-appointments
 * Patient fetches their upcoming & past appointments
 */
export async function getMyAppointmens(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
    });

    if (!patient) {
      return res.status(403).json({ error: 'Patient profile not found.' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: {
          include: {
            user: { select: { name: true, phone: true, avatarUrl: true } },
            hospital: { select: { name: true, address: true, district: true } },
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    return res.json({ appointments });
  } catch (err: any) {
    console.error('Error fetching patient appointments:', err);
    return res.status(500).json({ error: 'Failed to fetch appointment history.' });
  }
}

/**
 * GET /api/appointments/doctor/requests
 * Doctor fetches their pending appointment requests and schedule
 */
export async function getDoctorAppointmentRequests(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user.id },
    });

    if (!doctor) {
      return res.status(403).json({ error: 'Doctor profile not found.' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: {
        patient: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });

    const pending = appointments.filter((a) => a.status === 'PENDING');
    const upcoming = appointments.filter((a) => a.status === 'APPROVED');
    const completed = appointments.filter((a) => a.status === 'COMPLETED');
    const rejectedOrCancelled = appointments.filter((a) => a.status === 'REJECTED' || a.status === 'CANCELLED');

    return res.json({
      all: appointments,
      pending,
      upcoming,
      completed,
      rejectedOrCancelled,
    });
  } catch (err: any) {
    console.error('Error fetching doctor appointment requests:', err);
    return res.status(500).json({ error: 'Failed to fetch doctor appointments.' });
  }
}

/**
 * PUT /api/appointments/:id/status
 * Doctor approves or rejects an appointment request
 */
export async function updateAppointmentStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { id } = req.params;
    const { status, doctorNotes, meetingLink } = req.body;

    if (!status || !['APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status specified (APPROVED, REJECTED, CANCELLED, COMPLETED).' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true } },
      },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        doctorNotes: doctorNotes || appointment.doctorNotes,
        meetingLink: meetingLink || appointment.meetingLink,
      },
    });

    // Trigger notification to patient
    const dateFormatted = new Date(appointment.appointmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    let notifyTitle = `Appointment ${status}`;
    let notifyMsg = `Your appointment with Dr. ${appointment.doctor.user.name} on ${dateFormatted} at ${appointment.startTime} has been ${status.toLowerCase()}.`;

    if (doctorNotes) {
      notifyMsg += ` Note: "${doctorNotes}"`;
    }

    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        title: notifyTitle,
        message: notifyMsg,
        type: 'APPOINTMENT_UPDATE',
        priority: status === 'APPROVED' ? 'HIGH' : 'MEDIUM',
      },
    });

    await logAudit(req, 'UPDATE_APPOINTMENT_STATUS', 'APPOINTMENT', id, `Updated status to ${status} for patient ${appointment.patient.user.name}`);

    return res.json({
      message: `Appointment status updated to ${status}.`,
      appointment: updated,
    });
  } catch (err: any) {
    console.error('Error updating appointment status:', err);
    return res.status(500).json({ error: 'Failed to update appointment status.' });
  }
}

/**
 * POST /api/appointments/:id/cancel
 * Patient or Doctor cancels an appointment
 */
export async function cancelAppointment(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true } } },
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        doctorNotes: reason ? `Cancelled: ${reason}` : 'Cancelled by user',
      },
    });

    await logAudit(req, 'CANCEL_APPOINTMENT', 'APPOINTMENT', id, `Appointment cancelled by ${req.user.name}`);

    return res.json({
      message: 'Appointment cancelled successfully.',
      appointment: updated,
    });
  } catch (err: any) {
    console.error('Error cancelling appointment:', err);
    return res.status(500).json({ error: 'Failed to cancel appointment.' });
  }
}
