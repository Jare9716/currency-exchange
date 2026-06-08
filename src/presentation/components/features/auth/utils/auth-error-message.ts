import { ApiError } from "@/domain/Errors";

const spanishAuthErrorMessages: Record<string, string> = {
  INVALID_CREDENTIALS: "Correo o contrasena incorrectos.",
  ACCOUNT_LOCKED: "La cuenta esta bloqueada temporalmente. Intenta nuevamente mas tarde.",
  ACCOUNT_INACTIVE: "La cuenta esta inactiva. Contacta al administrador.",
  TOKEN_INVALID: "La sesion no es valida. Inicia sesion nuevamente.",
  SESSION_EXPIRED: "La sesion expiro. Inicia sesion nuevamente.",
  NO_ACTIVE_MEMBERSHIP: "No tienes membresias activas para ingresar.",
  TENANT_SUSPENDED: "La empresa seleccionada esta suspendida. Contacta al administrador.",
  TENANT_INACTIVE: "La empresa seleccionada no esta activa.",
  NO_TENANT_CONTEXT: "No se encontro una empresa activa para esta sesion.",
  TENANT_HEADER_REQUIRED: "Debes seleccionar o indicar una empresa para continuar.",
  PERMISSION_DENIED: "No tienes permisos para realizar esta accion.",
  ROLE_PRIVILEGE_VIOLATION: "No puedes asignar un rol igual o superior al tuyo.",
  PASSWORD_EXPIRED: "Tu contrasena expiro. Debes cambiarla para continuar.",
  PASSWORD_INCORRECT: "La contrasena actual es incorrecta.",
  PASSWORD_WEAK: "La contrasena no cumple los requisitos de seguridad.",
  PASSWORD_REUSE: "La nueva contrasena no puede ser igual a una anterior.",
  INVITE_INVALID: "El enlace de invitacion no es valido o ya fue usado.",
  INVITE_EXPIRED: "El enlace de invitacion expiro. Solicita una nueva invitacion.",
  INVITE_ALREADY_ACCEPTED: "Esta invitacion ya fue aceptada.",
  TWO_FA_REQUIRED: "Debes completar la verificacion de dos factores para continuar.",
  TWO_FA_INVALID: "El codigo es invalido o expiro.",
  TWO_FA_ALREADY_ENABLED: "La verificacion de dos factores ya esta activa.",
  TWO_FA_NOT_ENABLED: "La verificacion de dos factores no esta activa.",
  TWO_FA_SETUP_REQUIRED: "Primero debes configurar la verificacion de dos factores.",
};

export const getSpanishAuthErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiError) {
    return spanishAuthErrorMessages[error.errorCode] ?? fallback;
  }

  return fallback;
};
