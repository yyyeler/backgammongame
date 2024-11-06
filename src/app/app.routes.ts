import { Routes } from '@angular/router';
import { GameComponent } from '../game/game.component';
import { MainComponent } from '../main/main.component';

export const routes: Routes = [
    { path: 'game', component: GameComponent },
    { path: '', component: MainComponent }
];
