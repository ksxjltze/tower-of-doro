import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { AuthSession } from '@supabase/supabase-js'
import { Profile, SupabaseService } from '../supabase.service'
import { AvatarComponent } from '../avatar/avatar.component'

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css'],
  imports: [ReactiveFormsModule, AvatarComponent]
})
export class AccountComponent implements OnInit {
  loading = false
  profile: Profile | null;

  @Input()
  session: AuthSession | null;
  updateProfileForm;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly changeRef: ChangeDetectorRef,
    private formBuilder: FormBuilder
  ) {
    this.session = null;
    this.profile = null;

    this.updateProfileForm = this.formBuilder.group({
      username: '',
      avatar_url: '',
    })

  }

  get avatarUrl() {
    return this.updateProfileForm.value.avatar_url as string
  }

  async updateAvatar(event: string): Promise<void> {
    this.updateProfileForm.patchValue({
      avatar_url: event,
    })
    await this.updateProfile()
  }

  async ngOnInit(): Promise<void> {
    await this.supabase.refreshSession();
    this.changeRef.detach();

    this.session = await this.supabase.session;

    await this.getProfile();

    if (!this.profile)
      return;

    const { username, avatar_url } = this.profile;
    this.updateProfileForm.patchValue({
      username,
      avatar_url,
    })

    this.changeRef.detectChanges();
    this.changeRef.reattach();
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

  async updateProfile(): Promise<void> {
    try {
      this.loading = true
      if (!this.session)
        return;

      const { user } = this.session

      const username = this.updateProfileForm.value.username as string
      const avatar_url = this.updateProfileForm.value.avatar_url as string

      const { error } = await this.supabase.updateProfile({
        id: user.id,
        username,
        avatar_url,
      })
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loading = false;
      this.changeRef.detectChanges();
    }
  }

  async signOut() {
    await this.supabase.signOut()
    this.changeRef.detectChanges();
  }

  async resetPassword() {
    try {
      const { data, error } = await this.supabase.resetPassword(this.session?.user.email!);
      if (error)
        throw error;
      else
        alert("Check your email!");

    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.loading = false;
      this.changeRef.detectChanges();
    }

  }
}