import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

type LoginStep = 'CREDENCIALES' | 'OTP' | 'RECOVERY_REQUEST' | 'RECOVERY_RESET';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  step: LoginStep = 'CREDENCIALES';

  msg = '';
  err = '';

  tempToken = '';
  channelLabel = 'APP';
  devOtp = '';

  form!: FormGroup;
  otpForm!: FormGroup;
  recoveryRequestForm!: FormGroup;
  recoveryResetForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });

    this.otpForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    });

    this.recoveryRequestForm = this.fb.group({
      identifier: ['', Validators.required],
    });

    this.recoveryResetForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirm: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async submit() {
    this.msg = '';
    this.err = '';

    if (this.form.invalid) {
      this.err = 'Completá usuario y contraseña.';
      return;
    }

    const v = this.form.value;
    const out = await this.auth.loginStep1(
      String(v.username || ''),
      String(v.password || '')
    );

    if (!out.ok) {
      this.err = out.message;
      return;
    }

    this.tempToken = out.tempToken;
    this.channelLabel = out.channel || 'APP';
    this.devOtp = out.devOtp || '';
    this.step = 'OTP';
    this.msg = this.devOtp
      ? `Código generado correctamente. OTP dev: ${this.devOtp}`
      : 'Ingresá el código OTP para continuar.';
  }

  async verify() {
    this.msg = '';
    this.err = '';

    if (this.otpForm.invalid) {
      this.err = 'Ingresá el código de 6 dígitos.';
      return;
    }

    const code = String(this.otpForm.value.code || '');
    const out = await this.auth.verify2FA(this.tempToken, code);

    if (!out.ok) {
      this.err = out.message;
      return;
    }

    this.router.navigateByUrl('/dashboard');
  }

  goRecovery() {
    this.msg = '';
    this.err = '';
    this.devOtp = '';
    this.tempToken = '';
    this.step = 'RECOVERY_REQUEST';
  }

  async startRecovery() {
    this.msg = '';
    this.err = '';

    if (this.recoveryRequestForm.invalid) {
      this.err = 'Ingresá tu usuario o correo.';
      return;
    }

    const identifier = String(this.recoveryRequestForm.value.identifier || '');
    const res = await this.auth.forgotPasswordStart(identifier);

    if (!res?.ok) {
      this.err = res?.message || 'No se pudo iniciar la recuperación.';
      return;
    }

    this.tempToken = res.tempToken;
    this.channelLabel = res.channel || 'EMAIL';
    this.devOtp = res.devOtp || '';
    this.step = 'RECOVERY_RESET';

    this.msg = this.devOtp
      ? `OTP de recuperación generado. OTP dev: ${this.devOtp}`
      : `Código enviado a ${res.destination || 'tu correo'}.`;
  }

  async finishRecovery() {
    this.msg = '';
    this.err = '';

    if (this.recoveryResetForm.invalid) {
      this.err = 'Completá código y nueva contraseña.';
      return;
    }

    const v = this.recoveryResetForm.value;

    const res = await this.auth.forgotPasswordComplete({
      tempToken: this.tempToken,
      code: String(v.code || ''),
      newPassword: String(v.newPassword || ''),
      passwordConfirm: String(v.passwordConfirm || ''),
    });

    if (!res?.ok) {
      this.err = res?.message || 'No se pudo cambiar la contraseña.';
      return;
    }

    this.msg = 'Contraseña actualizada correctamente. Ya podés iniciar sesión.';
    this.step = 'CREDENCIALES';
    this.recoveryRequestForm.reset();
    this.recoveryResetForm.reset();
    this.tempToken = '';
    this.devOtp = '';
  }

  back() {
    this.msg = '';
    this.err = '';
    this.devOtp = '';
    this.tempToken = '';
    this.step = 'CREDENCIALES';
    this.otpForm.reset();
    this.recoveryResetForm.reset();
  }
}