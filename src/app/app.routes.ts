import { Routes } from '@angular/router';
import { EditorComponent } from './editor/editor.component';
import { GameComponent } from './game/game.component';
import { AccountComponent } from './account/account.component';
import { AuthComponent } from './auth/auth.component';

export const routes: Routes = [
    { path: 'editor', component: EditorComponent},
    { path: 'game', component: GameComponent},
    { path: 'login', component: AuthComponent },
    { path: 'account', component: AccountComponent },
    { path: '', component: GameComponent }
];
