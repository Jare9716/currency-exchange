# Plan: Integración de Transacciones y Refactor de CurrencyExchangeForm

Este plan detalla los pasos para migrar el módulo de transacciones desde mocks hacia la API real, alineándolo con los estándares de Clean Architecture y DDD.

## User Review Required

> [!WARNING]
> **Bloqueo Crítico:** Me pediste que ignoráramos los Shifts (Turnos) por ahora. Sin embargo, revisando la documentación de la API (`frontend-guide.md`), el endpoint `POST /transactions` **fallará con un error 404 (`NO_OPEN_SHIFT`)** si el operador no tiene un turno abierto en su sucursal. 
> 
> No puedo simplemente "saltarme" este requerimiento si la API real lo exige para dejar pasar la transacción.

## Open Questions

1. **¿Qué hacemos con el error `NO_OPEN_SHIFT`?**
   - *Opción A:* Integro la llamada real a la API, pero capturamos el error `NO_OPEN_SHIFT` y mostramos una notificación al usuario ("Debes abrir un turno para operar"). (Recomendado para mantenernos fieles a la API real).
   - *Opción B:* Mantenemos el `MockTransactionRepository` solo para las transacciones de manera temporal, hasta que el módulo de turnos esté implementado.
   - *Opción C:* ¿El equipo de backend tiene algún "flag" de desarrollo para deshabilitar temporalmente la validación de turnos?

## Proposed Changes

---

### Capa de Dominio (Domain)

#### [MODIFY] `src/domain/Transaction.ts`
- Renombrar y alinear tipos con el backend (ej. usar `transaction_type: 'buy' | 'sell'` en lugar de booleanos implícitos).
- Añadir interfaces para la paginación de respuestas de transacciones.

---

### Capa de Infraestructura (Infrastructure)

#### [NEW] `src/infrastructure/http/HttpTransactionRepository.ts`
- Crear el repositorio real que implemente `TransactionRepository`.
- Conectar `findAll()`, `save()` a los endpoints reales (e.g. `POST /api/v1/shifts/{shift_id}/transactions`).

#### [DELETE] `src/infrastructure/MockTransactionRepository.ts`
- Borrar el repositorio de mocks obsoleto.

---

### Capa de Casos de Uso (Use Cases)

#### [MODIFY] `src/use-cases/ExecuteTransaction.ts`
- Actualizar la lógica para pasar el payload correcto al `HttpTransactionRepository`.
- Manejar los errores tipados `CUSTOMER_FLAGGED` o `INSUFFICIENT_STOCK`.

---

### Capa de Presentación (Presentation)

#### [MODIFY] `src/presentation/components/features/exchange/CurrencyExchangeForm.tsx`
- Conectar el formulario al nuevo repositorio HTTP a través del Caso de Uso.
- Reemplazar el `Snackbar` local actual por el uso de `useNotificationStore` para capturar y renderizar los errores específicos del API (422 o 409).
- Quitar referencias al `MockTransactionRepository`.

## Verification Plan

### Automated Tests
- Actualizar o crear tests para `HttpTransactionRepository`.
- Arreglar tests rotos de `ExecuteTransaction.test.ts`.

### Manual Verification
- Iniciar la app y abrir el `CurrencyExchangeForm`.
- Ejecutar una venta/compra y verificar en la consola de red (Network Tab) el payload del POST.
- Forzar un `CUSTOMER_FLAGGED` (cliente reportado) y validar que el modal de error aparece.
