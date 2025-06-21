import { Component } from '@angular/core';
import { SupabaseService } from '../supabase.service';
import { AccountComponent } from '../account/account.component';
import { AuthComponent } from '../auth/auth.component';
import { Session } from '@supabase/supabase-js';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [AccountComponent, AuthComponent, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  session: Session | null;

  constructor(private readonly supabase: SupabaseService) {
    this.session = this.supabase.session;
  }

  ngOnInit() {
    this.supabase.authChanges((_, session) => {
      (this.session = session)
    })
  }
}
