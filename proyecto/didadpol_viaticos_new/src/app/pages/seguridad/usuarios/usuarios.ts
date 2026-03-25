import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { SeguridadService, Usuario, Rol } from '../../../shared/services/seguridad.service';
import { AuditService } from '../../../shared/services/audit.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-seg-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class SegUsuarios implements OnInit {
  usuarios: Usuario[] = [];
  rolesCatalogo: Rol[] = [];
  empleados: any[] = []; // Para guardar la lista de empleados

  msg = '';
  err = '';
  loading = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private seg: SeguridadService,
    private audit: AuditService,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      idEmpleado: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      activo: [true],
      roles: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    this.loading = true;
    try {
      const [u, r, e] = await Promise.all([
        this.seg.listUsuarios(),
        this.seg.listRoles(),
        this.seg.listEmpleadosDisponibles()
      ]);
      this.usuarios = u;
      this.rolesCatalogo = r;
      this.empleados = e;
    } catch (e: any) {
      this.err = 'Error al cargar datos.';
    } finally {
      this.loading = false;
    }
  }

  async submit() {
    this.msg = '';
    this.err = '';
    if (this.form.invalid) {
      this.err = 'Complete los campos requeridos.';
      return;
    }

    try {
      const v = this.form.value;
      await this.seg.createUsuario({
        idEmpleado: v.idEmpleado,
        username: v.username,
        email: v.email,
        password: v.password,
        activo: !!v.activo,
        roleId: v.roles,
      });

      this.msg = 'Usuario creado ✅';
      this.form.reset({ activo: true, idEmpleado: '', roles: '' });
      await this.loadAll();
    } catch (e: any) {
      this.err = e?.error?.message || 'Error al crear usuario.';
    }
  }

  async toggle(u: Usuario) {
    try {
      await this.seg.toggleActivo(u.id);
      await this.loadAll();
    } catch (e) { this.err = 'Error al cambiar estado.'; }
  }

  async delete(u: Usuario) {
    if(!confirm('¿Inactivar usuario?')) return;
    try {
      await this.seg.deleteUsuario(u.id);
      await this.loadAll();
    } catch (e) { this.err = 'Error al inactivar.'; }
  }

  rolName(id: string) {
    return this.rolesCatalogo.find(r => r.id === id)?.name || '—';
  }

  roles() { return this.rolesCatalogo; }
}