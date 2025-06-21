import { Component } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { SupabaseService } from '../supabase.service'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  imports: [ReactiveFormsModule]
})
export class AuthComponent {
  loading = false
  signInForm : FormGroup = new FormGroup({
    email: new FormControl('')
  });

  constructor(
    private readonly supabase: SupabaseService
  ) {
  }

  async onSubmit(): Promise<void> {
    try {
      this.loading = true
      const email = this.signInForm.value.email as string
      const { error } = await this.supabase.signIn(email)
      if (error) throw error
      alert('Check your email for the login link!')
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.signInForm.reset()
      this.loading = false
    }
  }
}