import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PosthogService } from '@core/services/posthog.service';

@Component({
  selector: 'c477-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  private readonly posthogService = inject(PosthogService);

  ngOnInit() {
    this.posthogService.initialize();
  }
}
