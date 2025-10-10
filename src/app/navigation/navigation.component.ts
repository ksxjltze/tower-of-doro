import { ChangeDetectorRef, Component } from '@angular/core';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {
  loading = false

  constructor(
    private readonly changeRef: ChangeDetectorRef,
  ) {

  }

  async ngOnInit(): Promise<void> {
    this.changeRef.detectChanges();
  }
}
