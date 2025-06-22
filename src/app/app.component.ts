import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { NavigationComponent } from "./navigation/navigation.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tower-of-doro';
  session;

  constructor(private readonly supabase: SupabaseService) {
    this.session = this.supabase.session;
  }

  ngOnInit() {
    this.supabase.authChanges((event, session) => {
      (this.session = session)
      console.log(event, session)

      if (event === 'INITIAL_SESSION') {
        // handle initial session
      } else if (event === 'SIGNED_IN') {
        // handle sign in event
      } else if (event === 'SIGNED_OUT') {
        // handle sign out event
      } else if (event === 'PASSWORD_RECOVERY') {
        // handle password recovery event
      } else if (event === 'TOKEN_REFRESHED') {
        // handle token refreshed event
      } else if (event === 'USER_UPDATED') {
        // handle user updated event
      }
    })
  }
}
