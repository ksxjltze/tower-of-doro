import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SupabaseService } from './supabase.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'tower-of-doro';
}
