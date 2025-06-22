import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core'
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser'
import { SupabaseService } from '../supabase.service'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css'],
  imports: [CommonModule]
})
export class AvatarComponent {
  _avatarUrl: SafeResourceUrl | undefined;
  _uploadEnabled: boolean;
  _showText: boolean;
  _width: string;
  _height: string;

  uploading = false;

  @Input()
  set width(width: string) {
    this._width = width;
  }

  @Input()
  set height(height: string) {
    this._height = height;
  }

  @Input()
  set avatarUrl(url: string | null) {
    if (url) {
      this.downloadImage(url)
    }
  }

  @Input()
  set showText(show: boolean) {
    this._showText = show;
  }

  @Input()
  set doUpload(upload: boolean) {
    this._uploadEnabled = false;
  }

  @Output() upload = new EventEmitter<string>()

  constructor(
    private readonly supabase: SupabaseService,
    private readonly dom: DomSanitizer,
    private readonly changeRef: ChangeDetectorRef
  ) {
    this._uploadEnabled = false;
    this._showText = false;
    this._width = '64px';
    this._height = '64px';
  }

  async downloadImage(path: string) {
    try {
      const { data } = await this.supabase.downLoadImage(path)
      if (data instanceof Blob) {
        this._avatarUrl = this.dom.bypassSecurityTrustResourceUrl(URL.createObjectURL(data))
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error downloading image: ', error.message)
      }
    }
    finally {
      this.changeRef.detectChanges();
    }
  }

  async uploadAvatar(event: any) {
    try {
      this.uploading = true
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${Math.random()}.${fileExt}`

      await this.supabase.uploadAvatar(filePath, file)
      this.upload.emit(filePath)
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message)
      }
    } finally {
      this.uploading = false
      this.changeRef.detectChanges();
    }
  }
}