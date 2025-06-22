import { ChangeDetectorRef, Component } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { Profile, SupabaseService } from '../supabase.service';
import { Session } from '@supabase/supabase-js';

@Component({
  selector: 'app-navigation',
  imports: [AvatarComponent],
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {
  loading = false
  profile: Profile | null;
  session: Session | null;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly changeRef: ChangeDetectorRef,
  ) {
    this.session = null;
    this.profile = null;
  }

  async ngOnInit(): Promise<void> {
    await this.supabase.refreshSession();
    this.session = await this.supabase.session;
    await this.getProfile();

    if (!this.profile)
      return;

    const { username, avatar_url } = this.profile;
    this.changeRef.detectChanges();
  }

  async getProfile() {
    try {
      this.loading = true;
      if (!this.session)
        return;

      const { user } = this.session
      const { data: profile, error, status } = await this.supabase.profile(user)

      if (error && status !== 406) {
        throw error
      }

      if (profile) {
        this.profile = profile
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loading = false
    }
  }
}
