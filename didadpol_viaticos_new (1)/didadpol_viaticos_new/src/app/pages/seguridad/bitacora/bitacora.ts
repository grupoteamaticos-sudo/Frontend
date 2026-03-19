import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditService, AuditEvent } from '../../../shared/services/audit.service';

@Component({
  selector: 'app-seg-bitacora',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bitacora.html',
  styleUrl: './bitacora.scss',
})
export class SegBitacora {
  events: AuditEvent[] = [];

  constructor(private audit: AuditService) {
    this.refresh();
  }

  refresh() {
    this.events = this.audit.list();
  }

  clear() {
    this.audit.clear();
    this.refresh();
  }
}