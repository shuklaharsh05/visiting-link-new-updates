import { authenticatedFetch } from './auth.js';

// Create a new appointment (public endpoint; token used if available)
export async function createAppointment({ cardId, name, email, phone, message, appointmentDate, appointmentTime }) {
  const payload = {
    cardId,
    name,
    email,
    phone,
    message: message && message.trim().length > 0 ? message : 'Appointment request from digital card',
    ...(appointmentDate ? { appointmentDate } : {}),
    ...(appointmentTime ? { appointmentTime } : {})
  };

  return authenticatedFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}


