import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infra/database/database.service.js';
import { appointmentAuditLog } from '../../infra/database/schema.js';

/**
 * Valid state transition matrix for appointments.
 * Keys are current status, values are arrays of allowed target statuses.
 * Terminal states (attended, cancelled, no_show) have empty arrays.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled', 'no_show'],
  confirmed: ['waiting', 'cancelled', 'no_show'],
  waiting: ['attended', 'cancelled'],
  attended: [],
  cancelled: [],
  no_show: [],
};

@Injectable()
export class StateTransitionsService {
  constructor(
    private readonly dbService: DatabaseService,
  ) {}

  /**
   * Validate if a status transition is allowed.
   * Throws BadRequestException if not allowed.
   */
  validateTransition(
    currentStatus: string,
    newStatus: string,
  ): void {
    const allowed = VALID_TRANSITIONS[currentStatus];

    if (allowed === undefined) {
      throw new BadRequestException(
        `Estado desconocido: '${currentStatus}'. No se pueden determinar las transiciones permitidas.`,
      );
    }

    if (!allowed.includes(newStatus)) {
      const allowedList = allowed.length > 0
        ? allowed.join(', ')
        : 'ninguna (estado terminal)';

      throw new BadRequestException(
        `No se puede cambiar de '${currentStatus}' a '${newStatus}'. Transiciones permitidas: ${allowedList}`,
      );
    }
  }

  /**
   * Execute a status transition with audit log entry.
   * Returns the updated appointment.
   */
  async executeTransition(
    appointmentId: string,
    currentStatus: string,
    newStatus: string,
    changedBy: string | null,
    tenantId: string,
  ): Promise<void> {
    // Validate before executing
    this.validateTransition(currentStatus, newStatus);

    const action = newStatus === 'cancelled'
      ? 'cancelled' as const
      : 'status_changed' as const;

    const db = this.dbService.db;

    await db.insert(appointmentAuditLog).values({
      tenantId,
      appointmentId,
      action,
      oldValues: { status: currentStatus },
      newValues: { status: newStatus },
      changedBy,
      changedAt: new Date(),
    });
  }

  /**
   * Get allowed transitions from current status.
   */
  getAllowedTransitions(currentStatus: string): string[] {
    const allowed = VALID_TRANSITIONS[currentStatus];

    if (allowed === undefined) {
      throw new BadRequestException(
        `Estado desconocido: '${currentStatus}'`,
      );
    }

    return [...allowed];
  }
}
