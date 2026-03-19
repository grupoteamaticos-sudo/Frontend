import { Component } from '@angular/core';
import { UserMenu } from '../user-menu/user-menu';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [UserMenu],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {}