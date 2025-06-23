import { ChangeDetectorRef, Component } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { Router } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-reset',
  imports: [ReactiveFormsModule],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.css'
})
export class PasswordResetComponent {
  resetPasswordForm: FormGroup = new FormGroup({
    password: new FormControl(''),
    confirmPassword: new FormControl(''),
  });

  constructor(
    private readonly supabase: SupabaseService,
    private readonly changeRef: ChangeDetectorRef,
    private readonly router: Router
  ) {
  }

  async onSubmit(): Promise<void> {
    try {
      const password = this.resetPasswordForm.value.password;
      const passwordAgain = this.resetPasswordForm.value.confirmPassword;

      if (password != passwordAgain)
        throw new Error("Password doesn't match!");

      const { data, error } = await this.supabase.updateUserPassword(password)
      console.log(data);

      if (error)
        throw error
      else
        this.router.navigate(["/account"]);

    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.resetPasswordForm.reset()
      this.changeRef.detectChanges();
    }
  }
}
