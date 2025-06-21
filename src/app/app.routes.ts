import { Routes } from '@angular/router';
import { EditorComponent } from './editor/editor.component';
import { GameComponent } from './game/game.component';
import { AccountComponent } from './account/account.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    { path: 'editor', component: EditorComponent},
    { path: 'game', component: GameComponent},
    { path: 'login', component: LoginComponent },
    { path: '', component: GameComponent }
];
