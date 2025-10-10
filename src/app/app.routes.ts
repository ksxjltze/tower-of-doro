import { Routes } from '@angular/router';
import { EditorComponent } from './editor/editor.component';
import { GameComponent } from './game/game.component';

export const routes: Routes = [
    { path: 'game', component: GameComponent},
    { path: '', component: GameComponent }
];
