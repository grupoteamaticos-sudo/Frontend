import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  BienesService,
  TipoBien,
  TipoRegistro,
  RegistroDetalle,
} from '../../shared/services/bienes.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-registro-bienes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registro-bienes.html',
  styleUrl: './registro-bienes.scss',
})
export class RegistroBienesPage {
  msg = '';
  err = '';

  tiposRegistro: TipoRegistro[] = [];
  tiposBien: TipoBien[] = [];

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private bienes: BienesService,
    private auth: AuthService
  ) {
    this.tiposRegistro = this.bienes.listTiposRegistro();
    this.tiposBien = this.bienes.listTiposBien();

    this.form = this.fb.group({
      tipoRegistro: ['ALTA', Validators.required],
      proveedor: [''],
      documento: [''],
      descripcion: [''],
      detalles: this.fb.array([]),
    });

    // ✅ arrancamos con 1 fila lista para llenar (así ya podés “agregar detalles”)
    this.addDetalle();
  }

  // ------ FormArray helpers ------
  get detallesFA(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  detalleFG(i: number): FormGroup {
    return this.detallesFA.at(i) as FormGroup;
  }

  addDetalle() {
    const fg = this.fb.group({
      codigo: ['', Validators.required],
      nombre: ['', Validators.required],
      tipo: ['EQUIPO' as TipoBien, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      nota: [''],
    });

    this.detallesFA.push(fg);
  }

  removeDetalle(i: number) {
    if (this.detallesFA.length <= 1) return; // mantener 1 mínimo
    this.detallesFA.removeAt(i);
  }

  // ------ Guardar ------
  submit() {
    this.msg = '';
    this.err = '';

    // valida formulario + detalles
    if (this.form.invalid) {
      this.err = 'Completá los campos requeridos (incluyendo detalles).';
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    const detalles: RegistroDetalle[] = (v.detalles || []).map((d: any) => ({
      bienId: '',
      codigo: String(d.codigo || '').trim(),
      nombre: String(d.nombre || '').trim(),
      tipo: d.tipo as TipoBien,
      cantidad: Number(d.cantidad || 0),
      nota: String(d.nota || ''),
    }));

    const user = this.auth.getUser()?.username || 'admin';

    const out = this.bienes.createRegistro({
      tipoRegistro: v.tipoRegistro as TipoRegistro,
      proveedor: String(v.proveedor || ''),
      documento: String(v.documento || ''),
      descripcion: String(v.descripcion || ''),
      detalles,
      user,
    });

    if (!out.ok) {
    this.err = out.message ?? 'No se pudo guardar el registro.';
    return;
  }

    this.msg = 'Registro guardado ✅ (y bienes actualizados en inventario)';
    // reset sin romper diseño
    this.form.reset({
      tipoRegistro: 'ALTA',
      proveedor: '',
      documento: '',
      descripcion: '',
    });
    // reset detalles
    while (this.detallesFA.length) this.detallesFA.removeAt(0);
    this.addDetalle();
  }
}