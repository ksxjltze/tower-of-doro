import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core'
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms'
import { SupabaseService } from '../supabase.service'
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AuthComponent {
  loading = false
  loginForm: FormGroup = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(
    private readonly supabase: SupabaseService,
    private readonly changeRef: ChangeDetectorRef,
    private readonly router: Router
  ) {
  }

  async onSubmit(): Promise<void> {
    try {
      this.loading = true
      const email = this.loginForm.value.email as string
      const password = this.loginForm.value.password;

      const { data, error } = await this.supabase.signUpNewUser(email, password)
      if (data.user?.identities?.length == 0) //kinda hack to check if already signed up
        await this.supabase.signIn(email, password);
      else
        alert("CHECK YOUR EMAIL FOR CONFIRMATION")

      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loginForm.reset()
      this.loading = false

      this.changeRef.detectChanges();
    }
  }

  ngOnInit() {
    this.supabase.authChanges((event, session) => {
      console.log(event, session);
      if (event == 'SIGNED_IN')
        this.router.navigate(['/account']);
      
      this.changeRef.detectChanges();
    })
  }
}